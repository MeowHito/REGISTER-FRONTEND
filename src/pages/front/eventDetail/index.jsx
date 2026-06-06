import { CalendarOutlined, LeftOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Spin } from 'antd';
import { NOT_FOUND_IMG } from 'assets';
import DisplayIfAvailable from 'components/displayIfAvailable';
import FrontLayout from 'components/frontLayout';
import React, { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { useNavigate, useParams } from 'react-router-dom';
import generalService from 'services/general.services';
import { getPublicUrl, convertStorageToHtml } from 'utils/fileUtils';
import { RiMapPin2Line } from "react-icons/ri";
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { SYS_DATE_FORMAT } from 'constants/helper';
import ApplicationButton from './button';
import { handleQueryStatus } from 'utils';
import { useDispatch } from 'react-redux';
import { CLEAR_ORDER } from 'store/reducers/contextSlice';
import CountdownBox from 'components/countdownBox';
import useMe from 'hooks/useMe';

function EventDetail({ eventId, setView }) {
    const dispatch = useDispatch()
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { name } = useParams();
    const [bannerUrl, setBannerUrl] = useState(null);
    const [paymentTypeMap, setPaymentTypeMap] = useState({});
    const [detail, setDetail] = useState([]);
    const [details, setDetails] = useState([]);
    const { data, isFetching, ...other } = generalService.useQueryGetEventDetailByURL({ url: eventId || name });
    const stickyRef = useRef(null);
    const [isStuck, setIsStuck] = useState(false);
    const [countdownTime, setCountdownTime] = useState(null);
    const [isAfterEnd, setIsAfterEnd] = useState(null);
    const currentLanguage = i18n.language?.toLowerCase();

    const { data: me } = useMe({ retry: 0 });
    const roleType = me?.role?.roleType;
    const isGuestOrAnonymous = !roleType || roleType === 'guest';

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsStuck(!entry.isIntersecting),
            { threshold: [1] }
        );
        if (!isFetching && stickyRef.current) observer.observe(stickyRef.current);
        return () => observer.disconnect();
    }, [isFetching]);

    useEffect(() => {
        handleQueryStatus(other, () => {
            init(data);
        })
    }, [other.fetchStatus]);

    useEffect(() => {
        if (!data?.startRegistrationDate) return;

        const start = dayjs(data?.startRegistrationDate);
        const now = dayjs();
        const end = dayjs(data?.endRegistrationDate);
        const isBeforeStart = now.isBefore(start);
        setIsAfterEnd(now.isAfter(end))

        if (!isBeforeStart) {
            setCountdownTime(null);
            return;
        }

        const updateCountdown = () => {
            const now = dayjs();
            const diffMs = start.diff(now);
            if (diffMs <= 0) {
                setCountdownTime(null);
                return;
            }

            const duration = dayjs.duration(diffMs);
            setCountdownTime({
                days: duration.days(),
                hours: duration.hours(),
                minutes: duration.minutes(),
                seconds: duration.seconds(),
            });
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);

        return () => clearInterval(timer);
    }, [data?.startRegistrationDate]);

    useEffect(() => {
        const root = document.documentElement;

        const {
            eventPrimaryColor = 'oklch(38.8% 0.243 264.376)',
            eventSecondaryColor = 'oklch(48.8% 0.243 264.376)',
            eventFontColor = '#fff',
        } = data || {};

        root.style.setProperty('--event-primary-color', eventPrimaryColor);
        root.style.setProperty('--event-secondary-color', eventSecondaryColor);
        root.style.setProperty('--event-font-color', eventFontColor);
    }, [data]);


    const init = async (data) => {
        const url = await getPublicUrl({ key: data?.pictureUrl, prefix: "event", isPublic: true });
        setBannerUrl(url);

        const convertedEventDetails = await Promise.all(
            (data.eventDetails || [])
                .sort((a, b) => a.position - b.position)
                .map(async (d) => ({
                    ...d,
                    detail: await convertStorageToHtml(d.detail, "event", getPublicUrl),
                }))
        );
        setDetail(await convertStorageToHtml(data?.description, "event", getPublicUrl));
        setDetails(convertedEventDetails);

        const paymentTypeMap = {};
        data?.paymentTypes?.forEach(pt => {
            paymentTypeMap[pt.id] = pt.name;
        });
        setPaymentTypeMap(paymentTypeMap);
    };

    const SelectLayout = !eventId ? FrontLayout : React.Fragment;

    const eventKey = data?.link || name || data?.id;
    const shouldShowChecklist = Boolean(data?.showChecklist);

    return (
        <>
            {
                setView && <div className="mb-4">
                    <Button
                        type="link"
                        className="center"
                        onClick={() => {
                            setView(null);
                        }}
                    >
                        <LeftOutlined size={22} className="me-2" />
                        <p>{t("general.back")}</p>
                    </Button>
                </div>
            }
            <Spin spinning={isFetching}>
                <SelectLayout {...(eventId ? {} : { title: t("front.eventDetail.title") })}>
                    {
                        !isFetching && <div className="flex flex-col lg:flex-row max-w-screen-lg mx-auto">
                            <div className="w-full md:px-4 pb-5">
                                <div className="w-full mb-4">
                                    <img
                                        className="w-full h-auto rounded object-contain"
                                        src={bannerUrl || NOT_FOUND_IMG}
                                        alt={data?.name || ""}
                                        onError={(e) => { e.target.src = NOT_FOUND_IMG; }}
                                    />
                                </div>
                                {shouldShowChecklist &&  !countdownTime && <Button icon={<SearchOutlined />} color='blue' variant="outlined" iconPosition={"start"} className={`!h-[44px] w-[157px] !rounded-full md:!hidden z-20`} onClick={() => navigate(`/participantSearch/${eventKey}`)}>
                                    {t("front.eventDetail.checklist")}
                                </Button>}
                                {isGuestOrAnonymous ? (
                                    countdownTime ? (
                                        <div className='-mt-2 w-full flex flex-col items-end'>
                                            <span className='mb-2'>{t("front.eventDetail.registrationStartsIn")}</span>
                                            <div className='flex gap-2'>
                                                <CountdownBox value={countdownTime.days} label={t('time.day')} />
                                                <CountdownBox value={countdownTime.hours} label={t('time.hour')} />
                                                <CountdownBox value={countdownTime.minutes} label={t('time.minute')} />
                                                <CountdownBox value={countdownTime.seconds} label={t('time.second')} />
                                            </div>
                                        </div>
                                    ) :
                                        isAfterEnd ? <div className='-mt-11 md:!mt-0 w-full flex justify-end'>
                                            <ApplicationButton type="closed" /></div> :
                                            <>
                                                <div ref={stickyRef} className="absolute" />
                                                <div className={`-mt-11 md:!mt-0 sticky w-full top-4 z-10 text-right ${isStuck ? 'animate-shake' : ''}`}>
                                                    <div className='flex justify-end cursor-pointer'>
                                                        <ApplicationButton
                                                            type="opened"
                                                            onClick={() => {
                                                                if (!me) {
                                                                    navigate('/login', { state: { from: `/registrationInfo/${eventKey}` } })
                                                                    return
                                                                }
                                                                dispatch(CLEAR_ORDER())
                                                                navigate(`/registrationInfo/${eventKey}`)
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                ) : <div className='h-[44px] -mt-11 md:!mt-0' />
                                }

                                <div className={`text-3xl font-semibold ${countdownTime ? 'mt-2 md:-mt-16' : 'md:-mt-8'}`}>{data?.name}</div>

                                <div className="flex justify-between">
                                    <div className='flex gap-2'>
                                        <DisplayIfAvailable label={t("front.eventDetail.category")} data={data?.category} />
                                        <DisplayIfAvailable label={t("front.eventDetail.organizer")} data={data?.organizerName} />
                                    </div>
                                    {shouldShowChecklist &&  !countdownTime && <Button icon={<SearchOutlined />} color='blue' variant="outlined" iconPosition={"start"} className='!h-[44px] w-[157px] !rounded-full !hidden md:!block' onClick={() => navigate(`/participantSearch/${eventKey}`)}>
                                        {t("front.eventDetail.checklist")}
                                    </Button>
                                    }
                                </div>

                                <div className='flex gap-2'>
                                    <div><CalendarOutlined /> <span>{dayjs(data?.eventDate).format(SYS_DATE_FORMAT)}</span></div>
                                    <div><RiMapPin2Line className='inline mt-[-2px]' /> <span>{data?.location} {currentLanguage === "th" ? data?.province?.stateLocal : data?.province?.stateEn}</span></div>
                                </div>

                                <Title label={data?.generalInfoTitle || t("front.eventDetail.general")} />
                                <div
                                    className="prose max-w-none tiptap-render md:px-4"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(detail) }}
                                />

                                <Title label={data?.eventTypeTitle || t("front.eventDetail.eventType")} />
                                <div className="space-y-4 md:px-4">
                                    {data?.eventTypes?.map((et) => {
                                        const sortedPrices = [...(et.pricing || [])].sort((a, b) =>
                                            dayjs(a.endDate).isAfter(dayjs(b.endDate)) ? 1 : -1
                                        );

                                        const now = dayjs();
                                        const end = dayjs(data.endRegistrationDate).endOf("day");
                                        const isExpired = end.isBefore(now);
                                        const isEventTypeFull = et.isQuotaFull;
                                        const isNormalDisabled = isExpired || isEventTypeFull;

                                        const leftClass = isNormalDisabled
                                            ? "bg-gray-100 text-gray-400 line-through"
                                            : "bg-[var(--event-secondary-color)] text-[var(--event-font-color)]";

                                        const rightClass = isNormalDisabled
                                            ? "text-gray-400 line-through"
                                            : "text-[var(--event-primary-color)]";
                                        return (
                                            <div key={et.id}>
                                                <div className="font-semibold text-2xl mb-2">{et.name}</div>

                                                {sortedPrices.map((price) => {
                                                    const now = dayjs();
                                                    const end = dayjs(price.endDate);
                                                    const isExpired = end.isBefore(now);
                                                    const isPricingFull = price.isQuotaFull;
                                                    const isDisabled = isExpired || isPricingFull;

                                                    const leftClass = isDisabled
                                                        ? "bg-gray-100 text-gray-400 line-through"
                                                        : "bg-[var(--event-primary-color)] text-[var(--event-font-color)]";

                                                    const rightClass = isDisabled
                                                        ? "text-gray-400 line-through"
                                                        : "text-[var(--event-primary-color)]";
                                                    return (
                                                        <div
                                                            key={price.id}
                                                            className={`flex flex-col md:flex-row md:items-center border-t-2 border-r-2 border-l-2 border-b-0 last:border-b-2 border-solid border-[var(--event-secondary-color)]`}
                                                        >
                                                            <div className={`font-semibold px-4 py-2 md:w-2/3 ${leftClass}`}>
                                                                <div>
                                                                    {paymentTypeMap[price.paymentTypeId]}
                                                                    {isPricingFull && !isExpired && <span className="ml-2 text-xs">({t("front.eventDetail.quotaFull")})</span>}
                                                                </div>
                                                                <div>
                                                                    {data.startRegistrationDate && price.endDate ? (
                                                                        <>
                                                                            {dayjs(price.startDate).format("D MMMM BBBB")} -{" "}
                                                                            {dayjs(price.endDate).format("D MMMM BBBB")}
                                                                        </>
                                                                    )
                                                                        : "-"}
                                                                </div>
                                                            </div>
                                                            <div className={`md:w-1/3 text-center text-xl px-4 py-2 ${rightClass}`}>
                                                                ฿{price.price.toLocaleString()}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div className="flex flex-col md:flex-row md:items-center border-t-2 border-r-2 border-l-2 border-b-0 last:border-b-2  border-solid border-[var(--event-secondary-color)]">
                                                    <div className={`font-semibold bg-[var(--event-secondary-color)] px-4 py-2 md:w-2/3 ${leftClass}`}>
                                                        <div>
                                                            {t("front.eventDetail.normalPrice")}
                                                            {isEventTypeFull && !isExpired && <span className="ml-2 text-xs">({t("front.eventDetail.quotaFull")})</span>}
                                                        </div>
                                                        <div>
                                                            {data.startRegistrationDate && data.endRegistrationDate ? (
                                                                <>
                                                                    {sortedPrices.length ? dayjs(sortedPrices[sortedPrices.length - 1].endDate).add(1, 'day').format("D MMMM BBBB") : dayjs(data.startRegistrationDate).format("D MMMM BBBB")} -{" "}
                                                                    {dayjs(data.endRegistrationDate).format("D MMMM BBBB")}
                                                                </>
                                                            )
                                                                : "-"}
                                                        </div>
                                                    </div>
                                                    <div className={`md:w-1/3 text-center text-xl px-4 py-2 ${rightClass}`}>
                                                        ฿{et?.price?.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {details?.map((ed) => (
                                    <React.Fragment key={ed.id}>
                                        <Title label={ed.title} />
                                        {ed.type === "shirt" ? (
                                            <div>
                                                {data?.shirtTypes?.length > 0 ? (
                                                    <div
                                                        className={`grid gap-6 md:px-4
                                                        ${data.shirtTypes.length === 1 ? "grid-cols-1"
                                                                : data.shirtTypes.length === 2 ? "grid-cols-2"
                                                                    : data.shirtTypes.length === 3 ? "grid-cols-3"
                                                                        : "grid-cols-1"}`}
                                                    >
                                                        {data.shirtTypes.map((shirtType) => (
                                                            <div key={shirtType.id} className="w-full">
                                                                <div className="text-center text-lg font-bold text-[var(--event-primary-color)] mb-2">
                                                                    {shirtType.name}
                                                                    {shirtType.description && (
                                                                        <span className="text-sm font-normal text-[var(--event-primary-color)]"> ({shirtType.description})</span>
                                                                    )}
                                                                </div>

                                                                <table className="w-full table-fixed border border-[var(--event-primary-color)]">
                                                                    <thead className="bg-[var(--event-secondary-color)] text-[var(--event-font-color)]">
                                                                        <tr>
                                                                            <th className="text-center border border-[var(--event-primary-color)] p-2">{t("front.eventDetail.size")}</th>
                                                                            <th className="text-center border border-[var(--event-primary-color)] p-2">{t("front.eventDetail.chest")} ({t("front.eventDetail.inch")})</th>
                                                                            <th className="text-center border border-[var(--event-primary-color)] p-2">{t("front.eventDetail.length")} ({t("front.eventDetail.inch")})</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {shirtType.shirtSizes?.map((size, idx) => (
                                                                            <tr key={size.id} className={idx % 2 === 1 ? "bg-gray-50" : "bg-white"}>
                                                                                <td className="border border-[var(--event-primary-color)] p-2 text-center text-[var(--event-primary-color)]">{size.name}</td>
                                                                                <td className="border border-[var(--event-primary-color)] p-2 text-center text-[var(--event-primary-color)]">{size.chestSize}</td>
                                                                                <td className="border border-[var(--event-primary-color)] p-2 text-center text-[var(--event-primary-color)]">{size.lengthSize}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-500 italic mt-2">
                                                        {t("front.eventDetail.noShirtInfo")}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                            : ed.type === "reward" ?
                                                data?.eventTypes?.filter(et => et.ageGroups.length !== 0).map((et) => {
                                                    const maleAgeGroups = et.ageGroups?.filter((ag) => ag.gender === "male")?.sort((a, b) => a.position - b.position) || [];
                                                    const femaleAgeGroups = et.ageGroups?.filter((ag) => ag.gender === "female")?.sort((a, b) => a.position - b.position) || [];

                                                    return (
                                                        <div key={et.id} className="bg-white mb-6 md:px-4">
                                                            <div className="text-lg font-bold text-[var(--event-primary-color)] mb-4">{et.name}</div>
                                                            <div className={`grid gap-6 ${maleAgeGroups.length && femaleAgeGroups.length ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                                                                {maleAgeGroups.length > 0 && (
                                                                    <div>
                                                                        <div className="text-md font-semibold text-[var(--event-font-color)] mb-3">👦 {t("front.eventDetail.male")}</div>
                                                                        <div className="space-y-2">
                                                                            {maleAgeGroups.map((ag) => {
                                                                                let displayText = "";

                                                                                if (ag.minAge == null && ag.maxAge != null) {
                                                                                    displayText = `${t("front.eventDetail.age")}${t("front.eventDetail.notOver")} ${ag.maxAge} ${t("front.eventDetail.year")}`;
                                                                                } else if (ag.minAge != null && ag.maxAge == null) {
                                                                                    displayText = `${t("front.eventDetail.age")} ${ag.minAge} ${t("front.eventDetail.orMore")}`;
                                                                                } else {
                                                                                    displayText = `${t("front.eventDetail.age")} ${ag.minAge} - ${ag.maxAge} ${t("front.eventDetail.year")}`;
                                                                                }

                                                                                return (
                                                                                    <div
                                                                                        key={ag.id}
                                                                                        className="border border-[var(--event-primary-color)] bg-[var(--event-secondary-color)] px-3 py-2 rounded text-sm text-[var(--event-font-color)]"
                                                                                    >
                                                                                        {displayText}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {femaleAgeGroups.length > 0 && (
                                                                    <div>
                                                                        <div className="text-md font-semibold text-[var(--event-font-color)] mb-3">👧 {t("front.eventDetail.female")}</div>
                                                                        <div className="space-y-2">
                                                                            {femaleAgeGroups.map((ag) => {
                                                                                let displayText = "";

                                                                                if (ag.minAge == null && ag.maxAge != null) {
                                                                                    displayText = `${t("front.eventDetail.age")}${t("front.eventDetail.notOver")} ${ag.maxAge} ${t("front.eventDetail.year")}`;
                                                                                } else if (ag.minAge != null && ag.maxAge == null) {
                                                                                    displayText = `${t("front.eventDetail.age")} ${ag.minAge} ${t("front.eventDetail.orMore")}`;
                                                                                } else {
                                                                                    displayText = `${t("front.eventDetail.age")} ${ag.minAge} - ${ag.maxAge} ${t("front.eventDetail.year")}`;
                                                                                }

                                                                                return (
                                                                                    <div
                                                                                        key={ag.id}
                                                                                        className="border border-[var(--event-primary-color)] bg-[var(--event-secondary-color)] px-3 py-2 rounded text-sm text-[var(--event-font-color)]"
                                                                                    >
                                                                                        {displayText}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {maleAgeGroups.length === 0 && femaleAgeGroups.length === 0 && (
                                                                    <div className="text-sm text-gray-500 italic">{t("front.eventDetail.noAgeGroupInfo")}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                                : null}

                                        <div
                                            className="prose max-w-none tiptap-render md:px-4"
                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ed.detail) }}
                                        />
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    }
                </SelectLayout>
            </Spin>
        </>
    );
}

const Title = ({ label }) => (
    <div className='text-center font-semibold p-3 text-slate-800 text-xl bg-gray-100 rounded-md my-4'>
        {label}
    </div>
);

export default EventDetail;
