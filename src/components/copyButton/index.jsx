import React, { useState } from "react";
import { message } from "antd";
import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { copyText } from "./copyText";

/**
 * Small copy button for an order number and the like. `label` shows the word "คัดลอก" next to
 * the icon (the payment page); without it the button is icon-only (success / QR pages).
 */
const CopyButton = ({ text, label = false, className = "" }) => {
  const { t } = useTranslation();
  const [done, setDone] = useState(false);

  const onCopy = async (e) => {
    e.stopPropagation();
    if (!text) return;
    try {
      await copyText(String(text));
      setDone(true);
      message.success(t("general.copySuccess"));
      setTimeout(() => setDone(false), 1500);
    } catch {
      message.error(t("general.copyError"));
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={t("general.copy")}
      title={t("general.copy")}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all shrink-0 ${
        label ? "px-3 py-2 text-sm font-semibold text-slate-700" : "p-1.5"
      } ${className}`}
    >
      {done ? <CheckOutlined className="text-emerald-600" /> : <CopyOutlined />}
      {label ? <span>{t("general.copy")}</span> : null}
    </button>
  );
};

export default CopyButton;
