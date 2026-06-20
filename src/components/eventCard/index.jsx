import { Skeleton } from "antd";
import { CalendarOutlined, CheckCircleFilled } from "@ant-design/icons";
import { NOT_FOUND_IMG } from "assets";
import { SYS_DISPLAY_DATE_FORMAT } from "constants/helper";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { usePublicImageUrl } from "utils/fileUtils";

const EventCard = ({
    id,
    link,
    logoUrl = NOT_FOUND_IMG,
    province = "",
    name = "",
    eventDate = null,
    eventStatus = "",
    type = ""
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

                <div className="p-5 md:p-3 flex flex-col flex-1">
                    <h3 className="text-[24px] md:text-base font-bold text-gray-900 leading-tight md:leading-snug line-clamp-2">
                        {name}
                    </h3>

                    {(provinceLabel || type) && (
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            {provinceLabel && (
                                <span className="bg-[#e7e8ff] text-[#091842] text-[12px] md:text-[11px] font-bold px-3 py-1 rounded-lg">
                                    {provinceLabel}
                                </span>
                            )}
                            {type && (
                                <span className="bg-[#fbe5da] text-[#c63d00] text-[12px] md:text-[11px] font-bold px-3 py-1 rounded-lg">
                                    {type}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="mt-5 md:mt-auto md:pt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 md:gap-2 text-[#4b4d59] text-[18px] md:text-sm">
                            <CalendarOutlined className="text-brand text-[24px] md:text-base" />
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
