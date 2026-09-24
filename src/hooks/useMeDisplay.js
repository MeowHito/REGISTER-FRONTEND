import { useTranslation } from "react-i18next";
import { usePublicImageUrl } from "utils/fileUtils";

// Display helpers for the signed-in user (header + sidebar of the back office).

export function useRoleLabel(me) {
  const { t } = useTranslation();
  const roleType = me?.role?.roleType;
  if (roleType === "admin") return t("back.shell.role.admin");
  if (roleType === "organizer") return t("back.shell.role.organizer");
  if (roleType === "guest") return t("back.shell.role.guest");
  return me?.role?.role || "";
}

export function useDisplayName(me) {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.toLowerCase() === "en";
  const name = isEn && me?.firstNameEn
    ? [me?.firstNameEn, me?.lastNameEn].filter(Boolean).join(" ")
    : [me?.firstName, me?.lastName].filter(Boolean).join(" ");
  return name || me?.email || "";
}

export function useAvatarUrl(me) {
  const { data } = usePublicImageUrl({ key: me?.pictureUrl, prefix: me?.prefixPath || "userData" });
  return me?.pictureUrl ? data : null;
}
