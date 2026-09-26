import React, { useEffect, useState } from "react";
import { Modal, Select, Checkbox, Alert } from "antd";
import { useTranslation } from "react-i18next";

const MIN_MONTHS = 1;
const MAX_MONTHS = 36;

/**
 * Options for a manual "pull from the external calendar" run: how many months ahead to keep
 * (1-36) and whether to wipe the previously imported rows first. Manual submissions are never
 * touched by the wipe.
 */
export default function ImportSyncModal({ open, onCancel, onConfirm, loading, defaultMonths = 12 }) {
  const { t } = useTranslation();
  const [months, setMonths] = useState(defaultMonths);
  const [clearFirst, setClearFirst] = useState(true);

  useEffect(() => {
    if (open) {
      setMonths(defaultMonths || 12);
      setClearFirst(true);
    }
  }, [open, defaultMonths]);

  const options = Array.from({ length: MAX_MONTHS - MIN_MONTHS + 1 }, (_, i) => {
    const m = MIN_MONTHS + i;
    return { value: m, label: t("back.eventCalendarList.syncMonthsOption", { count: m }) };
  });

  return (
    <Modal
      title={t("back.eventCalendarList.syncNow")}
      open={open}
      onCancel={onCancel}
      onOk={() => onConfirm({ horizonMonths: months, clearFirst })}
      okText={t("back.eventCalendarList.syncStart")}
      cancelText={t("general.buttonCancel")}
      confirmLoading={loading}
      destroyOnHidden
    >
      <div className="flex flex-col gap-4 py-2">
        <div>
          <div className="mb-1 text-sm font-medium">{t("back.eventCalendarList.syncMonths")}</div>
          <Select className="w-full" value={months} options={options} onChange={setMonths} />
          <div className="mt-1 text-xs text-gray-500">{t("back.eventCalendarList.syncMonthsHint")}</div>
        </div>
        <Checkbox checked={clearFirst} onChange={(e) => setClearFirst(e.target.checked)}>
          {t("back.eventCalendarList.syncClearFirst")}
        </Checkbox>
        <Alert type="info" showIcon message={t("back.eventCalendarList.syncClearHint")} />
      </div>
    </Modal>
  );
}
