import React from "react";
import { Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSelector from "components/languageSelector";
import Cookies from "js-cookie";

const TermsOfUse = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const currentLanguage = i18n.language?.toLowerCase()

  const paragraphStyle = currentLanguage === "th" ? { textIndent: "32px" } : {};


  const handleClose = () => {
    navigate("/register");
  };

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "10px",
          gap: "40px",
        }}
      >
        <LanguageSelector />
        <Button
          type="text"
          onClick={handleClose}
          icon={<CloseOutlined style={{ fontSize: "18px" }} />}
        />
      </div>

      <div
        style={{
          padding: "40px 8%",
          backgroundColor: "#fff",
        }}
      >
        <h2 className="text-center mb-4">{t("back.terms.termsOfUse")}</h2>

        <div className="mb-4">
          <h5>{t("back.terms.exchange")}</h5>
          <p>{t("back.terms.exchange1")}</p>
          <p>{t("back.terms.exchange2")}</p>
          <p style={{ textIndent: "32px" }}>{t("back.terms.exchange2.1")}</p>
          <p style={{ textIndent: "32px" }}>{t("back.terms.exchange2.2")}</p>
          <p>{t("back.terms.exchange3")}</p>
          <p>{t("back.terms.exchange4")}</p>
        </div>
        <div className="mb-4">
          <h5>{t("back.terms.refundPolicy")}</h5>
          <p style={paragraphStyle}>{t("back.terms.refundDescr")}</p>
          <p>{t("back.terms.refund1")}</p>
          <p>{t("back.terms.refund2")}</p>
          <p>{t("back.terms.refund3")}</p>
        </div>
        <div className="mb-4">
          <h5>{t("back.terms.cancellation")}</h5>
          <p style={paragraphStyle}>{t("back.terms.cancellationDescr")}</p>
        </div>
        <div className="mb-4">
          <h5>{t("back.terms.repeatOrder")}</h5>
          <p style={paragraphStyle}>{t("back.terms.repeatOrderDescr")}</p>
        </div>

        <h2 className="text-center mb-4">{t("back.terms.privacyPolicy")}</h2>

        <div className="mb-4">
          <p style={paragraphStyle}>{t("back.terms.privacyDescr1")}</p>
          <p style={paragraphStyle}>{t("back.terms.privacyDescr2")}</p>
        </div>
        <div className="mb-3">
          <h3>{t("back.terms.collection")}</h3>
        </div>
        <div className="mb-4">
          <h5>{t("back.terms.collection1")}</h5>
          <p style={paragraphStyle}>{t("back.terms.collection2")}</p>
        </div>
        <div className="mb-4">
          <h5>{t("back.terms.collection3")}</h5>
          <p style={paragraphStyle}>{t("back.terms.collection4")}</p>
        </div>
        <div className="mb-4">
          <h5>{t("back.terms.collection5")}</h5>
          <p style={paragraphStyle}>{t("back.terms.collection6")}</p>
        </div>
        <div className="mb-4">
          <h5>{t("back.terms.use")}</h5>
          <p style={paragraphStyle}>{t("back.terms.useDescr")}</p>
          <p>{t("back.terms.use1")}</p>
          <p style={paragraphStyle}>{t("back.terms.useDescr1")}</p>
          <p>{t("back.terms.use2")}</p>
          <p style={paragraphStyle}>{t("back.terms.useDescr2")}</p>
        </div>
        <div className="mb-3">
          <h3>{t("back.terms.public")}</h3>
        </div>
        <div className="mb-4">
          <h5>{t("back.terms.public1")}</h5>
          <p style={paragraphStyle}>{t("back.terms.publicDescr1")}</p>
        </div>
        <div className="mb-4">
          <h5>{t("back.terms.public2")}</h5>
          <p style={paragraphStyle}>{t("back.terms.publicDescr2")}</p>
        </div>
        <div className="mb-4">
          <h5>{t("back.terms.public3")}</h5>
          <p style={paragraphStyle}>{t("back.terms.publicDescr3")}</p>
        </div>
        <div className="mb-4">
          <h5>{t("back.terms.public4")}</h5>
          <p style={paragraphStyle}>{t("back.terms.publicDescr4")}</p>
        </div>
        <div className="mb-4">
          <h5>{t("back.terms.public5")}</h5>
          <p style={paragraphStyle}>{t("back.terms.publicDescr5")}</p>
        </div>
        <div className="mb-4">
          <h5>{t("back.terms.public6")}</h5>
          <p style={paragraphStyle}>{t("back.terms.publicDescr6")}</p>
        </div>
        <div className="mb-4">
          <h5>{t("back.terms.public7")}</h5>
          <p style={paragraphStyle}>{t("back.terms.publicDescr7")}</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
