import { Skeleton } from "antd";
import { CalendarOutlined, CheckCircleFilled } from "@ant-design/icons";
import { NOT_FOUND_IMG } from "assets";
import { SYS_DISPLAY_DATE_FORMAT } from "constants/helper";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { usePublicImageUrl } from "utils/fileUtils";

// ----- Simple inline SVG icons (filled, inherit text color) -----
const Svg = ({ className, children }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        {children}
    </svg>
);

// หมุด (province)
const PinIcon = ({ className }) => (
    <Svg className={className}>
        <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
    </Svg>
);

// คนวิ่ง — withSpeed = มีเส้นความเร็ว (เร็วกว่า)
const RunIcon = ({ className, withSpeed }) => (
    <Svg className={className}>
        <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" />
        {withSpeed && (
            <>
                <rect x="0.5" y="8.5" width="4.5" height="1.4" rx="0.7" />
                <rect x="1.5" y="12" width="3.5" height="1.4" rx="0.7" />
            </>
        )}
    </Svg>
);

// คนเดิน (Mini Marathon / Fun Run)
const WalkIcon = ({ className }) => (
    <Svg className={className}>
        <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z" />
    </Svg>
);

// ต้นไม้/ป่า (Trail)
const TreeIcon = ({ className }) => (
    <Svg className={className}>
        <path d="M12 3 6 11h3l-5 7h16l-5-7h3L12 3zM10.5 18h3v3h-3z" />
    </Svg>
);

// จักรยาน (Cycling / Duathlon)
const BikeIcon = ({ className }) => (
    <Svg className={className}>
        <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z" />
    </Svg>
);

// ถ้วยรางวัล (Ironman)
const TrophyIcon = ({ className }) => (
    <Svg className={className}>
        <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
    </Svg>
);

// เหรียญ (Triathlon)
const MedalIcon = ({ className }) => (
    <Svg className={className}>
        <path d="M9 2l2 6h2l2-6h-2l-1 3-1-3z" />
        <circle cx="12" cy="15.5" r="5" />
    </Svg>
);

// ธง (Relay)
const FlagIcon = ({ className }) => (
    <Svg className={className}>
        <path d="M6 2v20h1.8V11H18l-2.7-3.5L18 4H7.8V2z" />
    </Svg>
);

// ว่ายน้ำ (Swimming) — หัวคน + คลื่นน้ำ
const SwimIcon = ({ className }) => (
    <Svg className={className}>
        <circle cx="7" cy="6.5" r="2.6" />
        <path d="M2 14q2-2 4 0t4 0 4 0 4 0v2q-2 2-4 0t-4 0-4 0-4 0z" />
    </Svg>
);

const TYPE_ICON = {
    "marathon": (c) => <RunIcon className={c} withSpeed />,
    "half marathon": (c) => <RunIcon className={c} />,
    "mini marathon": (c) => <WalkIcon className={c} />,
    "fun run": (c) => <WalkIcon className={c} />,
    "trail": (c) => <TreeIcon className={c} />,
    "cycling": (c) => <BikeIcon className={c} />,
    "duathlon": (c) => <BikeIcon className={c} />,
    "triathlon": (c) => <MedalIcon className={c} />,
    "ironman": (c) => <TrophyIcon className={c} />,
    "swimming": (c) => <SwimIcon className={c} />,
    "relay": (c) => <FlagIcon className={c} />,
};

const getTypeIcon = (type, className) => {
    const fn = TYPE_ICON[String(type || "").trim().toLowerCase()];
    return fn ? fn(className) : <RunIcon className={className} />;
};

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
                        <div className="flex items-center gap-2 mt-3">
                            {provinceLabel && (
                                <span className="inline-flex items-center gap-1 bg-[#e7e8ff] text-[#091842] text-[12px] md:text-[11px] font-bold px-3 py-1 rounded-lg">
                                    <PinIcon className="w-3.5 h-3.5 md:w-3 md:h-3 shrink-0" />
                                    {provinceLabel}
                                </span>
                            )}
                            {type && (
                                <span className="inline-flex items-center gap-1 bg-[#fbe5da] text-[#c63d00] text-[12px] md:text-[11px] font-bold px-3 py-1 rounded-lg ml-auto">
                                    {getTypeIcon(type, "w-3.5 h-3.5 md:w-3 md:h-3 shrink-0")}
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
