import { Skeleton } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import { NOT_FOUND_IMG } from "assets";
import { SYS_DISPLAY_DATE_FORMAT } from "constants/helper";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { usePublicImageUrl } from "utils/fileUtils";
import { PinIcon, TypeIcon } from "./typeIcons";
import Pill from "components/pill";
import useFitText from "./useFitText";
import { distanceChips } from "./utils";

const STATUS_TONE = { openRegistration: "green", soon: "blue", closedRegistration: "red" };

const EventCard = ({
    id,
    link,
    logoUrl = NOT_FOUND_IMG,
    province = "",
    name = "",
    eventDate = null,
    eventStatus = "",
    type = "",
    distances = [],
    // Two cards side by side on a phone (/event): smaller type so nothing spills out.
    compact = false,
}) => {
    const { t, i18n } = useTranslation();
    const { data: logoPreviewUrl, isFetching } = usePublicImageUrl({ key: logoUrl, prefix: "event", isPublic: true });
    const currentLanguage = i18n.language?.toLowerCase();
    const provinceLabel = province
        ? currentLanguage === "th"
            ? province.stateLocal
            : province.stateEn
        : "";

    const statusText =
        eventStatus === "soon"
            ? t("general.soon")
            : eventStatus === "openRegistration"
                ? t("general.openRegistration")
                : eventStatus === "closedRegistration"
                    ? t("general.closedRegistration")
                    : "";

    const status = STATUS_TONE[eventStatus] || "red";

    const titleRef = useFitText(name, compact ? 13 : 15);
    const chips = distanceChips(distances);
    const maxChips = compact ? 2 : 4;
    const shownChips = chips.slice(0, maxChips);
    const hiddenChips = chips.length - shownChips.length;

    return (
        <div key={`event-${id}`} className="m-auto max-w-[425px] w-full h-full">
            <Link
                to={`/eventDetail/${link || id}`}
                className="group h-full bg-white rounded-[18px] md:rounded-2xl overflow-hidden border border-slate-200 md:border-gray-100 shadow-[0_14px_35px_rgba(15,23,42,0.08)] md:shadow-[0_10px_15px_2px_rgba(0,0,0,0.03)] flex flex-col transition-all duration-300 md:hover:shadow-none"
            >
                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                    {isFetching ? (
                        <Skeleton.Image
                            active
                            className="!w-full !h-full"
                        />
                    ) : (
                        <img
                            src={logoPreviewUrl || NOT_FOUND_IMG}
                            alt={name}
                            onError={(e) => { e.currentTarget.src = NOT_FOUND_IMG; }}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    )}
                </div>

                <div className={`${compact ? "p-3" : "p-4"} md:p-3.5 flex flex-col flex-1`}>
                    {/* One line: the name shrinks to fit, and only a very long one ends in "…". */}
                    <h3
                        ref={titleRef}
                        title={name}
                        className={`${compact ? "text-[15px]" : "text-[21px] md:text-[17px]"} leading-snug font-bold text-[#0f172a] whitespace-nowrap overflow-hidden text-ellipsis`}
                    >
                        {name}
                    </h3>

                    {chips.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {shownChips.map((label, i) => (
                                <Pill key={label} tone={i === 0 ? "blue" : "slate"} title={label}>{label}</Pill>
                            ))}
                            {hiddenChips > 0 && <Pill tone="slate">+{hiddenChips}</Pill>}
                        </div>
                    )}

                    {(provinceLabel || type) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {provinceLabel && (
                                <Pill tone="blue" title={provinceLabel} icon={<PinIcon className="w-3.5 h-3.5" />}
                                    className="!text-slate-700">
                                    {provinceLabel}
                                </Pill>
                            )}
                            {type && (
                                <Pill tone="amber" title={type} icon={<TypeIcon type={type} className="w-3.5 h-3.5" />}>
                                    {type}
                                </Pill>
                            )}
                        </div>
                    )}

                    {/* Date and registration status sit together in one soft box at the bottom. */}
                    <div className="mt-auto pt-3">
                        <div className="border-t border-slate-100 pt-3">
                            <div className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/80 ${compact ? "p-2" : "px-3 py-2.5"}`}>
                                <div className={`flex items-center min-w-0 ${compact ? "gap-2" : "gap-3"}`}>
                                    <span className={`inline-flex items-center justify-center shrink-0 ${compact ? "w-8 h-8 rounded-lg" : "w-9 h-9 rounded-xl"} bg-[#1d4ed8] text-white shadow-sm`}>
                                        <CalendarOutlined className={compact ? "text-sm" : "text-base"} />
                                    </span>
                                    <span className="flex flex-col min-w-0">
                                        <span className="text-[12px] font-medium text-slate-400 leading-tight">{t("front.home.eventDay")}</span>
                                        <span className={`${compact ? "text-[13px]" : "text-[15px]"} font-bold text-[#0f172a] leading-tight`}>
                                            {dayjs(eventDate).format(SYS_DISPLAY_DATE_FORMAT)}
                                        </span>
                                    </span>
                                </div>
                                {statusText && <Pill tone={status} dot>{statusText}</Pill>}
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default EventCard;
