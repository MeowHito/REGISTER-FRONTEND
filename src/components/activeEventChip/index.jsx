import { StarFilled } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import useActiveEvent from "hooks/useActiveEvent";

/** The starred event, shown in the back-office top bar, with a button to go pick another. */
export default function ActiveEventChip({ className = "" }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeEvent } = useActiveEvent();
  if (!activeEvent) return null;

  return (
    <div
      className={`items-center gap-2 h-9 pl-2.5 pr-1 rounded-lg border border-[rgba(245,179,1,0.45)] bg-[rgba(245,179,1,0.1)] min-w-0 max-w-[460px] ${className}`}
    >
      {/* Colour on a wrapper: antd's .anticon rule beats a utility class on the icon itself. */}
      <span className="text-[#f5b301] text-sm leading-none shrink-0"><StarFilled /></span>
      <span className="min-w-0 flex-1 text-sm font-semibold text-[#1d1d1f] truncate" title={activeEvent.name}>
        {activeEvent.name}
      </span>
      <Button size="small" className="shrink-0" onClick={() => navigate("/dashboard")}>
        {t("back.workspace.changeShort")}
      </Button>
    </div>
  );
}
