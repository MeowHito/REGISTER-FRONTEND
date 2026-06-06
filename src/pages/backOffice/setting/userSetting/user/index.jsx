import React from 'react'
import { Modal } from 'antd';
import CommonForm from "components/commonForm";
import { AlertSuccess, AlertError, AlertConfirm, AlertClosed } from 'components/alert';
import backofficeServices from "services/backoffice.services";
import { errorToMessage } from 'hooks/functions/errorToMessage';
import { roleOption } from 'constants/options/roleOption';
import { useTranslation } from 'react-i18next';
import FloatingLabel from 'components/floatingLabel';

const User = ({ isEditable, data, open, onCancel, refetch, mode }) => {
  const { t } = useTranslation();
  const [form] = CommonForm.useForm();
  const role = CommonForm.useWatch('role', form);

  const { mutate: createUser } = backofficeServices.useMutationCreateUser(
    () => {
      form.resetFields();
      refetch();
      AlertClosed();
      onCancel();
      AlertSuccess({});
    },
    (err) => {
      AlertClosed();
      onCancel();
      form.resetFields();
      AlertError({ text: errorToMessage(err?.response?.data?.message || err) });
    }
  );

  const onFinish = async (values) => {
    AlertConfirm({
      onOk: () => {
        let isData = {
          ...data,
          ...values,
        };
        createUser(isData);
      }
    });
  };

  return (
    <div>
      <Modal
        title={
          mode === "new" ? t("back.setting.user.home.new") : mode === "edit" ? t("back.setting.user.home.edit") : t("back.setting.user.home.view")
        }
        open={open}
        okButtonProps={{ disabled: !isEditable }}
        onOk={() => {
          form.submit();
        }}
        onCancel={() => {
          form.resetFields();
          onCancel();
        }}
        okText={t("general.buttonSave")}
        cancelText={t("general.buttonCancel")}
      >
        <CommonForm
          form={form}
          name="user-form"
          className="!mt-4"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <CommonForm.Item
            name="email"
            rules={[
              {
                required: true,
                message: t("required.email"),
              },
              { type: "email", message: t("validation.email") },
            ]}>
            <FloatingLabel type="email" size="large" label={t("general.email")} required />
          </CommonForm.Item>
          <CommonForm.Item
            name="password"
            rules={[
              {
                required: true,
                message: t("required.password"),
              },
              {
                min: 8,
                message: t("validation.minPassword"),
              },
              {
                pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
                message: t("validation.patternPassword"),
              },
            ]}
          >
            <FloatingLabel type="password" size="large" label={t("general.password")} required />
          </CommonForm.Item>
          <CommonForm.Item
            name="role"
            rules={[
              {
                required: true,
                message: t("required.role"),
              },
            ]}
          >
            <FloatingLabel
              type="select"
              label={t("back.setting.user.home.role")}
              size="large"
              options={roleOption}
            />
          </CommonForm.Item>
          {role === "organizer" && (
            <CommonForm.Item
              name="companyName"
              rules={[
                {
                  required: true,
                  message: t("required.companyName"),
                },
              ]}
            >
              <FloatingLabel label={t("back.register.companyName")} type="text" required />
            </CommonForm.Item>
          )}
        </CommonForm>
      </Modal>
    </div>
  )
}

export default User

