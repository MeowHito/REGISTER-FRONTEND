
export const formatMoney = (amount) => amount.toLocaleString("th-TH", { minimumFractionDigits: 2 });

// The backend recomputes every amount (OrderServiceImpl + PaymentFee) and charges its own figure;
// these round the same way so the page shows what will be charged. toFixed(6) strips float noise
// such as 2.2 * 5 = 11.000000000000002 before rounding to the satang.
export const calculateFeeAmount = (total, feePercent) => Math.ceil(Number((total * feePercent).toFixed(6))) / 100;
export const addMoney = (a, b) => Number((a + b).toFixed(2));
export const couponDiscountFor = (netPrice, percent) => Math.round(Number((netPrice * percent).toFixed(6))) / 100;

// Mirrors backend constant/PaymentFee.java.
export const calculatePaymentFeePercent = (paymentType) => {
  const qrChannels = ["qrcode", "mobilebanking"];
  const creditChannels = ["creditcard", "ewallet", "alipay", "wechatpay", "linepay", "shopeepay", "paotang"];
  if (qrChannels.includes(paymentType)) return 3;
  if (creditChannels.includes(paymentType)) return 5;
  return 0;
};

// Gregorian year, like every other date on the site (cards, event page, history).
// `lang` "en" gives "29 November 2026, 09:40"; anything else the Thai form.
export const convertDateToThaiFormat = (inputDate, lang) => {
  if (!inputDate) return "-";
  const date = new Date(inputDate);
  const hhmm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  if (String(lang || "").toLowerCase().startsWith("en")) {
    const enMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${date.getDate()} ${enMonths[date.getMonth()]} ${date.getFullYear()}, ${hhmm}`;
  }
  const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} เวลา ${hhmm} น.`;
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
