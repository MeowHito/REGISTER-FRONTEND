import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Table, Tooltip } from "antd";
import useMe from "hooks/useMe";
import React, { isValidElement, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMenuPermission, mergePermissions } from "utils/index";

// Pages hand us <Button icon onClick>label</Button> for extra actions; show them
// as regular menu rows so every row menu looks the same.
const toMenuItem = (btn, key) => {
  if (!isValidElement(btn)) return null;
  const p = btn.props || {};
  if (btn.type === Button) {
    return {
      key,
      icon: p.icon,
      label: p.children,
      danger: p.danger || p.color === "danger",
      disabled: p.disabled || p.loading,
      onClick: p.onClick,
    };
  }
  return { key, label: btn, onClick: p.onClick };
};

export default function PermissionActionTable({
  totalText,
  totalData,
  createButtonText,
  customCreate,
  columns,
  rawId,
  onView,
  onCreate,
  onEdit,
  onDelete,
  extraActions,
  extraPosition = "end",
  inlineActions = false,
  recordPermission = false,
  headerExtra,
  ...props
}) {
  const { data: me } = useMe({ retry: 0 });
  const { t } = useTranslation();
  const [menuPerm, setMenuPerm] = useState({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  })

  useEffect(() => {
    setMenuPerm(getMenuPermission(rawId, me))
  }, [rawId, me])

  const extendedColumns = useMemo(() => {
    return [
      ...columns,
      (menuPerm.canRead && onView) ||
        (menuPerm.canUpdate && onEdit) ||
        (menuPerm.canDelete && onDelete) ||
        extraActions ? {
        title: "",
        key: "manage",
        align: "center",
        width: inlineActions ? undefined : 64,
        fixed: 'right',
        render: (_, record) => {
          const finalPerm = mergePermissions(menuPerm, record, recordPermission);

          const extra = extraActions ? (extraActions(record) || []).filter(Boolean) : [];
          const extraItems = extra.map((btn, i) => toMenuItem(btn, `extra-${i}`)).filter(Boolean);

          const actions = [];
          if (extraPosition === "start") actions.push(...extraItems);

          if (finalPerm.canRead && onView) {
            actions.push({ key: "view", icon: <EyeOutlined />, label: t("general.view"), onClick: () => onView?.(record) });
          }
          if (finalPerm.canUpdate && onEdit) {
            actions.push({ key: "edit", icon: <EditOutlined />, label: t("general.buttonEdit"), onClick: () => onEdit?.(record) });
          }
          if (extraPosition === "end") actions.push(...extraItems);
          if (finalPerm.canDelete && onDelete) {
            if (actions.length) actions.push({ type: "divider" });
            actions.push({
              key: "delete",
              icon: <DeleteOutlined />,
              danger: true,
              label: t("general.buttonDelete"),
              onClick: () => onDelete?.(record),
            });
          }

          if (actions.length === 0) return null;

          // Icon buttons right in the row (label in a tooltip), for tables whose rows are opened all the time.
          if (inlineActions) {
            return (
              <div className="flex items-center justify-center gap-1.5">
                {actions.filter((a) => a.type !== "divider").map((a) => (
                  <Tooltip key={a.key} title={a.label}>
                    <Button
                      size="small"
                      icon={a.icon}
                      aria-label={typeof a.label === "string" ? a.label : a.key}
                      danger={a.danger}
                      disabled={a.disabled}
                      type={a.key === "edit" ? "primary" : "default"}
                      ghost={a.key === "edit"}
                      onClick={(e) => { e.stopPropagation(); a.onClick?.(); }}
                    />
                  </Tooltip>
                ))}
              </div>
            );
          }

          return (
            <Dropdown menu={{ items: actions }} trigger={["click"]} placement="bottomRight">
              <Button type="text" shape="circle" icon={<MoreOutlined className="text-lg" />} aria-label={t("general.manage")} />
            </Dropdown>
          );
        },
      } : null,
    ].filter(Boolean);
  }, [columns, me, menuPerm, onView, onEdit, onDelete, extraActions, t, rawId, recordPermission, inlineActions]);

  const createButton = menuPerm.canCreate
    ? customCreate || (onCreate ? (
      <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
        {createButtonText}
      </Button>
    ) : null)
    : null;

  return (
    <div className="bo-card overflow-hidden">
      {(totalText || createButton || headerExtra) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 md:px-5 py-4 border-b border-[#e5e5ea]">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="m-0 text-[17px] font-semibold text-[#1d1d1f] truncate">{totalText}</h2>
            {totalData ? (
              <span className="inline-flex items-center justify-center min-w-[26px] h-6 px-2 rounded-full bg-[rgba(0,0,0,0.06)] text-xs font-semibold text-[#424245]">
                {totalData}
              </span>
            ) : null}
          </div>
          <div className="flex items-center flex-wrap gap-2">
            {headerExtra}
            {createButton}
          </div>
        </div>
      )}
      <Table
        {...props}
        bordered={false}
        className={`bo-flush-table ${props.className || ""}`}
        columns={extendedColumns}
        pagination={props.pagination === false ? false : {
          showTotal: (count, range) => t("back.shell.showing", { from: range[0], to: range[1], total: count }),
          ...props.pagination,
        }}
      />
    </div>
  );
}
