import { CloseOutlined, StarFilled, SwapOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import useActiveEvent from "hooks/useActiveEvent";

/** Strip under the back-office header naming the starred event, with change / clear. */
export default function ActiveEventBar({ className = "" }) {
  const { t } = useTranslation();
  const { activeEvent, clearActiveEvent } = useActiveEvent();
  if (!activeEvent) return null;

  return (
    <div className={`bo-card flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 mb-5 ${className}`}>
      <span className="text-[#f5b301] text-base leading-none"><StarFilled /></span>
      <span className="text-[13px] text-[#6e6e73]">{t("back.workspace.managing")}</span>
      <span className="font-semibold text-[#1d1d1f] truncate min-w-0 flex-1" title={activeEvent.name}>
        {activeEvent.name}
      </span>
      <div className="flex items-center gap-1 ml-auto">
        <Link to="/dashboard">
          <Button type="text" size="small" icon={<SwapOutlined />}>
            {t("back.workspace.change")}
          </Button>
        </Link>
        <Button type="text" size="small" icon={<CloseOutlined />} onClick={clearActiveEvent}>
          {t("back.workspace.clear")}
        </Button>
      </div>
    </div>
  );
}
