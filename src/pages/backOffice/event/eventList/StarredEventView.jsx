import {
    CalendarOutlined,
    CarOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    LinkOutlined,
    PlusOutlined,
    SkinOutlined,
    StarFilled,
    TagOutlined,
    TeamOutlined,
    GiftOutlined,
    FlagOutlined,
} from '@ant-design/icons';
import { Button, message, Progress, Spin, Switch, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

import backOfficeServices from 'services/backoffice.services';
import { usePublicImageUrl } from 'utils/fileUtils';
import { SYS_DATE_FORMAT } from 'constants/helper';

const BLUE = '#0071e3';

const baht = (value) => (value == null ? '-' : `฿${Number(value).toLocaleString('th-TH', { maximumFractionDigits: 2 })}`);
const num = (value) => Number(value ?? 0).toLocaleString('th-TH');
const pct = (part, total) => (total ? Math.min(100, Math.round((part / total) * 100)) : 0);
const fmtDateTime = (v) => (v ? dayjs(v).format(`${SYS_DATE_FORMAT} HH:mm`) : '-');

const REG_STATUS = {
    soon: { key: 'general.soon', className: 'bg-[rgba(255,159,10,0.12)] text-[#a65c00]', dot: 'bg-[#ff9f0a]' },
    openRegistration: { key: 'general.openRegistration', className: 'bg-[rgba(52,199,89,0.12)] text-[#1a7f37]', dot: 'bg-[#34c759]' },
    closedRegistration: { key: 'general.closedRegistration', className: 'bg-[rgba(0,0,0,0.06)] text-[#6e6e73]', dot: 'bg-[#a1a1a6]' },
};

// The price a runner pays today: the pricing phase on sale now, else the distance's base price.
const currentPrice = (eventType) => {
    const now = dayjs();
    const phase = (eventType?.pricing || []).find((p) =>
        (!p.startDate || !now.isBefore(dayjs(p.startDate))) && (!p.endDate || !now.isAfter(dayjs(p.endDate))));
    return phase ? { price: phase.price, phase: phase.paymentName } : { price: eventType?.price, phase: null };
};

// A div, not a span: index.css zeroes padding on every span.
const Chip = ({ className = '', children }) => (
    <div className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap ${className}`}>
        {children}
    </div>
);

const Panel = ({ icon, title, count, children, className = '' }) => (
    <div className={`min-w-0 flex flex-col px-5 py-3.5 ${className}`}>
        <div className="flex items-center gap-2 mb-2 shrink-0">
            <span className="text-[#0071e3]">{icon}</span>
            <span className="text-[13px] font-semibold text-[#1d1d1f]">{title}</span>
            {count != null && <span className="text-xs text-[#6e6e73] tabular-nums">({count})</span>}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
);

const InfoRow = ({ icon, label, children }) => (
    <div className="flex items-start gap-3 py-[7px] border-b border-[#f0f0f2] last:border-0">
        <span className="shrink-0 w-4 mt-0.5 text-[#6e6e73]">{icon}</span>
        <span className="shrink-0 w-[112px] text-[13px] text-[#6e6e73]">{label}</span>
        <span className="min-w-0 flex-1 text-[13px] font-medium text-[#1d1d1f] break-words">{children}</span>
    </div>
);

const Kpi = ({ label, value, sub, progress, color = BLUE, loading }) => (
    <div className="min-w-0 px-5 py-3">
        <div className="text-xs text-[#6e6e73] mb-0.5">{label}</div>
        <div className="text-[20px] leading-tight font-bold text-[#1d1d1f] tabular-nums truncate">{loading ? '…' : value}</div>
        {sub && <div className="text-xs text-[#6e6e73] mt-0.5 truncate">{sub}</div>}
        {progress != null && (
            <Progress percent={progress} showInfo={false} size="small" strokeColor={color} trailColor="#ececf0" className="!m-0 !mt-2" />
        )}
    </div>
);

const Empty = ({ children }) => <div className="text-[13px] text-[#a1a1a6] py-2">{children}</div>;

/**
 * /eventList with an event starred: the whole event on one screen — who runs it, when and where,
 * how registration is going, what is on sale — with every action as a visible button.
 */
export default function StarredEventView({ record, actions, editable, onToggleStatus, onCreate }) {
    const { t } = useTranslation();
    const eventId = record?.id;
    const { data: event, isFetching: eventLoading } = backOfficeServices.useQueryGetEventById({ id: eventId });
    const { data: od, isFetching: statsLoading } = backOfficeServices.useQueryGetDashboardOverview({ eventId });
    const { data: coverUrl } = usePublicImageUrl({ key: event?.pictureUrl || event?.logoUrl, prefix: 'event', isPublic: true });

    const published = !record.isDraft;
    const reg = REG_STATUS[record.eventStatus];
    const location = [event?.location || record.location, (event?.province || record.province)?.stateLocal].filter(Boolean).join(' · ');
    const pageUrl = `${globalThis.location.protocol}//${globalThis.location.host}/eventDetail/${record.link || record.id}`;

    const registered = od?.participantByEvent ?? 0;
    const capacity = od?.capacityByEvent ?? 0;
    const paid = od?.paidByEvent ?? 0;

    // Registration window: days left / until opening, and how much of it has passed.
    const now = dayjs();
    const start = record.startRegistrationDate && dayjs(record.startRegistrationDate);
    const end = record.endRegistrationDate && dayjs(record.endRegistrationDate);
    let windowText = '-';
    let windowProgress = 0;
    if (start && end) {
        if (now.isBefore(start)) {
            windowText = t('back.eventHub.opensIn', { days: Math.max(1, start.diff(now, 'day')) });
        } else if (now.isAfter(end)) {
            windowText = t('back.eventHub.ended');
            windowProgress = 100;
        } else {
            windowText = t('back.eventHub.daysLeft', { days: end.diff(now, 'day') });
            windowProgress = pct(now.diff(start), end.diff(start));
        }
    }

    const eventTypes = event?.eventTypes || [];
    const shirtTypes = event?.shirtTypes || [];
    const addOns = (event?.addOns || []).filter((a) => a.active !== false);
    const deleteAction = actions.find((a) => a.key === 'delete');
    const mainActions = actions.filter((a) => a.key !== 'delete');

    const copyLink = async () => {
        await navigator.clipboard.writeText(pageUrl);
        message.success(t('general.copySuccess'));
    };

    return (
        <div className="bo-card overflow-hidden">
            {/* Hero: cover, name, status and organizer */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 px-5 md:px-6 py-4 border-b border-[#e5e5ea]">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="shrink-0 w-[68px] h-[68px] rounded-2xl overflow-hidden bg-[rgba(0,113,227,0.08)] flex items-center justify-center text-[#0071e3] text-3xl">
                        {coverUrl ? <img src={coverUrl} alt="" className="w-full h-full object-cover" /> : <FlagOutlined />}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="shrink-0 text-[#f5b301] text-lg leading-none"><StarFilled /></span>
                            <h1 className="m-0 text-[22px] font-bold leading-tight text-[#1d1d1f] truncate" title={record.name}>{record.name}</h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {reg && (
                                <Chip className={reg.className}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${reg.dot}`} />
                                    {t(reg.key)}
                                </Chip>
                            )}
                            {record.type && <Chip className="bg-[rgba(88,86,214,0.1)] text-[#3d3bb0]">{record.type}</Chip>}
                            {event?.testMode && <Chip className="bg-[rgba(255,59,48,0.1)] text-[#c9251c]">{t('back.eventHub.testMode')}</Chip>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 text-[13px] text-[#424245] min-w-0">
                            <TeamOutlined className="text-[#6e6e73]" />
                            <span className="text-[#6e6e73]">{t('back.eventHub.organizer')}:</span>
                            <span className="font-semibold truncate">{event?.organizerName || record.organizerName || '-'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <Tooltip title={editable ? '' : t('back.event.home.noPermission')}>
                        <div className="inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-[#e5e5ea] bg-white">
                            <Switch checked={published} disabled={!editable} onChange={onToggleStatus} />
                            <span className={`text-[13px] font-medium ${published ? 'text-[#0071e3]' : 'text-[#6e6e73]'}`}>
                                {published ? t('back.event.home.statusActive') : t('back.event.home.statusDraft')}
                            </span>
                        </div>
                    </Tooltip>
                    {onCreate && (
                        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={onCreate}>
                            {t('back.event.home.createEvent')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Every row-menu action as a button */}
            <div className="flex flex-wrap items-center gap-2 px-5 md:px-6 py-2.5 border-b border-[#e5e5ea] bg-[#fbfbfd]">
                {mainActions.map((a) => (
                    <Button key={a.key} icon={a.icon} onClick={a.onClick} type={a.key === 'edit' ? 'primary' : 'default'} ghost={a.key === 'edit'}>
                        {a.label}
                    </Button>
                ))}
                {deleteAction && (
                    <Button danger icon={deleteAction.icon} onClick={deleteAction.onClick} className="sm:ml-auto">
                        {deleteAction.label}
                    </Button>
                )}
            </div>

            {/* Registration at a glance */}
            <div className="grid grid-cols-2 xl:grid-cols-4 divide-x divide-[#e5e5ea] border-b border-[#e5e5ea]">
                <Kpi
                    label={t('back.eventHub.registered')}
                    value={num(registered)}
                    sub={capacity ? t('back.eventHub.ofQuota', { quota: num(capacity), percent: pct(registered, capacity) }) : null}
                    progress={capacity ? pct(registered, capacity) : null}
                    loading={statsLoading && !od}
                />
                <Kpi
                    label={t('back.eventHub.paid')}
                    value={num(paid)}
                    sub={registered ? t('back.eventHub.ofRegistered', { percent: pct(paid, registered) }) : null}
                    progress={registered ? pct(paid, registered) : null}
                    color="#34c759"
                    loading={statsLoading && !od}
                />
                <Kpi
                    label={t('back.eventHub.revenue')}
                    value={od ? baht(od.totalNetRevenue) : '-'}
                    sub={od ? `${t('back.eventHub.registrationFee')} ${baht(od.totalRegistrationFee)} · ${t('back.eventHub.shippingFee')} ${baht(od.totalShippingFee)}` : null}
                    loading={statsLoading && !od}
                />
                <Kpi
                    label={t('back.eventHub.window')}
                    value={windowText}
                    sub={`${fmtDateTime(record.startRegistrationDate)} – ${fmtDateTime(record.endRegistrationDate)}`}
                    progress={start && end ? windowProgress : null}
                    color="#ff9f0a"
                />
            </div>

            <Spin spinning={eventLoading && !event}>
                <div className="grid grid-cols-1 lg:grid-cols-3 lg:divide-x divide-[#e5e5ea] lg:h-[360px]">
                    <Panel icon={<CalendarOutlined />} title={t('back.eventHub.eventInfo')}>
                        <InfoRow icon={<CalendarOutlined />} label={t('back.event.home.eventDate')}>
                            <span className="tabular-nums">{record.eventDate ? dayjs(record.eventDate).format(`${SYS_DATE_FORMAT} · HH:mm`) : '-'}</span>
                        </InfoRow>
                        <InfoRow icon={<EnvironmentOutlined />} label={t('back.event.home.location')}>{location || '-'}</InfoRow>
                        <InfoRow icon={<TeamOutlined />} label={t('back.eventHub.organizer')}>{event?.organizerName || record.organizerName || '-'}</InfoRow>
                        <InfoRow icon={<TagOutlined />} label={t('back.eventHub.type')}>{record.type || '-'}</InfoRow>
                        <InfoRow icon={<ClockCircleOutlined />} label={t('back.workspace.registrationPeriod')}>
                            <span className="tabular-nums">{fmtDateTime(record.startRegistrationDate)} – {fmtDateTime(record.endRegistrationDate)}</span>
                        </InfoRow>
                        <InfoRow icon={<CarOutlined />} label={t('back.eventHub.shippingFee')}>
                            {event?.shippingFee ? baht(event.shippingFee) : t('back.eventHub.noShipping')}
                        </InfoRow>
                        <InfoRow icon={<LinkOutlined />} label={t('back.eventHub.link')}>
                            <button type="button" onClick={copyLink} className="text-left text-[#0071e3] hover:underline cursor-pointer break-all">
                                /eventDetail/{record.link || record.id}
                            </button>
                        </InfoRow>
                    </Panel>

                    <Panel icon={<FlagOutlined />} title={t('back.eventHub.distances')} count={eventTypes.length} className="border-t lg:border-t-0 border-[#e5e5ea]">
                        {eventTypes.length ? eventTypes.map((et) => {
                            const { price, phase } = currentPrice(et);
                            const sold = od?.participantByEventType?.[et.name]?.participant ?? 0;
                            const quota = et.quota || od?.participantByEventType?.[et.name]?.capacityByEventType || 0;
                            return (
                                <div key={et.id} className="py-2 border-b border-[#f0f0f2] last:border-0">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <span className="min-w-0 truncate text-[13px] font-semibold text-[#1d1d1f]" title={et.name}>{et.name}</span>
                                        <span className="shrink-0 text-[13px] font-semibold text-[#1d1d1f] tabular-nums">
                                            {Number(price) ? baht(price) : t('back.eventHub.free')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 mt-1 text-xs text-[#6e6e73]">
                                        <span className="tabular-nums">
                                            {quota ? t('back.eventHub.soldOfQuota', { sold: num(sold), quota: num(quota) }) : t('back.eventHub.soldNoQuota', { sold: num(sold) })}
                                        </span>
                                        <span className="truncate">
                                            {[phase, et.eventDate && dayjs(et.eventDate).format('HH:mm')].filter(Boolean).join(' · ')}
                                        </span>
                                    </div>
                                    {quota > 0 && (
                                        <Progress percent={pct(sold, quota)} showInfo={false} size="small" strokeColor={BLUE} trailColor="#ececf0" className="!m-0 !mt-1.5" />
                                    )}
                                </div>
                            );
                        }) : <Empty>{t('back.eventHub.notSet')}</Empty>}
                    </Panel>

                    <Panel icon={<GiftOutlined />} title={t('back.eventHub.shirtsAddOns')} className="border-t lg:border-t-0 border-[#e5e5ea]">
                        <div className="text-xs font-semibold text-[#6e6e73] mb-1.5 flex items-center gap-1.5">
                            <SkinOutlined /> {t('back.eventHub.shirts')} ({shirtTypes.length})
                        </div>
                        {shirtTypes.length ? shirtTypes.map((s) => (
                            <div key={s.id} className="flex items-start justify-between gap-3 py-1.5">
                                <span className="min-w-0 truncate text-[13px] font-medium text-[#1d1d1f]" title={s.name}>{s.name}</span>
                                <div className="shrink-0 flex flex-wrap justify-end gap-1 max-w-[60%]">
                                    {(s.shirtSizes || []).map((z) => (
                                        <div key={z.id} className="px-1.5 h-5 inline-flex items-center rounded bg-[#f2f2f5] text-[11px] font-medium text-[#424245]">{z.name}</div>
                                    ))}
                                </div>
                            </div>
                        )) : <Empty>{t('back.eventHub.notSet')}</Empty>}

                        <div className="text-xs font-semibold text-[#6e6e73] mt-3 mb-1.5 flex items-center gap-1.5">
                            <GiftOutlined /> {t('back.eventHub.addOns')} ({addOns.length})
                        </div>
                        {addOns.length ? addOns.map((a) => (
                            <div key={a.id} className="py-1.5">
                                <div className="flex items-baseline justify-between gap-3">
                                    <span className="min-w-0 truncate text-[13px] font-medium text-[#1d1d1f]" title={a.name}>{a.name}</span>
                                    <span className="shrink-0 text-[13px] font-semibold tabular-nums">{baht(a.price)}</span>
                                </div>
                                <div className="text-xs text-[#6e6e73] tabular-nums">
                                    {a.perApplicant ? t('back.eventHub.perApplicant') : t('back.eventHub.perOrder')}
                                    {' · '}
                                    {a.quota
                                        ? t('back.eventHub.soldOfQuota', { sold: num(a.usedQuota), quota: num(a.quota) })
                                        : t('back.eventHub.soldNoQuota', { sold: num(a.usedQuota) })}
                                </div>
                            </div>
                        )) : <Empty>{t('back.eventHub.notSet')}</Empty>}

                        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#f0f0f2]">
                            {[
                                ['pricingPhases', event?.paymentTypes?.length],
                                ['questions', event?.selectionFields?.length],
                                ['conditions', event?.eventConditions?.length],
                                ['details', event?.eventDetails?.length],
                            ].map(([key, count]) => (
                                <Chip key={key} className="bg-[#f2f2f5] text-[#424245] !font-medium">
                                    {t(`back.eventHub.${key}`)} <span className="tabular-nums font-semibold">{count ?? 0}</span>
                                </Chip>
                            ))}
                        </div>
                    </Panel>
                </div>
            </Spin>
        </div>
    );
}
