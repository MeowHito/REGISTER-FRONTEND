import { Button, Modal } from "antd";
import { useTranslation } from "react-i18next";

/**
 * The PDPA disclosure-consent wording (Personal Data Protection Act B.E. 2562). Shared by the
 * registration prompt and the preview in the event form, so organizers see exactly what runners read.
 */
export function PdpaConsentText({ eventName, className = "" }) {
  const { t } = useTranslation();
  const paragraphs = t("pdpa.body", { event: eventName || t("pdpa.thisEvent") }).split("\n\n");
  return (
    <div className={`flex flex-col gap-3 text-[14px] leading-relaxed text-[#3f4850] ${className}`}>
      {paragraphs.map((p, i) => <p key={i} className="m-0">{p}</p>)}
    </div>
  );
}

/**
 * Shown before registration when the event asks for consent. It cannot be dismissed without a
 * choice; declining still lets the runner register (consent must be freely given).
 */
export default function PdpaConsentModal({ open, eventName, onAccept, onDecline }) {
  const { t } = useTranslation();
  const actions = (
    <div className="flex justify-center gap-3">
      <Button size="large" className="min-w-[120px] !bg-[#6e6e73] !border-[#6e6e73] !text-white" onClick={onDecline}>
        {t("pdpa.decline")}
      </Button>
      <Button size="large" type="primary" className="min-w-[120px] !bg-[#1a9c3e] !border-[#1a9c3e]" onClick={onAccept}>
        {t("pdpa.accept")}
      </Button>
    </div>
  );
  return (
    <Modal
      open={open}
      closable={false}
      maskClosable={false}
      keyboard={false}
      centered
      width={560}
      footer={null}
      title={<span className="text-[17px] font-bold leading-snug">{t("pdpa.title")}</span>}
    >
      <div className="pt-2">
        {actions}
        <div className="my-4 max-h-[50vh] overflow-y-auto pr-1">
          <PdpaConsentText eventName={eventName} />
          <p className="m-0 mt-3 text-[12px] text-[#6e6e73]">{t("pdpa.optionalNote")}</p>
        </div>
        {actions}
      </div>
    </Modal>
  );
}
