import React, { useEffect, useState } from 'react';
import { Button, Tooltip, Row, Col, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, DragOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import DraggableFormItem from 'components/draggableFormItem';
import EditModal from './editModal';
import backofficeServices from 'services/backoffice.services';
import { AlertSuccess, AlertError } from 'components/alert';
import { handleQueryStatus } from 'utils';

const { Text } = Typography;

const Menu = () => {
  const { t } = useTranslation();

  const [editingMenu, setEditingMenu] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menus, setMenus] = useState([]);
  const [originalMenus, setOriginalMenus] = useState([]);
  const [isReordered, setIsReordered] = useState(false);

  const { data = [], refetch, ...other } = backofficeServices.useQueryGetMenus({ active: true });

  const createMenu = backofficeServices.useMutationCreateMenu(() => refetch());
  const updateMenu = backofficeServices.useMutationUpdateMenu(() => refetch());
  const deleteMenu = backofficeServices.useMutationDeleteMenu(() => refetch());
  const updateMenuOrder = backofficeServices.useMutationUpdateMenuOrder(() => {
    setIsReordered(false);
    refetch();
  });

  const handleOpenModal = (menu = null) => {
    setEditingMenu(menu);
    setIsModalOpen(true);
  };

  const handleCancelOrder = () => {
    setMenus([...originalMenus]);
    setIsReordered(false);
  };

  const handleSave = (menu) => {
    const isEdit = !!menu.id;
    let updatedMenus = [...menus];

    const enrichedMenu = {
      ...menu,
      isNoti: menu.isNoti ?? false,
      isDisplay: menu.isDisplay ?? false,
      disabled: menu.disabled ?? false,
      badgeKey: menu.badgeKey ?? '',
    };

    if (isEdit) {
      const index = updatedMenus.findIndex((m) => m.id === enrichedMenu.id);
      if (index !== -1) {
        updatedMenus[index] = { ...updatedMenus[index], ...enrichedMenu };
      }
    } else {
      updatedMenus.push(enrichedMenu);
    }

    const orderedMenus = updatedMenus.map((m, idx) => ({ ...m, position: idx }));
    setMenus(orderedMenus);

    const target = orderedMenus.find((m) => m.id === enrichedMenu.id) || orderedMenus[orderedMenus.length - 1];

    if (isEdit) {
      updateMenu.mutate(target);
    } else {
      createMenu.mutate(target);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    deleteMenu.mutate({ id });
  };

  const move = (fromIndex, toIndex) => {
    const updated = [...menus];
    const moved = updated.splice(fromIndex, 1)[0];
    updated.splice(toIndex, 0, moved);
    setMenus(updated);
    setIsReordered(true);
  };

  const handleSaveOrder = () => {
    const payload = menus.map((menu, index) => ({
      ...menu,
      position: index,
    }));
    updateMenuOrder.mutate(payload);
  };

  useEffect(() => {
    handleQueryStatus(other, () => {
      const sorted = (data?.content || []).sort((a, b) => a.position - b.position);

      const isSame =
        JSON.stringify(sorted) === JSON.stringify(menus) &&
        JSON.stringify(sorted) === JSON.stringify(originalMenus);

      if (!isSame) {
        setMenus(sorted);
        setOriginalMenus(sorted);
      }
    })
  }, [other.fetchStatus]);


  return (
    <div className="w-full max-w-[900px] mx-auto">
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => handleOpenModal()}
        className="!mb-3"
        block
      >
        {t("back.setting.menu.addMenu")}
      </Button>

      {menus?.map((menu, index) => (
        <DraggableFormItem key={menu.id} index={index} move={move} className="!bg-white !border !rounded !p-3 !shadow-sm">
          <Row justify="space-between" align="middle">
            <Col span={20}>
              <Row align="middle" gutter={8}>
                <Col><DragOutlined /></Col>
                <Col>
                  <Text strong>{t(`back.menu.${menu.title}.name`, menu.title)}</Text>
                  <br />
                  <Text type="secondary">{t("back.setting.menu.path")}: {menu.path || '-'}</Text>
                  {menu.isDisplay && <Text className="!ml-3 !text-green-500">({t("back.setting.menu.isDisplay")})</Text>}
                </Col>
              </Row>
            </Col>
            <Col>
              <Tooltip title={t("general.buttonEdit")}>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleOpenModal(menu)}
                />
              </Tooltip>
              <Tooltip title={t("general.buttonDelete")}>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(menu.id)}
                  className="!ml-2"
                />
              </Tooltip>
            </Col>
          </Row>
        </DraggableFormItem>
      ))}

      {isReordered && (
        <div className="flex justify-between">
          <Button onClick={handleCancelOrder}>
            {t("general.buttonCancel")}
          </Button>
          <Button type="primary" onClick={handleSaveOrder}>
            {t("general.buttonSave")}
          </Button>
        </div>
      )}

      <EditModal
        open={isModalOpen}
        data={editingMenu}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default Menu;
