// Dialling codes offered next to every phone field. Thailand first, then the countries whose
// runners register most often, then the rest alphabetically. `code` is what the backend stores.
export const DEFAULT_PHONE_COUNTRY_CODE = "+66";

export const PHONE_COUNTRY_CODES = [
  { code: "+66", iso: "TH", flag: "🇹🇭", name: "ไทย", nameEn: "Thailand" },
  { code: "+856", iso: "LA", flag: "🇱🇦", name: "ลาว", nameEn: "Laos" },
  { code: "+95", iso: "MM", flag: "🇲🇲", name: "เมียนมา", nameEn: "Myanmar" },
  { code: "+855", iso: "KH", flag: "🇰🇭", name: "กัมพูชา", nameEn: "Cambodia" },
  { code: "+84", iso: "VN", flag: "🇻🇳", name: "เวียดนาม", nameEn: "Vietnam" },
  { code: "+60", iso: "MY", flag: "🇲🇾", name: "มาเลเซีย", nameEn: "Malaysia" },
  { code: "+65", iso: "SG", flag: "🇸🇬", name: "สิงคโปร์", nameEn: "Singapore" },
  { code: "+62", iso: "ID", flag: "🇮🇩", name: "อินโดนีเซีย", nameEn: "Indonesia" },
  { code: "+63", iso: "PH", flag: "🇵🇭", name: "ฟิลิปปินส์", nameEn: "Philippines" },
  { code: "+86", iso: "CN", flag: "🇨🇳", name: "จีน", nameEn: "China" },
  { code: "+852", iso: "HK", flag: "🇭🇰", name: "ฮ่องกง", nameEn: "Hong Kong" },
  { code: "+886", iso: "TW", flag: "🇹🇼", name: "ไต้หวัน", nameEn: "Taiwan" },
  { code: "+81", iso: "JP", flag: "🇯🇵", name: "ญี่ปุ่น", nameEn: "Japan" },
  { code: "+82", iso: "KR", flag: "🇰🇷", name: "เกาหลีใต้", nameEn: "South Korea" },
  { code: "+91", iso: "IN", flag: "🇮🇳", name: "อินเดีย", nameEn: "India" },
  { code: "+61", iso: "AU", flag: "🇦🇺", name: "ออสเตรเลีย", nameEn: "Australia" },
  { code: "+64", iso: "NZ", flag: "🇳🇿", name: "นิวซีแลนด์", nameEn: "New Zealand" },
  { code: "+1", iso: "US", flag: "🇺🇸", name: "สหรัฐอเมริกา / แคนาดา", nameEn: "USA / Canada" },
  { code: "+44", iso: "GB", flag: "🇬🇧", name: "สหราชอาณาจักร", nameEn: "United Kingdom" },
  { code: "+49", iso: "DE", flag: "🇩🇪", name: "เยอรมนี", nameEn: "Germany" },
  { code: "+33", iso: "FR", flag: "🇫🇷", name: "ฝรั่งเศส", nameEn: "France" },
  { code: "+39", iso: "IT", flag: "🇮🇹", name: "อิตาลี", nameEn: "Italy" },
  { code: "+34", iso: "ES", flag: "🇪🇸", name: "สเปน", nameEn: "Spain" },
  { code: "+31", iso: "NL", flag: "🇳🇱", name: "เนเธอร์แลนด์", nameEn: "Netherlands" },
  { code: "+32", iso: "BE", flag: "🇧🇪", name: "เบลเยียม", nameEn: "Belgium" },
  { code: "+41", iso: "CH", flag: "🇨🇭", name: "สวิตเซอร์แลนด์", nameEn: "Switzerland" },
  { code: "+43", iso: "AT", flag: "🇦🇹", name: "ออสเตรีย", nameEn: "Austria" },
  { code: "+45", iso: "DK", flag: "🇩🇰", name: "เดนมาร์ก", nameEn: "Denmark" },
  { code: "+46", iso: "SE", flag: "🇸🇪", name: "สวีเดน", nameEn: "Sweden" },
  { code: "+47", iso: "NO", flag: "🇳🇴", name: "นอร์เวย์", nameEn: "Norway" },
  { code: "+358", iso: "FI", flag: "🇫🇮", name: "ฟินแลนด์", nameEn: "Finland" },
  { code: "+353", iso: "IE", flag: "🇮🇪", name: "ไอร์แลนด์", nameEn: "Ireland" },
  { code: "+351", iso: "PT", flag: "🇵🇹", name: "โปรตุเกส", nameEn: "Portugal" },
  { code: "+48", iso: "PL", flag: "🇵🇱", name: "โปแลนด์", nameEn: "Poland" },
  { code: "+420", iso: "CZ", flag: "🇨🇿", name: "เช็ก", nameEn: "Czech Republic" },
  { code: "+7", iso: "RU", flag: "🇷🇺", name: "รัสเซีย", nameEn: "Russia" },
  { code: "+90", iso: "TR", flag: "🇹🇷", name: "ตุรกี", nameEn: "Turkey" },
  { code: "+971", iso: "AE", flag: "🇦🇪", name: "สหรัฐอาหรับเอมิเรตส์", nameEn: "United Arab Emirates" },
  { code: "+966", iso: "SA", flag: "🇸🇦", name: "ซาอุดีอาระเบีย", nameEn: "Saudi Arabia" },
  { code: "+974", iso: "QA", flag: "🇶🇦", name: "กาตาร์", nameEn: "Qatar" },
  { code: "+972", iso: "IL", flag: "🇮🇱", name: "อิสราเอล", nameEn: "Israel" },
  { code: "+27", iso: "ZA", flag: "🇿🇦", name: "แอฟริกาใต้", nameEn: "South Africa" },
  { code: "+20", iso: "EG", flag: "🇪🇬", name: "อียิปต์", nameEn: "Egypt" },
  { code: "+55", iso: "BR", flag: "🇧🇷", name: "บราซิล", nameEn: "Brazil" },
  { code: "+52", iso: "MX", flag: "🇲🇽", name: "เม็กซิโก", nameEn: "Mexico" },
  { code: "+54", iso: "AR", flag: "🇦🇷", name: "อาร์เจนตินา", nameEn: "Argentina" },
  { code: "+56", iso: "CL", flag: "🇨🇱", name: "ชิลี", nameEn: "Chile" },
  { code: "+92", iso: "PK", flag: "🇵🇰", name: "ปากีสถาน", nameEn: "Pakistan" },
  { code: "+880", iso: "BD", flag: "🇧🇩", name: "บังกลาเทศ", nameEn: "Bangladesh" },
  { code: "+94", iso: "LK", flag: "🇱🇰", name: "ศรีลังกา", nameEn: "Sri Lanka" },
  { code: "+977", iso: "NP", flag: "🇳🇵", name: "เนปาล", nameEn: "Nepal" },
  { code: "+975", iso: "BT", flag: "🇧🇹", name: "ภูฏาน", nameEn: "Bhutan" },
  { code: "+673", iso: "BN", flag: "🇧🇳", name: "บรูไน", nameEn: "Brunei" },
  { code: "+976", iso: "MN", flag: "🇲🇳", name: "มองโกเลีย", nameEn: "Mongolia" },
  { code: "+998", iso: "UZ", flag: "🇺🇿", name: "อุซเบกิสถาน", nameEn: "Uzbekistan" },
  { code: "+7", iso: "KZ", flag: "🇰🇿", name: "คาซัคสถาน", nameEn: "Kazakhstan" },
];

