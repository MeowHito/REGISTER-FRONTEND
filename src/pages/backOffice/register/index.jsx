import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Tabs, Checkbox } from "antd";
import CommonForm from "components/commonForm";
import {
  AlertWarning,
  AlertError,
  AlertSuccess,
  AlertLoading,
} from "components/alert";
import Swal from "sweetalert2";
import { HomeOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import masterService from "services/master.services";
import FloatingLabel from "components/floatingLabel";
import { useQueryClient } from "@tanstack/react-query";
import { errorToMessage } from "hooks/functions/errorToMessage";

function Register({ organizerMode = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form] = CommonForm.useForm();
  const [role, setRole] = useState(organizerMode ? "organizer" : "guest");
  const [fromSocialLogin, setFromSocialLogin] = useState(false);
  const [socialEmail, setSocialEmail] = useState("");
  const [isAccepted, setIsAccepted] = useState(false);

  useEffect(() => {
    const storedData = sessionStorage.getItem("registerData");
    const storedEmail = sessionStorage.getItem("socialEmail") || "";
    const storedFromSocialLogin =
      sessionStorage.getItem("fromSocialLogin") === "true";

    setFromSocialLogin(storedFromSocialLogin);
    setSocialEmail(storedEmail);

    if (storedData) {
      const initialData = JSON.parse(storedData);
      form.setFieldsValue(initialData);
    } else if (storedFromSocialLogin) {
      form.setFieldsValue({ email: storedEmail });
    }
  }, [form]);

  const clearRegisterSession = () => {
    sessionStorage.removeItem("registerData");
    sessionStorage.removeItem("socialEmail");
    sessionStorage.removeItem("fromSocialLogin");
  };

  const { mutate: postRegister, isFetching: isLoadingRegister } =
    masterService.useMutationRegister(
      (res) => {
        const { success, message } = res || {};
        if (success) {
          Swal.close();
          if (res?.data?.pendingApproval) {
            AlertSuccess({
              text: t("back.register.pendingApproval"),
              onOk: () => {
                clearRegisterSession();
                navigate("/organizer/login");
              },
            });
            return;
          }
          AlertSuccess({
            text: t("back.register.successful"),
            onOk: async () => {
              await qc.invalidateQueries({ queryKey: ["me"] });
              clearRegisterSession();
              navigate("/");
            },
          });
        } else {
          AlertError({ text: message || t("back.register.failed") });
        }
      },
      (err) => {
        AlertError({
          text: `REGISTER : ${errorToMessage(err?.response?.data?.message || err?.message)}`,
        });
      }
    );

  const { mutate: postSocialRegister, isFetching: isLoadingSocialRegister } =
    masterService.useMutationRegister(
      (res) => {
        const { success, message } = res || {};
        if (success) {
          Swal.close();
          if (res?.data?.pendingApproval) {
            AlertSuccess({
              text: t("back.register.pendingApproval"),
              onOk: () => {
                clearRegisterSession();
                navigate("/organizer/login");
              },
            });
            return;
          }
          AlertSuccess({
            text: t("back.register.successful"),
            onOk: async () => {
              await qc.invalidateQueries({ queryKey: ["me"] });
              clearRegisterSession();
              navigate("/");
            },
          });
        } else {
          AlertError({ text: message || t("back.register.failed") });
        }
      },
      (err) => {
        AlertError({
          text: `REGISTER : ${errorToMessage(err?.response?.data?.message || err?.message)}`,
        });
      }
    );

  useEffect(() => {
    if (isLoadingRegister || isLoadingSocialRegister) {
      AlertLoading({});
    } else {
      Swal.close();
    }
  }, [isLoadingRegister, isLoadingSocialRegister]);

  const onFinish = (values) => {
    if (fromSocialLogin) {
      const postData = {
        email: socialEmail,
        firstName: values.firstName,
        lastName: values.lastName,
        companyName: values.companyName,
        role,
        fromSocialLogin: true,
      };
      sessionStorage.setItem("registerData", JSON.stringify(postData));
      postSocialRegister({ values: postData });
    } else {
      if (values.password !== values.confirm_password) {
        AlertWarning({ text: t("back.register.warningMsg") });
        return;
      }
      const postData = { ...values, role, fromSocialLogin: false };
      sessionStorage.setItem("registerData", JSON.stringify(postData));
      postRegister({ values: postData });
    }
  };

  const handleTabChange = (key) => {
    if (key === "1") {
      setRole("guest");
    } else if (key === "2") {
      setRole("organizer");
    } else if (key === "3") {
      navigate("/");
      clearRegisterSession();
    }
  };

  return (
    <div className="flex items-center justify-center h-screen overflow-hidden">
      <div className="w-full max-w-md p-4">
        <div className="sg-section">
          <div className="section-content md:py-28 sm:py-2 xs:py-1">
            <div className="container">
              <div className="ragister-account text-left">
                <div className="row">
                  <div className="account-content">
                    <div className="flex w-full">
                      <Tabs
                        defaultActiveKey={organizerMode ? "2" : "1"}
                        centered
                        tabBarStyle={{ margin: "0 20px" }}
                        tabBarGutter={20}
                        onChange={handleTabChange}
                        items={[
                          {
                            label: t("back.login.participant"),
                            key: "1",
                            icon: <UserOutlined />,
                          },
                          {
                            label: t("back.login.organizer"),
                            key: "2",
                            icon: <SettingOutlined />,
                          },
                          {
                            label: t("back.register.back"),
                            key: "3",
                            icon: <HomeOutlined />,
                          },
                        ]}
                      />
                    </div>
                    <div className="text-center text-gray-600 opacity-60 text-2xl font-semibold mt-8 mb-4 md:mb-[2px]">
                      {t("back.register.register")}
                    </div>
                    {fromSocialLogin && (
                      <div className="text-center mt-[22px]">
                        <p>{t("back.register.registerWith")}</p>
                        <p>{socialEmail}?</p>
                      </div>
                    )}
                    <div className="ragister-form">
                      <CommonForm
                        form={form}
                        initialValues={{
                          email: fromSocialLogin ? socialEmail : "",
                        }}
                        name="register_form"
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                      >
                        <CommonForm.Item
                          name="firstName"
                          rules={[
                            { required: true, message: t("required.firstName") },
                          ]}
                        >
                          <FloatingLabel
                            label={t("back.register.firstName")}
                            type="text"
                          />
                        </CommonForm.Item>
                        <CommonForm.Item
                          name="lastName"
                          rules={[
                            { required: true, message: t("required.lastName") },
                          ]}
                        >
                          <FloatingLabel
                            label={t("back.register.lastName")}
                            type="text"
                          />
                        </CommonForm.Item>

                        {role === "organizer" && (
                          <CommonForm.Item
                            name="companyName"
                            rules={[
                              { required: true, message: t("required.companyName") },
                            ]}
                          >
                            <FloatingLabel
                              label={t("back.register.companyName")}
                              type="text"
                            />
                          </CommonForm.Item>
                        )}

                        {!fromSocialLogin && (
                          <CommonForm.Item
                            name="email"
                            rules={[
                              { required: true, message: t("required.email") },
                              { type: "email", message: t("validation.email") },
                            ]}
                          >
                            <FloatingLabel label={t("general.email")} type="email" />
                          </CommonForm.Item>
                        )}

                        {!fromSocialLogin && (
                          <CommonForm.Item
                            name="password"
                            rules={[
                              { required: true, message: t("required.password") },
                              { min: 8, message: t("validation.minPassword") },
                              {
                                pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
                                message: t("validation.patternPassword"),
                              },
                            ]}
                          >
                            <FloatingLabel
                              label={t("general.password")}
                              type="password"
                            />
                          </CommonForm.Item>
                        )}

                        {!fromSocialLogin && (
                          <CommonForm.Item
                            name="confirm_password"
                            rules={[
                              { required: true, message: t("required.password") },
                              { min: 8, message: t("validation.minPassword") },
                              {
                                pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
                                message: t("validation.patternPassword"),
                              },
                            ]}
                          >
                            <FloatingLabel
                              label={t("general.confirmPassword")}
                              type="password"
                            />
                          </CommonForm.Item>
                        )}

                        <CommonForm.Item
                          name="acceptTerms"
                          valuePropName="checked"
                          initialValue={false}
                          rules={[
                            { required: true, message: t("required.agreement") },
                          ]}
                        >
                          <Checkbox
                            className="!flex !items-center justify-start font-semibold !mb-0"
                            onChange={(e) => setIsAccepted(e.target.checked)}
                          >
                            {t("back.register.agree")}{" "}
                            <Link
                              to="/terms-of-use"
                              onClick={() => {
                                sessionStorage.setItem(
                                  "registerData",
                                  JSON.stringify(form.getFieldsValue())
                                );
                                sessionStorage.setItem(
                                  "socialEmail",
                                  form.getFieldValue("email") || ""
                                );
                                sessionStorage.setItem(
                                  "fromSocialLogin",
                                  fromSocialLogin.toString()
                                );
                              }}
                            >
                              {t("back.register.termsOfUse")}
                            </Link>
                          </Checkbox>
                        </CommonForm.Item>

                        <CommonForm.Item>
                          <Button
                            className="!h-[40px] !mb-0 btn btn-primary w-full"
                            htmlType="submit"
                            disabled={!isAccepted}
                            loading={isLoadingRegister || isLoadingSocialRegister}
                          >
                            <span>
                              {t("back.register.register")}{" "}
                              {role === "organizer"
                                ? t("back.login.organizer")
                                : t("back.login.participant")}
                            </span>
                          </Button>
                        </CommonForm.Item>

                        <div className="text-center middle-content mt-4">
                          <p>
                            {t("back.register.existing")}{" "}
                            <Link
                              to={organizerMode ? "/organizer/login" : "/login"}
                              onClick={() => {
                                clearRegisterSession();
                              }}
                            >
                              {t("back.register.login")}
                            </Link>
                          </p>
                        </div>
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
  );
}

export default Register;
