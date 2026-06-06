import React, { useEffect } from "react";
import { Button, Spin } from "antd";
import CommonForm from "components/commonForm";
import backofficeServices from "services/backoffice.services";
import {
  AlertSuccess,
  AlertError,
  AlertConfirm,
  AlertWarning,
} from "components/alert";
import { errorToMessage } from "hooks/functions/errorToMessage";
import { useTranslation } from "react-i18next";
import FloatingLabel from "components/floatingLabel";
import { handleQueryStatus } from "utils";
import useMe from "hooks/useMe";

function Account() {
  const { t } = useTranslation();
  const [form] = CommonForm.useForm();

  const {
    data: me,
    status: meStatus,
    fetchStatus: meFetchStatus,
  } = useMe({ retry: 0 });

  const { mutate: updatePassword, isPending } =
    backofficeServices.useMutationUpdatePassword(
      (res) => {
        const { success, message } = res || {};
        if (success) {
          form.resetFields(["oldPassword", "newPassword", "confirmPassword"]);
          AlertSuccess({});
        } else {
          AlertError({ text: message || t("general.error") });
        }
      },
      (err) => {
        AlertError({
          text: errorToMessage(err?.response?.data?.message || err?.message),
        });
      }
    );

  const onFinish = (values) => {
    const { oldPassword, newPassword, confirmPassword } = values;
    if (newPassword !== confirmPassword) {
      AlertWarning({ text: t("general.matchPassword") });
      return;
    }
    const id = me?.id;
    if (!id) {
      AlertError({ text: t("general.error") });
      return;
    }
    AlertConfirm({
      onOk: () => {
        updatePassword({ id, opw: oldPassword, npw: newPassword });
      },
    });
  };

  useEffect(() => {
    handleQueryStatus(
      { status: meStatus, fetchStatus: meFetchStatus },
      () => {
        if (me?.email) form.setFieldsValue({ email: me.email });
      }
    );
  }, [meStatus, meFetchStatus, me, form]);

  const spinning = meFetchStatus === "fetching" && !me;

  return (
    <Spin spinning={spinning}>
      <div className="md:max-w-[720px] mx-auto pt-3">
        <CommonForm
          form={form}
          name="user-account"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <CommonForm.Item name="email">
            <FloatingLabel
              readOnly
              size="large"
              disabled
              label={t("general.email")}
            />
          </CommonForm.Item>

          <CommonForm.Item
            name="oldPassword"
            rules={[
              { required: true, message: t("required.oldPassword") },
            ]}
          >
            <FloatingLabel
              type="password"
              size="large"
              label={t("back.setting.account.oldPassword")}
              required
            />
          </CommonForm.Item>

          <CommonForm.Item
            name="newPassword"
            rules={[
              { required: true, message: t("required.newPassword") },
              { min: 8, message: t("validation.minPassword") },
              {
                pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
                message: t("validation.patternPassword"),
              },
            ]}
          >
            <FloatingLabel
              type="password"
              size="large"
              label={t("back.setting.account.newPassword")}
              required
            />
          </CommonForm.Item>

          <CommonForm.Item
            name="confirmPassword"
            rules={[
              { required: true, message: t("required.confirmPassword") },
              { min: 8, message: t("validation.minPassword") },
              {
                pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
                message: t("validation.patternPassword"),
              },
            ]}
          >
            <FloatingLabel
              type="password"
              size="large"
              label={t("back.setting.account.confirmPassword")}
              required
            />
          </CommonForm.Item>

          <CommonForm.Item>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              disabled={!me?.id}
              loading={isPending}
            >
              {t("general.buttonSave")}
            </Button>
          </CommonForm.Item>
        </CommonForm>
      </div>
    </Spin>
  );
}

export default Account;

