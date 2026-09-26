// Number and label helpers shared by the report tabs (kept apart from the components for fast refresh).

export const num = (v) => {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
};
export const fmtMoney = (v) => num(v).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtInt = (v) => num(v).toLocaleString("th-TH");
export const pct = (part, total) => (num(total) ? Math.round((num(part) / num(total)) * 100) : 0);

const METHOD_LABELS = { creditcard: "Credit Card", qrcode: "QR Code", ewallet: "eWallet", alipay: "Alipay", wechatpay: "WeChat Pay", test: "Test mode", free: "Free" };
export const methodLabel = (m) => {
  if (!m) return "–";
  const k = String(m).toLowerCase().replace(/[^a-z0-9]/g, "");
  return METHOD_LABELS[k] || m;
};

