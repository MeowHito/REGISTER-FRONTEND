
export const formatMoney = (amount) => amount.toLocaleString("th-TH", { minimumFractionDigits: 2 });

export const calculatePaymentFeePercent = (paymentType) => {
  const qrChannels = ["qrcode"];
  const creditChannels = ["creditcard", "ewallet", "alipay", "wechatpay"];
  if (qrChannels.includes(paymentType)) return 3;
  if (creditChannels.includes(paymentType)) return 5;
  return 0;
};

export const convertDateToThaiFormat = (inputDate) => {
  if (!inputDate) return "-";
  const date = new Date(inputDate);
  const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543} เวลา ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} น.`;
};

export const base64ToJson = (base64String) => {
  try {
    const decoded = decodeURIComponent(escape(globalThis.atob(base64String)));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const base64url = (str) => {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};
