import { Button, Tabs } from "antd";
import { AlertSuccessLogin } from "components/alert";
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import masterService from "services/master.services";
import { useTranslation } from "react-i18next";
import { HomeOutlined, SettingOutlined } from "@ant-design/icons";
import GoogleLogin from "./googleLogin";
import FacebookLogin from "./facebookLogin";
import LineLogin from "./lineLogin";
import "./LoginButton.css";
import FloatingLabel from "components/floatingLabel";
import { useQueryClient } from "@tanstack/react-query";

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  const returnUrl = location.state?.from || sessionStorage.getItem('returnUrl') || "/";

  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { mutate: postLogin } = masterService.useMutationLogin(
    (res) => {
      setIsLoading(false);
      if (res?.success) {
        setError(null);
        qc.invalidateQueries({ queryKey: ["me"] });
        AlertSuccessLogin({});
        sessionStorage.removeItem('returnUrl');
        navigate(returnUrl);
      } else {
        setError(t("back.login.loginError"));
      }
    },
      (_err) => {
      setIsLoading(false);
      setError(t("back.login.loginError"));
    }
  );

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError(t("required.password"));
      return;
    }
    const values = { username: email, password };
    setIsLoading(true);
    postLogin({ values });
  };

  const handleTabChange = (key) => {
    if (key === "2") {
      navigate(returnUrl);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen overflow-hidden">
      <div className="w-full max-w-md p-4">
        <div className="sg-section">
          <div className="section-content md:py-28 sm:py-2 xs:py-1">
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
                            label: t("back.login.login"),
                            key: "1",
                            icon: <SettingOutlined />,
                          },
                          {
                            label: t("back.login.back"),
                            key: "2",
                            icon: <HomeOutlined />,
                          },
                        ]}
                      />
                    </div>
                    <div className="text-gray-600 opacity-60 text-2xl font-semibold mt-8 mb-4 md:mb-[2px]">
                      {t("back.login.login")}
                    </div>
                    <div className="ragister-form flex flex-col w-full text-left">
                      <div className="form-group mb-3">
                        <FloatingLabel
                          label={t("general.email")}
                          value={email}
                          type="text"
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="form-group mb-8">
                        <FloatingLabel
                          label={t("general.password")}
                          value={password}
                          type="password"
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        {error && (
                          <div className="text-red-500 text-sm mt-1">
                            {error}
                          </div>
                        )}
                      </div>
                      <Button
                        className="btn btn-primary w-full !h-[40px] mb-8"
                        onClick={handleLogin}
                        loading={isLoading}
                      >
                        <span>{t("back.login.login")}</span>
                      </Button>
                      <div className="text-center mt-1 mb-6">
                        <p>{t("back.login.or")}</p>
                      </div>
                      <div className="flex flex-col gap-3 w-full">
                        <GoogleLogin />
                        <FacebookLogin />
                        <LineLogin />
                      </div>
                      <div className="text-center mt-6">
                        <p className="mb-2">
                          {t("back.login.noAccount")}
                          <Link to="/register" className="text-primary ms-2">
                            {t("back.login.register")}
                          </Link>
                        </p>
                        <Link to="/forgot" className="text-primary ms-2">
                          {t("back.login.forgot")}
                        </Link>
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

export default Login;
