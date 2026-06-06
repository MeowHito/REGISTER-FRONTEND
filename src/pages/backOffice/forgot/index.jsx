import React, { useState } from "react";
import { Button, Tabs } from "antd";
import { AlertSuccess } from "components/alert";
import { Link, useNavigate } from "react-router-dom";
import masterService from "services/master.services";
import { useTranslation } from "react-i18next";
import { HomeOutlined, SettingOutlined } from "@ant-design/icons";
import FloatingLabel from "components/floatingLabel";
import CommonForm from "components/commonForm";

function Forgot() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = CommonForm.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const { mutate: postCheckEmail } = masterService.useMutationCheckEmail(
    () => {
      setIsLoading(false);
      AlertSuccess({
        text: t("back.forgot.reminder"),
        onOk: () => {
          navigate("/login");
        },
      });
    },
    () => {
      setIsLoading(false);
      AlertSuccess({
        text: t("back.forgot.reminder"),
        onOk: () => {
          navigate("/login");
        },
      });
    }
  );

  const onFinish = (values) => {
    setIsLoading(true);
    postCheckEmail({ values });
  };

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
              <div className="ragister-account text-center">
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
                            label: t("back.forgot.forgotPassword"),
                            key: "1",
                            icon: <SettingOutlined />,
                          },
                          {
                            label: t("back.forgot.backToMain"),
                            key: "2",
                            icon: <HomeOutlined />,
                          },
                        ]}
                      />
                    </div>
                    <div className="text-gray-600 opacity-60 text-2xl font-semibold mt-8 mb-4 md:mb-[2px]">
                      {t("back.forgot.forgotPassword")}
                    </div>
                    <div className="ragister-form">
                      <CommonForm
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                      >
                        <CommonForm.Item
                          name="email"
                          rules={[
                            { required: true, message: t("required.email") },
                            { type: "email", message: t("validation.email") },
                          ]}
                          className="text-left mb-6"
                        >
                          <FloatingLabel
                            label={t("general.email")}
                            type="text"
                            required
                          />
                        </CommonForm.Item>
                        <Button
                          className="!h-[40px] btn btn-primary w-full"
                          htmlType="submit"
                          loading={isLoading}
                        >
                          <span>{t("back.forgot.verify")}</span>
                        </Button>
                      </CommonForm>
                      <div className="middle-content">
                        <p>
                          {t("back.forgot.existing")}{" "}
                          <Link to="/login">{t("back.forgot.login")}</Link>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Forgot;
