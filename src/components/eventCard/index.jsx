import { Skeleton } from "antd";
import { CalendarOutlined, CheckCircleFilled } from "@ant-design/icons";
import { NOT_FOUND_IMG } from "assets";
import { SYS_DISPLAY_DATE_FORMAT } from "constants/helper";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { usePublicImageUrl } from "utils/fileUtils";
import { PinIcon, TypeIcon } from "./typeIcons";

const EventCard = ({
    id,
    link,
    logoUrl = NOT_FOUND_IMG,
    province = "",
    name = "",
    eventDate = null,
    eventStatus = "",
    type = "",
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

    const statusColor =
        eventStatus === "soon"
            ? "text-primary"
            : eventStatus === "openRegistration"
                ? "text-green-600"
                : "text-red-300";

    return (
        <div key={`event-${id}`} className="m-auto max-w-[425px] w-full h-full">
            <Link
                to={`/eventDetail/${link || id}`}
                className="group h-full bg-white rounded-[18px] md:rounded overflow-hidden border border-slate-200 md:border-gray-100 shadow-[0_14px_35px_rgba(15,23,42,0.08)] md:shadow-[0_10px_15px_2px_rgba(0,0,0,0.03)] flex flex-col transition-all duration-300 md:hover:shadow-none"
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

                <div className={`${compact ? "p-3" : "p-5"} md:p-3 flex flex-col flex-1`}>
                    <h3 className={`${compact ? "text-[15px] leading-snug" : "text-[24px] leading-tight"} md:text-base font-bold text-gray-900 md:leading-snug line-clamp-2 break-words`}>
                        {name}
                    </h3>

                    {(provinceLabel || type) && (
                        <div className={`flex items-center gap-2 ${compact ? "mt-2 flex-wrap" : "mt-3"}`}>
                            {provinceLabel && (
                                <span className="inline-flex items-center gap-1 bg-[#e7e8ff] text-[#091842] text-[12px] md:text-[11px] font-bold px-3 py-1 rounded-lg">
                                    <PinIcon className="w-3.5 h-3.5 md:w-3 md:h-3 shrink-0" />
                                    {provinceLabel}
                                </span>
                            )}
                            {type && (
                                <span className={`inline-flex items-center gap-1 bg-[#fbe5da] text-[#c63d00] text-[12px] md:text-[11px] font-bold ${compact ? "px-2" : "px-3 ml-auto"} py-1 rounded-lg max-w-full`}>
                                    <TypeIcon type={type} className="w-3.5 h-3.5 md:w-3 md:h-3 shrink-0" />
                                    {type}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Date stays on one line; the status drops below it when the card is narrow. */}
                    <div className={`${compact ? "mt-3" : "mt-5"} md:mt-auto md:pt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2`}>
                        <div className={`flex items-center ${compact ? "gap-1.5 text-[13px] leading-tight min-w-0" : "gap-2.5 text-[18px] whitespace-nowrap"} md:gap-2 text-[#1f2330] font-semibold md:text-sm md:whitespace-nowrap`}>
                            <span className={`inline-flex items-center justify-center shrink-0 ${compact ? "w-7 h-7" : "w-9 h-9"} md:w-7 md:h-7 rounded-lg bg-brand text-white shadow-sm`}>
                                <CalendarOutlined className={`${compact ? "text-sm" : "text-[18px]"} md:text-sm`} />
                            </span>
                            {dayjs(eventDate).format(SYS_DISPLAY_DATE_FORMAT)}
                        </div>
                        {statusText && (
                            <div className={`flex items-center gap-2 font-bold text-[13px] md:text-xs whitespace-nowrap ${statusColor}`}>
                                {eventStatus === "openRegistration" && <CheckCircleFilled />}
                                {statusText}
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default EventCard;
