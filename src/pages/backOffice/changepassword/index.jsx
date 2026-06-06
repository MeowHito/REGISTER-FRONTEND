import { Button, Tabs } from 'antd';
import CommonForm from "components/commonForm";
import { AlertError, AlertLoading, AlertSuccess, AlertWarning, AlertClosed, AlertConfirm } from 'components/alert';
import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import masterService from 'services/master.services';
import { handleQueryStatus } from 'utils/index';
import FloatingLabel from "components/floatingLabel";
import { HomeOutlined, SettingOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

function ChangePassword() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: tokenData, ...other } = masterService.useQueryGetUserToken({ id });

  const { mutate: updatePassword } = masterService.useMutationUpdatePasswordUserToken(
    (res) => {
      AlertClosed();
      const { success, message } = res;
      if (success) {
        AlertSuccess({
          text: t("back.reset.resetSuccess"),
          onOk: () => {
            navigate("/login");
          },
        });
      } else {
        AlertError({ text: message });
      }
    },
    (err) => {
      AlertClosed();
      console.log(err)
      AlertError({ text: `CHANGE_PASSWORD : ${err?.response?.data?.message}` });
    }
  );

  const onFinish = (values) => {
    const { newPassword, confirmPassword } = values;
    if (newPassword !== confirmPassword) {
      AlertWarning({ text: t("general.matchPassword") });
    } else {
      AlertConfirm({
        onOk: () => {
          let isUpdate = {
            id,
            npw: newPassword,
          };
          AlertLoading({});
          updatePassword(isUpdate);
        },
      });
    }
  };

  useEffect(() => {
    handleQueryStatus(other, () => {
      const { success, data } = tokenData;
      if (!data && success) {
        AlertWarning({
          text: t("back.reset.expiredOrUsed"),
          onOk: () => {
            navigate("/login");
          },
        });
      }
    })
  }, [tokenData, other.fetchStatus]);

  const handleTabChange = (key) => {
    if (key === "2") {
      navigate("/");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen overflow-hidden">
      <div className="w-full max-w-md p-4">
        <div className="sg-section">
          <div className="section-content section-padding">
            <div className="container">
              <div className="ragister-account text-left">
                <div className="row">
                  <div className="account-content">
                    <div className="flex w-full">
                      <Tabs
                        defaultActiveKey="1"
                        centered
                        tabBarStyle={{ margin: "0 20px" }}
                        tabBarGutter={20}
                        onChange={handleTabChange}
                        items={[
                          {
                            label: t("back.reset.resetPassword"),
                            key: "1",
                            icon: <SettingOutlined />,
                          },
                          {
                            label: t("back.reset.backToMain"),
                            key: "2",
                            icon: <HomeOutlined />,
                          },
                        ]}
                      />
                    </div>
                    <div className="text-center text-gray-600 opacity-60 text-2xl font-semibold mt-8 mb-4 md:mb-[2px]">
                      {t("back.reset.resetPassword")}
                    </div>
                    <div className="ragister-form">
                      <CommonForm
                        name="change_form"
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                      >
                        <CommonForm.Item
                          name="newPassword"
                          rules={[
                            {
                              required: true,
                              message: t("required.newPassword"),
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
                          <FloatingLabel
                            label={t("back.reset.newPassword")}
                            type="password"
                            required
                          />
                        </CommonForm.Item>
                        <CommonForm.Item
                          name="confirmPassword"
                          rules={[
                            {
                              required: true,
                              message: t("required.confirmPassword"),
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
                          <FloatingLabel
                            label={t("back.reset.confirmNewPassword")}
                            type="password"
                            required
                          />
                        </CommonForm.Item>
                        <CommonForm.Item>
                          <Button
                            htmlType="submit"
                            className="!h-[40px] !mb-0 !mt-3 btn btn-primary w-full"
                          >
                            <span>{t("back.reset.ok")}</span>
                          </Button>
                        </CommonForm.Item>
                      </CommonForm>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChangePassword
