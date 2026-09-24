import {
    CalendarOutlined,
    CopyOutlined,
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    EnvironmentOutlined,
    EyeOutlined,
    MoreOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    SettingOutlined,
    ShareAltOutlined,
    StopOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {
    Button,
    Dropdown,
    Input,
    message,
    Select,
    Switch,
    Table,
    Tooltip,
} from 'antd';
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs';

import backOfficeServices from 'services/backoffice.services';
import EventForm from '../eventForm';
import ParticipantList from '../participantList';
import { SYS_DATE_FORMAT } from 'constants/helper';
import { AlertConfirm, AlertError, AlertSuccess } from 'components/alert';
import { errorToMessage } from 'hooks/functions/errorToMessage';
import EventDetail from 'pages/front/eventDetail';
import { getMenuPermission, handleQueryStatus, mergePermissions } from 'utils';
import EventPermission from '../eventPermission';
import useMe from 'hooks/useMe';
import PageHeader from 'components/pageHeader';
import StatCard from 'components/statCard';

const VIEWS = {
    LIST: 'list',
    CREATE: 'create',
    EDIT: 'edit',
    PARTICIPANT: 'participant',
    PREVIEW: 'preview',
    PERMISSION: 'permission',
};

const STATUS = { ALL: 'all', ACTIVE: 'active', DRAFT: 'draft' };

const percent = (part, total) => (total ? Math.round((part / total) * 100) : 0);

function DateTimeCell({ value }) {
    if (!value) return '-';
    const d = dayjs(value);
    return (
        <div className="leading-tight">
            <div className="text-[#1d1d1f] tabular-nums">{d.format(SYS_DATE_FORMAT)}</div>
            <div className="text-xs text-[#6e6e73] tabular-nums mt-0.5">{d.format('HH:mm')}</div>
        </div>
    );
}

const EventList = () => {
    const { t } = useTranslation();
    const [eventId, setEventId] = useState(null);
    const [eventName, setEventName] = useState(null);
    const [view, setView] = useState(VIEWS.LIST);
    const [eventData, setEventData] = useState([]);
    const [order, setOrder] = useState('asc');
    const [searchInput, setSearchInput] = useState('');
    const [searchText, setSearchText] = useState('');
    const [status, setStatus] = useState(STATUS.ALL);
    const [limitPage, setLimitPage] = useState(5);
    const [page, setPage] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [sortedField, setSortedField] = useState(undefined);
    const [exporting, setExporting] = useState(false);

    const { mutateAsync: updateStatus } = backOfficeServices.useMutationUpdateEventStatus();
    const { mutateAsync: deleteEvent } = backOfficeServices.useMutationDeleteEvent();
    const { mutateAsync: duplicateEvent } = backOfficeServices.useMutationDuplicateEvent();
    const { mutateAsync: fetchAllEvents } = backOfficeServices.useMutationFetchAllEvents();

    const { data: me } = useMe({ retry: 0 });
    const roleUser = me?.role?.roleType;
    const [eventCanUpdate, setEventCanUpdate] = useState(true);

    const menuPerm = getMenuPermission('eventList', me);

    const canUpdateRecord = (record) =>
        roleUser === 'admin' || (menuPerm.canUpdate && (record?.permission?.canUpdate ?? true));

    // Debounce the search box so typing doesn't fire a request per keystroke.
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchText(searchInput.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Shared by the table, the stat cards and the Excel export.
    const search = useMemo(() => ({
        search: [
            searchText ? { searchField: 'name', searchText } : null,
            status !== STATUS.ALL
                ? { searchField: 'isDraft', searchText: String(status === STATUS.DRAFT), searchType: 'BOOLEAN' }
                : null,
        ].filter(Boolean),
    }), [searchText, status]);

    const paging = useMemo(() => ({
        size: limitPage,
        page: page - 1,
        sortField: sortedField,
        sortDirection: order,
        ...search,
    }), [limitPage, page, sortedField, order, search]);

    const queryKey = useMemo(() => ["getAllActiveEvents", paging], [paging]);

    const { data, isFetching, refetch: refetchEvent, ...other } = backOfficeServices.useQueryGetAllActiveEvents({ paging, queryKey });
    const { data: summary, isFetching: summaryLoading, refetch: refetchSummary } = backOfficeServices.useQueryGetEventSummary({ search });

    useEffect(() => {
        handleQueryStatus(other, () => {
            setEventData(data.content);
            setTotalData(data.totalElements);
        })
    }, [other.fetchStatus])

    const refetchAll = () => {
        refetchEvent();
        refetchSummary();
    };

    const handleRefetch = () => {
        refetchAll();
        setEventId(null);
        setEventName(null);
        setView(null);
    };

    const handleChange = (_pagination, _filters, sorter) => {
        setOrder(sorter.order === 'descend' ? 'desc' : 'asc');
        setSortedField(sorter.order ? sorter.field : undefined);
    };

    const handleUpdateStatus = (item) => {
        AlertConfirm({
            text: t("general.alertConfirm"),
            onOk: async () => {
                try {
                    await updateStatus({ id: item.id, isDraft: !item.isDraft });
                    refetchAll();
                    AlertSuccess({ title: t("general.alertSuccess"), text: "" })
                } catch (err) {
                    AlertError({ text: errorToMessage(err) })
                }
            },
        });
    };

    const handleDelete = async (payload) => {
        AlertConfirm({
            text: t("general.deleteConfirm"),
            onOk: async () => {
                try {
                    await deleteEvent(payload)
                    refetchAll();
                    AlertSuccess({ title: t("general.deleteSuccess"), text: "" })
                } catch (err) {
                    AlertError({ text: errorToMessage(err) })
                }
            },
        });
    }

    const handleDuplicate = (record) => {
        AlertConfirm({
            title: t("back.event.home.duplicateConfirmTitle"),
            text: t("back.event.home.duplicateConfirm", { name: record?.name }),
            onOk: async () => {
                try {
                    await duplicateEvent({ id: record.id });
                    setPage(1);
                    refetchAll();
                    AlertSuccess({ title: t("back.event.home.duplicateSuccess"), text: t("back.event.home.duplicateSuccessDesc") });
                } catch (err) {
                    AlertError({ text: errorToMessage(err) });
                }
            },
        });
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const events = await fetchAllEvents({ search });
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet(t("back.event.home.allEvent"));
            sheet.columns = [
                { header: '#', key: 'no', width: 6 },
                { header: t('back.event.home.eventName'), key: 'name', width: 40 },
                { header: t('back.event.home.eventDate'), key: 'eventDate', width: 14 },
                { header: t('back.event.home.location'), key: 'location', width: 30 },
                { header: t('back.event.home.province'), key: 'province', width: 20 },
                { header: t('back.event.home.startRegistrationDate'), key: 'start', width: 20 },
                { header: t('back.event.home.endRegistrationDate'), key: 'end', width: 20 },
                { header: t('back.event.home.statusTitle'), key: 'status', width: 14 },
            ];
            sheet.getRow(1).font = { bold: true };
            events.forEach((e, i) => sheet.addRow({
                no: i + 1,
                name: e.name,
                eventDate: e.eventDate ? dayjs(e.eventDate).format(SYS_DATE_FORMAT) : '',
                location: e.location || '',
                province: e.province?.stateLocal || '',
                start: e.startRegistrationDate ? dayjs(e.startRegistrationDate).format('DD/MM/YYYY HH:mm') : '',
                end: e.endRegistrationDate ? dayjs(e.endRegistrationDate).format('DD/MM/YYYY HH:mm') : '',
                status: e.isDraft ? t('back.event.home.statusDraft') : t('back.event.home.statusActive'),
            }));

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = globalThis.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Events_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            AlertError({ text: errorToMessage(err) });
        } finally {
            setExporting(false);
        }
    };

    const eventDataWithPerm = useMemo(() =>
        eventData.map((e) => ({
            ...e,
            permission: {
                ...e.permission,
                canDelete: roleUser === 'admin' ? true : e.permission?.canDelete,
            }
        })),
        [eventData, roleUser]
    );

    const buildActions = (record) => {
        const perm = mergePermissions(menuPerm, record, true);
        const canManagePermission = record?.permission?.role === 'owner' || roleUser === 'admin' || record?.permission?.role === 'admin';
        const canDuplicate = (roleUser === 'admin' || roleUser === 'organizer') && menuPerm.canCreate && canUpdateRecord(record);

        const items = [
            perm.canRead && {
                key: 'view', icon: <EyeOutlined />, label: t('general.buttonView'),
                onClick: () => { setEventId(record?.id); setView(VIEWS.PREVIEW); },
            },
            perm.canUpdate && {
                key: 'edit', icon: <EditOutlined />, label: t('general.buttonEdit'),
                onClick: () => { setEventId(record?.id); setView(VIEWS.EDIT); },
            },
            canDuplicate && {
                key: 'duplicate', icon: <CopyOutlined />, label: t('back.event.home.duplicate'),
                onClick: () => handleDuplicate(record),
            },
            { type: 'divider' },
            {
                key: 'participants', icon: <UserOutlined />, label: t('back.event.home.manageParticipants'),
                onClick: () => {
                    setEventId(record?.id);
                    setEventName(record?.name);
                    setEventCanUpdate(canUpdateRecord(record));
                    setView(VIEWS.PARTICIPANT);
                },
            },
            {
                key: 'share', icon: <ShareAltOutlined />, label: t('general.buttonShareLink'),
                onClick: async () => {
                    const urlSlug = `${globalThis.location.protocol}//${globalThis.location.host}/eventDetail/${record?.link || record?.id}`;
                    await navigator.clipboard.writeText(urlSlug);
                    message.success(t("general.copySuccess"));
                },
            },
            canManagePermission && {
                key: 'permission', icon: <SettingOutlined />, label: t('back.event.home.managePermission'),
                onClick: () => { setEventId(record?.id); setEventName(record?.name); setView(VIEWS.PERMISSION); },
            },
            perm.canDelete && { type: 'divider' },
            perm.canDelete && {
                key: 'delete', icon: <DeleteOutlined />, danger: true, label: t('general.buttonDelete'),
                onClick: () => handleDelete(record),
            },
        ].filter(Boolean);

        // Drop a divider that would end up first/last or doubled after filtering.
        return items.filter((item, i, arr) =>
            item.type !== 'divider' || (i > 0 && i < arr.length - 1 && arr[i - 1].type !== 'divider'));
    };

    const columns = [
        {
            title: '#',
            key: 'index',
            width: 56,
            render: (_text, _record, index) => (
                <span className="text-[#6e6e73] tabular-nums">{totalData - ((page - 1) * limitPage) - index}</span>
            ),
        },
        {
            title: t('back.event.home.eventName'),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            render: (value, record) => (
                <button
                    type="button"
                    className="text-left font-semibold text-[#1d1d1f] hover:text-[#0071e3] cursor-pointer max-w-[320px] truncate block"
                    title={value}
                    onClick={() => { setEventId(record?.id); setView(VIEWS.PREVIEW); }}
                >
                    {value}
                </button>
            ),
        },
        {
            title: t('back.event.home.eventDate'),
            dataIndex: 'eventDate',
            key: 'eventDate',
            render: (value) => <span className="tabular-nums">{value ? dayjs(value).format(SYS_DATE_FORMAT) : '-'}</span>,
        },
        {
            title: t('back.event.home.location'),
            dataIndex: 'province',
            key: 'province',
            render: (value, record) => {
                const text = value?.stateLocal || record?.location;
                return text ? (
                    <span className="inline-flex items-center gap-1.5 text-[#424245]">
                        <EnvironmentOutlined className="text-[#6e6e73]" />
                        <span className="truncate max-w-[180px]" title={record?.location || text}>{text}</span>
                    </span>
                ) : '-';
            },
        },
        {
            title: t('back.event.home.startRegistrationDate'),
            dataIndex: 'startRegistrationDate',
            key: 'startRegistrationDate',
            render: (value) => <DateTimeCell value={value} />,
        },
        {
            title: t('back.event.home.endRegistrationDate'),
            dataIndex: 'endRegistrationDate',
            key: 'endRegistrationDate',
            render: (value) => <DateTimeCell value={value} />,
        },
        {
            title: t('back.event.home.statusTitle'),
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (_, record) => {
                const active = !record.isDraft;
                const editable = canUpdateRecord(record);
                return (
                    <Tooltip title={editable ? '' : t('back.event.home.noPermission')}>
                        <span className="inline-flex items-center gap-2">
                            <Switch
                                checked={active}
                                disabled={!editable}
                                onChange={() => handleUpdateStatus(record)}
                            />
                            <span className={`text-[13px] font-medium ${active ? 'text-[#0071e3]' : 'text-[#6e6e73]'}`}>
                                {active ? t('back.event.home.statusActive') : t('back.event.home.statusDraft')}
                            </span>
                        </span>
                    </Tooltip>
                );
            },
        },
        {
            key: 'manage',
            width: 64,
            align: 'center',
            fixed: 'right',
            render: (_, record) => {
                const items = buildActions(record);
                if (!items.length) return null;
                return (
                    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
                        <Button type="text" shape="circle" icon={<MoreOutlined className="text-lg" />} aria-label={t('general.manage')} />
                    </Dropdown>
                );
            },
        },
    ];

    if (view === VIEWS.CREATE || view === VIEWS.EDIT) {
        return (
            <EventForm
                isEditable
                eventId={eventId}
                mode={view}
                setMode={setView}
                refetch={handleRefetch}
            />
        );
    }
    if (view === VIEWS.PREVIEW) {
        return <EventDetail eventId={eventId} setView={setView} />;
    }
    if (view === VIEWS.PARTICIPANT) {
        return <ParticipantList eventId={eventId} eventName={eventName} setView={setView} eventCanUpdate={eventCanUpdate} />;
    }
    if (view === VIEWS.PERMISSION) {
        return <EventPermission eventId={eventId} eventName={eventName} setView={setView} />;
    }

    const total = summary?.total ?? 0;

    return (
        <>
            <PageHeader
                title={t('back.event.home.allEvent')}
                count={summary ? total : undefined}
                subtitle={t('back.event.home.subtitle')}
                extra={menuPerm.canCreate && (
                    <Button
                        type="primary"
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() => { setEventId(null); setView(VIEWS.CREATE); }}
                    >
                        {t('back.event.home.createEvent')}
                    </Button>
                )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 mb-6">
                <StatCard
                    label={t('back.event.home.statPublished')}
                    value={summary?.published ?? 0}
                    badge={t('back.event.home.ofTotal', { percent: percent(summary?.published, total) })}
                    tone="blue"
                    icon={<CalendarOutlined />}
                    loading={summaryLoading && !summary}
                />
                <StatCard
                    label={t('back.event.home.statClosed')}
                    value={summary?.closed ?? 0}
                    badge={t('back.event.home.ofTotal', { percent: percent(summary?.closed, total) })}
                    tone="gray"
                    icon={<StopOutlined />}
                    loading={summaryLoading && !summary}
                />
                <StatCard
                    label={t('back.event.home.statProvinces')}
                    value={summary?.provinces ?? 0}
                    badge={t('back.event.home.nationwide')}
                    tone="gray"
                    icon={<EnvironmentOutlined />}
                    loading={summaryLoading && !summary}
                />
            </div>

            <div className="bo-card overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 md:px-5 border-b border-[#e5e5ea]">
                    <Input
                        allowClear
                        prefix={<SearchOutlined className="text-[#6e6e73]" />}
                        placeholder={t('back.event.home.searchPlaceholder')}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="md:!max-w-[360px]"
                    />
                    <Select
                        value={status}
                        onChange={(v) => { setStatus(v); setPage(1); }}
                        className="md:!w-[190px]"
                        options={[
                            { value: STATUS.ALL, label: `${t('back.event.home.statusTitle')}: ${t('general.all')}` },
                            { value: STATUS.ACTIVE, label: `${t('back.event.home.statusTitle')}: ${t('back.event.home.statusActive')}` },
                            { value: STATUS.DRAFT, label: `${t('back.event.home.statusTitle')}: ${t('back.event.home.statusDraft')}` },
                        ]}
                    />
                    <div className="flex items-center gap-2 md:ml-auto">
                        <Tooltip title={t('back.event.home.refresh')}>
                            <Button icon={<ReloadOutlined />} onClick={refetchAll} loading={isFetching && !!data} aria-label={t('back.event.home.refresh')} />
                        </Tooltip>
                        <Tooltip title={t('back.event.home.export')}>
                            <Button icon={<DownloadOutlined />} onClick={handleExport} loading={exporting} aria-label={t('back.event.home.export')} />
                        </Tooltip>
                    </div>
                </div>

                <Table
                    className="bo-flush-table"
                    rowKey="id"
                    columns={columns}
                    dataSource={eventDataWithPerm}
                    loading={isFetching && !data}
                    scroll={{ x: 'max-content' }}
                    onChange={handleChange}
                    pagination={{
                        pageSize: limitPage,
                        current: page,
                        onChange: (p, ps) => {
                            if (ps !== limitPage) {
                                setLimitPage(ps);
                                setPage(1);
                            } else {
                                setPage(p);
                            }
                        },
                        total: totalData,
                        pageSizeOptions: ["5", "10", "20", "50", "100"],
                        showSizeChanger: true,
                        showTotal: (count, range) => t('back.shell.showing', { from: range[0], to: range[1], total: count }),
                    }}
                />
            </div>
        </>
    );
};

export default EventList;
