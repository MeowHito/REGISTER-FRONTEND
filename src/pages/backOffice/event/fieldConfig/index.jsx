import { Segmented } from "antd";
import CommonForm from "components/commonForm";
import { useTranslation } from "react-i18next";
import { FIELD_CONFIG_DEFAULTS, FIELD_MODES } from "pages/front/registration/pages/StreamlinedRegistration/fieldConfig";

/** value = { fieldKey: "HIDDEN" | "OPTIONAL" | "REQUIRED" } — missing keys mean the default. */
const FieldConfigTable = ({ value, onChange, disabled }) => {
    const { t } = useTranslation();
    const current = value || {};
    const options = FIELD_MODES.map((m) => ({ value: m, label: t(`back.event.form.fieldMode.${m}`) }));

    return (
        <div className="divide-y divide-[#e5e5ea] rounded-xl border border-[#e5e5ea] overflow-hidden">
            {Object.entries(FIELD_CONFIG_DEFAULTS).map(([key, def]) => {
                const mode = current[key] || def;
                return (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 bg-white">
                        <div>
                            <div className="text-sm font-medium text-[#1d1d1f]">{t(`back.event.form.field.${key}`)}</div>
                            {mode !== def && (
                                <div className="text-[11px] text-[#6e6e73]">
                                    {t("back.event.form.fieldDefault", { mode: t(`back.event.form.fieldMode.${def}`) })}
                                </div>
                            )}
                        </div>
                        <Segmented
                            size="small"
                            disabled={disabled}
                            value={mode}
                            options={options}
                            onChange={(m) => onChange?.({ ...current, [key]: m })}
                        />
                    </div>
                );
            })}
        </div>
    );
};

/** Which registration fields this event asks for (name, birth date, gender and e-mail are always on). */
const FieldConfig = ({ isEditable = true }) => {
    const { t } = useTranslation();
    return (
        <>
            <div className="rounded-xl bg-[#f0f6ff] border border-[#cfe2fb] text-[13px] text-[#0b4f99] px-4 py-3 mb-4">
                {t("back.event.form.fieldConfigHelp")}
            </div>
            <CommonForm.Item name="fieldConfig" className="!mb-0">
                <FieldConfigTable disabled={!isEditable} />
            </CommonForm.Item>
        </>
    );
};

export default FieldConfig;
