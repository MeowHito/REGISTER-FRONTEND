// Thai names for the nationalities runners actually pick, so typing "ไทย" or "Thai" finds them.
const NATIONALITY_TH = {
  THA: "ไทย", LAO: "ลาว", MMR: "เมียนมา", KHM: "กัมพูชา", VNM: "เวียดนาม", MYS: "มาเลเซีย",
  SGP: "สิงคโปร์", IDN: "อินโดนีเซีย", PHL: "ฟิลิปปินส์", CHN: "จีน", JPN: "ญี่ปุ่น", KOR: "เกาหลีใต้",
  TWN: "ไต้หวัน", HKG: "ฮ่องกง", IND: "อินเดีย", USA: "อเมริกัน", GBR: "อังกฤษ", FRA: "ฝรั่งเศส",
  DEU: "เยอรมัน", AUS: "ออสเตรเลีย", OTH: "อื่นๆ",
};

// Thai first, then the rest A-Z; label shows "ไทย / Thai" where we know the Thai name.
export const buildNationalityOptions = (list) =>
  [...list]
    .sort((a, b) => (a.value === "THA" ? -1 : b.value === "THA" ? 1 : a.label.localeCompare(b.label)))
    .map(({ value, label }) => {
      const th = NATIONALITY_TH[value];
      return { value, label: th ? `${th} / ${label}` : label, filterLabel: `${th || ""} ${label} ${value}` };
    });

export const DEFAULT_NATIONALITY = "THA";
