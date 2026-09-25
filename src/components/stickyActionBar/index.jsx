import { Button } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

/**
 * Save / cancel bar pinned to the bottom of a back-office form. Shows an orange
 * dot while there are unsaved changes.
 */
export default function StickyActionBar({
  dirty = false,
  onCancel,
  onSave,
  saving = false,
  saveText,
  cancelText,
  saveIcon = <CheckOutlined />,
  saveHtmlType = "button",
  extra,
}) {
  const { t } = useTranslation();
  return (
    <div className="bo-sticky-bar sticky bottom-3 z-30 mt-6">
      <div className="bo-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 md:px-5 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 text-sm text-[#424245] min-h-[24px]">
          <span className={`w-2 h-2 rounded-full ${dirty ? "bg-[#ff9f0a]" : "bg-[#34c759]"}`} />
          {dirty ? t("back.shell.unsavedChanges") : t("back.shell.allSaved")}
        </div>
        <div className="flex items-center gap-2 justify-end">
          {extra}
          {onCancel && <Button onClick={onCancel}>{cancelText || t("general.cancel")}</Button>}
          <Button type="primary" icon={saveIcon} loading={saving} htmlType={saveHtmlType} onClick={onSave}>
            {saveText || t("general.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
