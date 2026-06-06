import React, { useMemo, useState } from 'react';
import { Button, Table, Switch, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import backofficeServices from 'services/backoffice.services';
import EditRoleModal from './editRoleModal';
import { AlertConfirm } from 'components/alert';

const Permission = () => {
  const { t } = useTranslation();
  const [editingRole, setEditingRole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftPermissions, setDraftPermissions] = useState({});

  const { data: roleData = { content: [] }, refetch } = backofficeServices.useQueryGetRoles({ active: true });
  const { data: menuData = { content: [] } } = backofficeServices.useQueryGetMenus({ active: true });

  const createRole = backofficeServices.useMutationCreateRole(() => refetch());
  const updateRole = backofficeServices.useMutationUpdateRole(() => refetch());
  const deleteRole = backofficeServices.useMutationDeleteRole(() => refetch());
  const updatePermissions = backofficeServices.useMutationUpdatePermissions(() => refetch());

  const roles = useMemo(() => roleData.content || [], [roleData]);
  const menus = useMemo(() => menuData.content || [], [menuData]);

  const handleOpenModal = (role = null) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleSaveRole = (role) => {
    AlertConfirm({
      title: t("back.setting.permission.confirmSaveRoleTitle"),
      text: t("back.setting.permission.confirmSaveRoleMessage", { role: role.role }),
      onOk: () => {
        if (role.id) {
          updateRole.mutate(role);
        } else {
          createRole.mutate(role);
        }
        setIsModalOpen(false);
      }
    });
  };

  const handleCancelPermissions = () => {
    setDraftPermissions({});
  };

  const handleSavePermissions = () => {
    AlertConfirm({
      title: t("back.setting.permission.confirmSavePermissionsTitle"),
      text: t("back.setting.permission.confirmSavePermissionsMessage"),
      onOk: () => {
        Object.entries(draftPermissions).forEach(([roleId, permissions]) => {
          if (permissions.length > 0) {
            const payload = permissions.map(p => ({
              ...p,
              menuId: p.menu?.id || p.menuId,
              menu: undefined
            }));
            updatePermissions.mutate({ roleId, permissions: payload });
          }
        });
        setDraftPermissions({});
      }
    });
  };

  const hasUnsavedChanges = Object.keys(draftPermissions).length > 0;

  const handleDeleteRole = (role) => {
    AlertConfirm({
      title: t("back.setting.permission.confirmDeleteTitle"),
      text: t("back.setting.permission.confirmDeleteMessage", { role: role.role }),
      onOk: () => {
        deleteRole.mutate({ id: role.id });
      }
    });
  };

  return (
    <div className="w-full max-w-screen-lg mx-auto">
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => handleOpenModal()}
        className="mb-3"
        block
      >
        {t("back.setting.permission.addRole")}
      </Button>

      <Table
        rowKey="id"
        columns={[
          {
            title: t("back.setting.permission.role"),
            dataIndex: "role",
            render: (text, role) => (
              <div className="flex flex-col leading-tight">
                <span className="font-semibold">{text}</span>
                <span className="text-gray-400 text-xs">{role.roleType}</span>
              </div>
            )
          },
          {
            title: t("back.setting.permission.actions"),
            dataIndex: "actions",
            width: 100,
            render: (_, role) => (
              <div className="flex justify-center gap-2">
                <Tooltip title={t("general.buttonEdit")}>
                  <Button icon={<EditOutlined />} size="small" onClick={() => handleOpenModal(role)} />
                </Tooltip>
                <Tooltip title={t("general.buttonDelete")}>
                  <Button danger icon={<DeleteOutlined />} size="small" onClick={() => handleDeleteRole(role)} />
                </Tooltip>
              </div>
            )
          }
        ]}
        expandable={{
          expandedRowRender: (role) => {
            const rolePerms = draftPermissions[role.id] || role.permissions || [];

            const handleLocalPermissionToggle = (menuId, key, value) => {
              const updated = [...rolePerms];
              const idx = updated.findIndex(p => (p.menu?.id || p.menuId) === menuId);
              const target = idx >= 0 ? { ...updated[idx] } : { menu: { id: menuId }, roleId: role.id };

              target[key] = value;

              if ((key === 'canCreate' || key === 'canUpdate' || key === 'canDelete') && value) {
                target['canRead'] = true;
              }

              if (key === 'canRead' && !value) {
                target['canCreate'] = false;
                target['canUpdate'] = false;
                target['canDelete'] = false;
              }

              if (idx >= 0) {
                updated[idx] = target;
              } else {
                updated.push(target);
              }

              setDraftPermissions(prev => ({ ...prev, [role.id]: updated }));
            };

            return (
              <div className="overflow-x-auto space-y-2">
                <table className="table-auto w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th className="w-1/6 px-2 py-1 text-left">{t("back.setting.permission.menu")}</th>
                      {['canRead', 'canCreate', 'canUpdate', 'canDelete'].map((key) => (
                        <th key={key} className="w-1/12 px-2 py-1 text-center">
                          {t(`back.setting.permission.${key}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {menus.map((menu) => {
                      const existing = rolePerms.find(p => (p.menu?.id || p.menuId) === menu.id) || {};
                      return (
                        <tr key={menu.id} className="border-t">
                          <td className="px-2 py-2 font-medium">{t(`back.menu.${menu.title}.name`, menu.title)}</td>
                          {['canRead', 'canCreate', 'canUpdate', 'canDelete'].map((key) => (
                            <td key={key} className="px-2 py-2 text-center">
                              <Switch
                                size="small"
                                checked={existing[key] || false}
                                onChange={(val) => handleLocalPermissionToggle(menu.id, key, val)}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          }
        }}
        dataSource={roles}
        bordered
        scroll={{ x: true }}
        className="whitespace-nowrap"
      />

      {hasUnsavedChanges && (
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={handleCancelPermissions}>{t("general.buttonCancel")}</Button>
          <Button type="primary" onClick={handleSavePermissions}>{t("general.buttonSave")}</Button>
        </div>
      )}

      <EditRoleModal
        open={isModalOpen}
        data={editingRole}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRole}
      />
    </div>
  );
};

export default Permission;
