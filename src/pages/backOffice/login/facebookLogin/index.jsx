import React, { useEffect } from "react";
import { AlertClosed, AlertSuccessLogin, AlertError, AlertLoading } from "components/alert";
import masterService from "services/master.services";
import { useNavigate } from "react-router-dom";
import { errorToMessage } from "hooks/functions/errorToMessage";
import { useQueryClient } from "@tanstack/react-query";

const FacebookLogin = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const appId = import.meta.env.VITE_AUTH_FACEBOOK_ID;

  const { mutate: postFacebookLogin } = masterService.useMutationLoginSocial(
    (res) => {
      AlertClosed();
      if (res?.success) {
        qc.invalidateQueries({ queryKey: ["me"] });
        AlertSuccessLogin({});
        navigate("/");
      } else if (res?.message === "Redirecting to register.") {
        const socialEmail = res?.data?.email || "";
        sessionStorage.setItem("socialEmail", socialEmail);
        sessionStorage.setItem("fromSocialLogin", "true");
        navigate("/register");
      } else {
        AlertError({ text: `LOGIN : ${res?.message || "Login failed"}` });
      }
    },
    (err) => {
      AlertClosed();
      AlertError({ text: errorToMessage(err?.response?.data?.message || err?.message) });
    }
  );

  useEffect(() => {
    if (!appId) return;

    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    globalThis.fbAsyncInit = function () {
      if (!globalThis.FB) return;
      globalThis.FB.init({
        appId,
        cookie: true,
        xfbml: true,
        version: "v22.0",
      });
    };

    return () => { };
  }, [appId]);

  const handleLogin = () => {
    if (!globalThis.FB) {
      AlertError({ text: "Facebook SDK not loaded yet. Please try again." });
      return;
    }

    AlertLoading({ text: "Logging in with Facebook..." });

    globalThis.FB.login(
      (res) => {
        if (res?.authResponse?.accessToken) {
          const accessToken = res.authResponse.accessToken;
          postFacebookLogin({ payload: { type: "facebook", token: accessToken } });
        } else {
          AlertClosed();
          AlertError({ text: "Facebook login was cancelled or failed." });
        }
      },
      { scope: "email" }
    );
  };

  return (
    <div style={{ textAlign: "center" }}>
      <button
        className="sso-btn facebook-btn w-full"
        onClick={handleLogin}
        disabled={!appId}
        title={!appId ? "Facebook App ID not configured" : undefined}
      >
        <i
          className="fab fa-facebook facebook-logo"
          style={{ marginRight: "10px", fontSize: "28px" }}
        />
        <span className="sso-text">Login with Facebook</span>
      </button>
    </div>
  );
};

export default FacebookLogin;