/** Select options: "🇹🇭 +66" with the country name searchable. */
export const phoneCountryOptions = (lang = "th") =>
  PHONE_COUNTRY_CODES.map((c) => ({
    value: `${c.code}|${c.iso}`,
    code: c.code,
    label: `${c.flag} ${c.code}`,
    filterLabel: `${c.code} ${c.name} ${c.nameEn} ${c.iso}`,
    title: lang === "en" ? c.nameEn : c.name,
  }));

/** Stored value ("+66") -> select value ("+66|TH"); unknown codes fall back to Thailand. */
export const toSelectValue = (code) => {
  const c = PHONE_COUNTRY_CODES.find((x) => x.code === (code || DEFAULT_PHONE_COUNTRY_CODE));
  return c ? `${c.code}|${c.iso}` : `${DEFAULT_PHONE_COUNTRY_CODE}|TH`;
};

/** Select value ("+66|TH") -> stored code ("+66"). */
export const fromSelectValue = (value) => (value ? String(value).split("|")[0] : DEFAULT_PHONE_COUNTRY_CODE);

/** Number rule for a dialling code: Thai numbers stay 0XXXXXXXXX, others are 6-15 digits. */
export const phonePattern = (code) =>
  (code || DEFAULT_PHONE_COUNTRY_CODE) === DEFAULT_PHONE_COUNTRY_CODE ? /^0\d{9}$/ : /^\d{6,15}$/;

/** "+66 0812345678" / "0812345678" for display; blank when there is no number. */
export const formatPhone = (code, number) => {
  if (!number) return "";
  const c = code || DEFAULT_PHONE_COUNTRY_CODE;
  return c === DEFAULT_PHONE_COUNTRY_CODE ? number : `${c} ${number}`;
};
