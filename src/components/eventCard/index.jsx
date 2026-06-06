import { Image, Popover, Skeleton, Tag, Typography } from "antd";
import { NOT_FOUND_IMG } from "assets";
import { SYS_DISPLAY_DATE_FORMAT } from "constants/helper";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { usePublicImageUrl } from "utils/fileUtils";

const { Paragraph } = Typography;

const EventCard = ({
    id,
    link,
    logoUrl = NOT_FOUND_IMG,
    province = "",
    name = "",
    eventDate = null,
    eventStatus = ""
}) => {
    const { t, i18n } = useTranslation();
    const { data: logoPreviewUrl, isFetching } = usePublicImageUrl({ key: logoUrl, prefix: "event", isPublic: true });
    const currentLanguage = i18n.language?.toLowerCase();

    return (
        <div key={`event-${id}`} className="sa-tutor m-auto max-w-[425px] w-full h-full">
            <Link to={`/eventDetail/${link || id}`}>
                <div className="tutor-thumb">
                    {isFetching ?
                        <Skeleton.Image
                            active
                            className="!max-w-full !h-auto !aspect-[16/9] !object-cover !w-full md:!h-60"
                        /> : <Image
                            src={logoPreviewUrl || NOT_FOUND_IMG}
                            alt="Image"
                            className={`!max-w-full !h-auto !aspect-[16/9] !object-cover md:!h-60`}
                            style={{ pointerEvents: 'none' }}
                            preview={false}
                            fallback={NOT_FOUND_IMG}
                        />}
                </div>
                <div className="tutor-info text-center min-h-20 md:min-h-28 h-auto flex flex-col gap-1 p-2">
                    <Popover content={name} trigger="hover">
                        <Typography className="!text-xs md:!text-base !font-bold">
                            <Paragraph ellipsis={{ rows: 2 }}>
                                {name}
                            </Paragraph>
                        </Typography>
                    </Popover>
                    {province && (
                        <div className="flex justify-center">
                            <Tag
                                bordered={false}
                                color="blue"
                            >
                                {currentLanguage === "th" ? province.stateLocal : province.stateEn}
                            </Tag>
                        </div>
                    )}

                    <div className={`flex justify-center items-center mb-0 flex-col text-xs md:flex-row md:text-base`}>
                        <div>
                            <i className="far fa-calendar mr-2"></i>
                            {dayjs(eventDate).format(SYS_DISPLAY_DATE_FORMAT)}
                        </div>
                        <div className={`font-semibold text-xs pl-1.5 md:pl-4 ${eventStatus === "soon" ? 'text-primary' : eventStatus === "openRegistration" ? 'text-success' : 'text-red-300'}`}>
                            {eventStatus === "soon" && t("general.soon")}
                            {eventStatus === "openRegistration" && t("general.openRegistration")}
                            {eventStatus === "closedRegistration" && t("general.closedRegistration")}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default EventCard;
