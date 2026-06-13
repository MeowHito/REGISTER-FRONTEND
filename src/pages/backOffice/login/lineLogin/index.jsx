import React, { useEffect, useState } from "react";
import liff from "@line/liff";
import lineLogo from "../../../../assets/images/line.png";
import masterService from "services/master.services";
import { useNavigate } from "react-router-dom";
import { AlertSuccessLogin, AlertClosed, AlertError, AlertLoading } from "components/alert";
import { useQueryClient } from "@tanstack/react-query";

const LineLogin = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [liffReady, setLiffReady] = useState(false);
  const liffId = import.meta.env.VITE_AUTH_LINE_LIFF;

  const { mutate: postLineLogin } = masterService.useMutationLoginSocial(
    (res) => {
      AlertClosed();
      if (res?.success) {
        qc.invalidateQueries({ queryKey: ["me"] });
        handleProviderLogout();
        AlertSuccessLogin({});
        navigate("/");
      } else if (res?.message === "Redirecting to register.") {
        handleProviderLogout();
        const socialEmail = res?.data?.email || "";
        sessionStorage.setItem("socialEmail", socialEmail);
        sessionStorage.setItem("fromSocialLogin", "true");
        navigate("/register");
      } else {
        AlertError({ text: res?.message || "ไม่สามารถเข้าสู่ระบบด้วย LINE ได้ กรุณาลองใหม่อีกครั้ง" });
      }
    },
    (err) => {
      AlertClosed();
      AlertError({ text: err?.response?.data?.message || "ไม่สามารถเข้าสู่ระบบด้วย LINE ได้ กรุณาลองใหม่อีกครั้ง" });
    }
  );

  useEffect(() => {
    const initLiff = async () => {
      try {
        if (!liffId) {
          AlertError({ text: "LINE LIFF ID is not configured." });
          return;
        }
        await liff.init({ liffId });
        setLiffReady(true);

        if (liff.isLoggedIn()) {
          const idToken = liff.getIDToken();
          if (idToken) {
            AlertLoading({ text: "Signing in with LINE..." });
            postLineLogin({ payload: { type: "line", token: idToken } });
          }
        }
      } catch (err) {
        console.error("LIFF initialization failed:", err);
        AlertError({ text: "Failed to initialize LINE login." });
      }
    };
    initLiff();
  }, [liffId, postLineLogin]);

  const handleLogin = async () => {
    try {
      if (!liffReady) {
        AlertError({ text: "LINE SDK not ready. Please try again." });
        return;
      }

      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: globalThis.location.href });
        return;
      }

      const idToken = liff.getIDToken();
      if (!idToken) {
        AlertError({ text: "Unable to get LINE ID token." });
        return;
      }

      AlertLoading({ text: "Signing in with LINE..." });
      postLineLogin({ payload: { type: "line", token: idToken } });
    } catch (err) {
      console.error("LINE login failed:", err);
      AlertError({ text: "LINE login failed. Please try again." });
    }
  };

  const handleProviderLogout = () => {
    if (liffReady && liff.isLoggedIn()) liff.logout();
  };

  return (
    <div>
      <button className="sso-btn line-btn w-full" onClick={handleLogin} disabled={!liffReady}>
        <img src={lineLogo} alt="LINE logo" className="line-logo" />
        <span className="sso-text">Login with LINE</span>
      </button>
    </div>
  );
};

export default LineLogin;
