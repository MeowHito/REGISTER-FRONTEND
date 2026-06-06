export const buildAgeGroupLabel = (rawCode, t, options = {}) => {
  const fallback = options.fallback ?? "-";

  if (!rawCode) return fallback;

  const code = String(rawCode).trim();
  if (!code) return fallback;

  const years = t("general.years");
  const upTo = t("general.upTo");
  const above = t("general.above");

  if (code.endsWith("+")) {
    const min = code.slice(0, -1).trim();
    return `${min} ${above}`;
  }

  if (code.includes("-")) {
    const [rawMin, rawMax] = code.split("-").map((n) => n.trim());
    const min = rawMin === "" ? undefined : Number(rawMin);
    const max = rawMax === "" ? undefined : Number(rawMax);

    if ((min === 0 || min == null) && max != null) {
      return `${upTo} ${max} ${years}`;
    }

    if (min != null && max != null) {
      return `${min} - ${max} ${years}`;
    }
  }

  return code;
};

export const buildAgeLabelFromAge = (age, t, options = {}) => {
  const fallback = options.fallback ?? "-";
  if (age == null || isNaN(age)) return fallback;
  return `${age} ${t("general.years")}`;
};
