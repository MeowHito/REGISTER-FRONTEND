import { message } from "antd";

export { default as errorLogger } from "./errorLogger";

export const PUBLIC_API = "/public-api";

// Routes that should render edge-to-edge (no max-w-[1200px] container)
const FULL_WIDTH_PREFIXES = ["/backoffice", "/contact", "/eventCalendar", "/registrationInfo", "/eventDetail"];

export function isFullWidthPath(pathname = "") {
  if (pathname === "/") return true;
  return FULL_WIDTH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export const UPLOAD_TIME = import.meta.env.VITE_STORAGE_UPLOAD_TIME;
export const DOWNLOAD_TIME = import.meta.env.VITE_STORAGE_DOWNLOAD_TIME;
export const STORAGE_CHECK_IN = import.meta.env.VITE_STORAGE_CHECK_IN;
export const STORAGE_CHECK_OUT = import.meta.env.VITE_STORAGE_CHECK_OUT;

export function clearLegacyStorage() {
  const LEGACY_KEYS = [
    import.meta.env.VITE_STORAGE_TOKEN,
    import.meta.env.VITE_STORAGE_USER,
  ].filter(Boolean);
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
}

export function handleQueryStatus(
  { status, fetchStatus },
  onSuccess = () => { },
  onError
) {
  if ((!fetchStatus || fetchStatus === "idle") && status === "success" && typeof onSuccess === "function") {
    return onSuccess();
  }
  if ((!fetchStatus || fetchStatus === "idle") && status === "error") {
    if (typeof onError === "function") return onError();
    message.error("Error occurred");
    return null;
  }
  return null;

}

export const getMenuPermission = (rawId, me) => {
  const perm = me?.role?.permissions?.find((p) => p.menu?.title === rawId);
  return {
    canRead: perm?.canRead || false,
    canCreate: perm?.canCreate || false,
    canUpdate: perm?.canUpdate || false,
    canDelete: perm?.canDelete || false,
  };
};

export const mergePermissions = (menuPerm, record, recordPermission) => {
  if (!recordPermission) return menuPerm;

  const perm = record?.permission || record;
  return {
    canRead: menuPerm.canRead && (perm?.canRead ?? true),
    canCreate: menuPerm.canCreate && (record?.canCreate ?? true),
    canUpdate: menuPerm.canUpdate && (perm?.canUpdate ?? true),
    canDelete: menuPerm.canDelete && (perm?.canDelete ?? true),
  };
};