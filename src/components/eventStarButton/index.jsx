import { StarFilled, StarOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import useActiveEvent from "hooks/useActiveEvent";

/** Star toggle that makes `event` the back office's active (starred) event. */
export default function EventStarButton({ event }) {
  const { t } = useTranslation();
  const { activeEvent, toggleActiveEvent } = useActiveEvent();
  const starred = activeEvent?.id === event?.id;
  // No hover tooltip (by request); the label is for screen readers only.
  const label = starred ? t("back.workspace.unstar") : t("back.workspace.star");

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={starred}
      onClick={(e) => {
        e.stopPropagation();
        toggleActiveEvent(event);
      }}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-lg cursor-pointer transition-colors hover:bg-[rgba(0,0,0,0.05)] ${
        starred ? "text-[#f5b301]" : "text-[#a1a1a6] hover:text-[#6e6e73]"
      }`}
    >
      {starred ? <StarFilled /> : <StarOutlined />}
    </button>
  );
}
