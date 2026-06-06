import React, { useEffect } from 'react';
import { Modal } from 'antd';
import CommonForm from "components/commonForm";
import FloatingLabel from 'components/floatingLabel';
import { useTranslation } from 'react-i18next';

const EditRoleModal = ({ open, data, onClose, onSave }) => {
  const { t } = useTranslation();
  const [form] = CommonForm.useForm();

  useEffect(() => {
    if (open) form.resetFields();
    if (data) form.setFieldsValue(data);
  }, [data, open]);

  const handleSubmit = (values) => {
    onSave({ ...data, ...values });
  };

  return (
    <Modal
      open={open}
      title={data ? t("back.setting.permission.editRole") : t("back.setting.permission.addRole")}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={t("general.buttonSave")}
      cancelText={t("general.cancelConfirm")}
    >
      <CommonForm form={form} layout="vertical" onFinish={handleSubmit}>
        <CommonForm.Item name="roleType" rules={[{ required: true, message: t("required.roleType") }]}>
          <FloatingLabel type="select" size="large" label={t("back.setting.permission.roleType")} options={[{ value: "admin", label: "admin" }, { value: "organizer", label: "organizer" }, { value: "guest", label: "guest" }]} required />
        </CommonForm.Item>
        <CommonForm.Item name="role" rules={[{ required: true, message: t("required.role") }]}>
          <FloatingLabel label={t("back.setting.permission.role")} required />
        </CommonForm.Item>
      </CommonForm>
    </Modal>
  );
};

export default EditRoleModal;
