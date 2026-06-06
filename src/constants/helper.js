export const timeout = 30000;
export const SYS_DATE_FORMAT = "DD/MM/YYYY";
export const SYS_DATE_TIME_FORMAT = "DD/MM/YYYY HH:mm";
export const SYS_DATE_FULL_TIME_FORMAT = "DD/MM/YYYY HH:mm:ss";
export const SYS_YEAR_MONTH_FORMAT = "MM/YYYY";
export const SYS_ISO_DATE_FORMAT = "YYYY-MM-DD";
export const SYS_DISPLAY_DATE_FORMAT = "DD MMMM YYYY";
export const CONTEXT_URL = globalThis.location.host.includes("localhost")
  ? import.meta.env.VITE_CONTEXT_URL_LOCAL
  : import.meta.env.VITE_CONTEXT_URL;
