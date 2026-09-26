import {
    CopyOutlined,
    DeleteOutlined,
    EditOutlined,
    EnvironmentOutlined,
    EyeOutlined,
    MoreOutlined,
    PlusOutlined,
    SettingOutlined,
    ShareAltOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {
    Button,
    Dropdown,
    message,
    Switch,
    Table,
    Tooltip,
} from 'antd';
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import useActiveEvent from 'hooks/useActiveEvent';

const VIEWS = {
    LIST: 'list',
    CREATE: 'create',
    EDIT: 'edit',
    PARTICIPANT: 'participant',
    PREVIEW: 'preview',
    PERMISSION: 'permission',
};

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
    const [limitPage, setLimitPage] = useState(5);
    const [page, setPage] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [sortedField, setSortedField] = useState(undefined);
    // With an event starred the table holds that event only; switching is done from the top bar.
    const { activeEvent, setActiveEvent, clearActiveEvent } = useActiveEvent();

    const { mutateAsync: updateStatus } = backOfficeServices.useMutationUpdateEventStatus();
    const { mutateAsync: deleteEvent } = backOfficeServices.useMutationDeleteEvent();
    const { mutateAsync: duplicateEvent } = backOfficeServices.useMutationDuplicateEvent();

    const { data: me } = useMe({ retry: 0 });
    const roleUser = me?.role?.roleType;
    const [eventCanUpdate, setEventCanUpdate] = useState(true);

    const menuPerm = getMenuPermission('eventList', me);

    const canUpdateRecord = (record) =>
        roleUser === 'admin' || (menuPerm.canUpdate && (record?.permission?.canUpdate ?? true));

    const paging = useMemo(() => ({
        size: limitPage,
        page: page - 1,
        sortField: sortedField,
        sortDirection: order,
    }), [limitPage, page, sortedField, order]);

    const queryKey = useMemo(() => ["getAllActiveEvents", paging], [paging]);

    const { data, isFetching, refetch: refetchEvent, ...other } = backOfficeServices.useQueryGetAllActiveEvents({ paging, queryKey, enabled: !activeEvent });

    // The starred event, fetched through the same list endpoint so it carries its permission flags.
    const activePaging = useMemo(() => ({
        page: 0,
        size: 1,
        search: [{ searchField: 'uuid', searchText: activeEvent?.id, searchType: 'EQUAL' }],
    }), [activeEvent?.id]);
    const {
        data: activeData,
        isFetching: activeFetching,
        isSuccess: activeLoaded,
        refetch: refetchActive,
    } = backOfficeServices.useQueryGetAllActiveEvents({
        paging: activePaging,
        queryKey: ["getAllActiveEvents", "starred", activeEvent?.id],
        enabled: !!activeEvent?.id,
    });
    const activeRecord = activeData?.content?.[0];

    useEffect(() => {
        if (!activeEvent || !activeLoaded || activeFetching) return;
        if (!activeRecord) {
            // Deleted, or this user lost access to it.
            clearActiveEvent();
        } else if (activeRecord.name !== activeEvent.name) {
            setActiveEvent(activeRecord);
        }
    }, [activeEvent, activeLoaded, activeFetching, activeRecord, clearActiveEvent, setActiveEvent]);

    useEffect(() => {
        handleQueryStatus(other, () => {
            setEventData(data.content);
            setTotalData(data.totalElements);
        })
    }, [other.fetchStatus])

    const refetchAll = () => {
        if (activeEvent) refetchActive();
        else refetchEvent();
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

    const eventDataWithPerm = useMemo(() => {
        const rows = activeEvent ? (activeRecord ? [activeRecord] : []) : eventData;
        return rows.map((e) => ({
            ...e,
            permission: {
                ...e.permission,
                canDelete: roleUser === 'admin' ? true : e.permission?.canDelete,
            }
        }));
    }, [activeEvent, activeRecord, eventData, roleUser]);

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
                <span className="text-[#6e6e73] tabular-nums">{activeEvent ? index + 1 : totalData - ((page - 1) * limitPage) - index}</span>
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

    return (
        <>
            <PageHeader
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

            <div className="bo-card overflow-hidden">
                <Table
                    className="bo-flush-table"
                    rowKey="id"
                    columns={columns}
                    dataSource={eventDataWithPerm}
                    loading={activeEvent ? activeFetching && !activeRecord : isFetching && !data}
                    scroll={{ x: 'max-content' }}
                    onChange={handleChange}
                    pagination={activeEvent ? false : {
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
