/**
 * Registration-form fields an organizer can hide, make optional or require, with the platform
 * default for each. Mirrors `utils/RegistrationFieldConfig.java` — keep both lists the same.
 * Name, birth date, gender and e-mail are always required and not listed.
 */
export const FIELD_MODES = ["HIDDEN", "OPTIONAL", "REQUIRED"];

export const FIELD_CONFIG_DEFAULTS = {
  pictureUrl: "OPTIONAL",
  firstNameEn: "REQUIRED",
  lastNameEn: "REQUIRED",
  idNo: "REQUIRED",
  phone: "REQUIRED",
  province: "REQUIRED",
  nationality: "REQUIRED",
  bloodType: "REQUIRED",
  healthIssues: "OPTIONAL",
  emergencyContact: "REQUIRED",
  emergencyRelation: "REQUIRED",
  emergencyPhone: "REQUIRED",
  teamClub: "OPTIONAL",
};

/** Effective mode of every field for an event (defaults filled in). */
export const resolveFieldConfig = (event) => {
  const stored = event?.fieldConfig || {};
  const out = { ...FIELD_CONFIG_DEFAULTS };
  Object.keys(FIELD_CONFIG_DEFAULTS).forEach((k) => {
    const v = String(stored[k] || "").toUpperCase();
    if (FIELD_MODES.includes(v)) out[k] = v;
  });
  return out;
};

export const isShown = (config, key) => config[key] !== "HIDDEN";
export const isRequired = (config, key) => config[key] === "REQUIRED";
