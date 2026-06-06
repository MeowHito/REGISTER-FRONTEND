import {
  AppstoreAddOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Table } from "antd";
import useMe from "hooks/useMe";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMenuPermission, mergePermissions } from "utils/index";

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
  recordPermission = false,
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
        title: t("general.manage"),
        key: "manage",
        align: "center",
        fixed: 'right',
        render: (_, record) => {
          const finalPerm = mergePermissions(menuPerm, record, recordPermission);

          const actions = [];

          if (extraActions && extraPosition === "start") {
            const extra = extraActions(record);
            if (extra && Array.isArray(extra)) {
              extra.forEach((btn, i) =>
                actions.push({ key: `extra-${i}`, label: btn, onClick: btn.props.onClick })
              );
            }
          }

          if (finalPerm.canRead && onView) {
            actions.push({
              key: "view",
              onClick: () => onView?.(record),
              label: (
                <Button variant="link" color="default" icon={<EyeOutlined />}>
                  {t("general.view")}
                </Button>
              ),
            });
          }

          if (finalPerm.canUpdate && onEdit) {
            actions.push({
              key: "edit",
              onClick: () => onEdit?.(record),
              label: (
                <Button variant="link" color="default" icon={<EditOutlined />}>
                  {t("general.buttonEdit")}
                </Button>
              ),
            });
          }

          if (finalPerm.canDelete && onDelete) {
            actions.push({
              key: "delete",
              onClick: () => onDelete?.(record),
              label: (
                <Button variant="link" color="danger" icon={<DeleteOutlined />}>
                  {t("general.buttonDelete")}
                </Button>
              ),
            });
          }

          if (extraActions && extraPosition === "end") {
            const extra = extraActions(record);
            if (extra && Array.isArray(extra)) {
              extra.forEach((btn, i) =>
                actions.push({ key: `extra-${i}`, label: btn, onClick: btn.props.onClick })
              );
            }
          }

          if (actions.length === 0) return null;

          return (
            <Dropdown menu={{ items: actions }} trigger={["hover"]} placement="bottomRight">
              <Button icon={<MoreOutlined />} />
            </Dropdown>
          );
        },
      } : null,
    ].filter(Boolean);
  }, [columns, me, menuPerm, onView, onEdit, onDelete, extraActions, t, rawId, recordPermission]);

  return (
    <>
      <div className="w-full pb-2 flex flex-col md:flex-row justify-between">
        <div className="text-xl font-semibold opacity-60">
          {totalText} {totalData ? `(${totalData})` : ""}
        </div>
        {menuPerm.canCreate ? customCreate ? customCreate : onCreate ? (
          <Button type="primary" icon={<AppstoreAddOutlined />} onClick={onCreate}>
            {createButtonText}
          </Button>
        ) : null : null}
      </div>
      <Table {...props} columns={extendedColumns} />
    </>
  );
}
