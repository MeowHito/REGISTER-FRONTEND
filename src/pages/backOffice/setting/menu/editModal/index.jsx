import React, { useEffect } from 'react';
import { Modal, Input, Switch } from 'antd';
import CommonForm from "components/commonForm";
import { useTranslation } from 'react-i18next';
import FloatingLabel from 'components/floatingLabel';

const EditModal = ({ open, data, onClose, onSave }) => {
  const { t } = useTranslation();
  const [form] = CommonForm.useForm();

  useEffect(() => {
    if (open) form.resetFields();
    if (data) form.setFieldsValue(data);
  }, [data, form]);

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const updated = { ...data, ...values };
      onSave(updated);
    });
  };

  return (
    <Modal
      open={open}
      title={data ? t("back.setting.menu.editMenu") : t("back.setting.menu.addMenu")}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={t("general.buttonSave")}
    >
      <CommonForm form={form} layout="vertical">
        <CommonForm.Item
          name="title"
          rules={[{ required: true, message: t("required.menuTitle") }]}
        >
          <FloatingLabel label={t("back.setting.menu.title")} required />
        </CommonForm.Item>
        <CommonForm.Item
          name="path"
          rules={[{ required: true, message: t("required.menuPath") }]}
        >
          <FloatingLabel label={t("back.setting.menu.path")} required />
        </CommonForm.Item>
        <CommonForm.Item name="icon">
          <FloatingLabel label={t("back.setting.menu.icon")} />
        </CommonForm.Item>
        <CommonForm.Item name="badgeKey">
          <FloatingLabel label={t("back.setting.menu.badgeKey")} />
        </CommonForm.Item>
        <CommonForm.Item name="isDisplay" valuePropName="checked">
          <FloatingLabel type="switch" label={t("back.setting.menu.isDisplay")} />
        </CommonForm.Item>
        <CommonForm.Item name="disabled" valuePropName="checked">
          <FloatingLabel type="switch" label={t("back.setting.menu.disabled")} />
        </CommonForm.Item>
        <CommonForm.Item name="isNoti" valuePropName="checked">
          <FloatingLabel type="switch" label={t("back.setting.menu.isNoti")} />
        </CommonForm.Item>
      </CommonForm>
    </Modal>
  );
};

export default EditModal;
