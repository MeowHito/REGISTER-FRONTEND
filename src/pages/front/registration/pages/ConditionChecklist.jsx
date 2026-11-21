import { useState } from "react";
import { Button, Checkbox, Modal } from "antd";
import { useTranslation } from "react-i18next";
import ConditionText from "components/conditionText";

/**
 * The "check before you pay" list. Each condition is one large tappable row: tapping anywhere
 * on it (box or words) ticks it. Blue {braced} words open the organizer's detail in a popup,
 * whose "accept" button also ticks that condition.
 *
 * conditions: [{ value, description, detail }]; value: ticked values; onChange(values).
 */
export default function ConditionChecklist({ conditions = [], value = [], onChange }) {
  const { t } = useTranslation();
  const [popup, setPopup] = useState(null); // { cond, title }

  const isOn = (v) => value.includes(v);
  const setOne = (v, on) =>
    onChange?.(on ? [...new Set([...value, v])] : value.filter((x) => x !== v));

  return (
    <>
      <div className="flex flex-col gap-2">
        {conditions.map((c) => {
          const on = isOn(c.value);
          return (
            // antd's Checkbox is itself a <label>, so the whole row (box + words) toggles it.
            <Checkbox
              key={c.value}
              checked={on}
              onChange={(e) => setOne(c.value, e.target.checked)}
              className={`cond-row !m-0 w-full flex items-start gap-1 rounded-xl border px-3.5 py-3 select-none transition-colors ${on
                ? "border-[#0071e3]/40 bg-[#eef6ff]"
                : "border-[#e5e9eb] bg-white hover:border-[#bfc7d2] hover:bg-[#f8fafb]"}`}
            >
              <span className="block text-[15px] leading-relaxed text-[#181c1e]">
                <ConditionText
                  text={c.description}
                  detail={c.detail}
                  onOpen={(title) => setPopup({ cond: c, title })}
                />
              </span>
            </Checkbox>
          );
        })}
      </div>

      <Modal
        open={!!popup}
        title={popup?.title}
        onCancel={() => setPopup(null)}
        centered
        width={640}
        footer={[
          <Button key="close" size="large" onClick={() => setPopup(null)}>
            {t("front.reg.condition.close")}
          </Button>,
          <Button
            key="accept"
            size="large"
            type="primary"
            onClick={() => { setOne(popup.cond.value, true); setPopup(null); }}
          >
            {t("front.reg.condition.accept")}
          </Button>,
        ]}
      >
        <div className="max-h-[60vh] overflow-y-auto whitespace-pre-line break-words text-[15px] leading-relaxed text-[#3f4850] pr-1">
          {popup?.cond?.detail}
        </div>
      </Modal>
    </>
  );
}
