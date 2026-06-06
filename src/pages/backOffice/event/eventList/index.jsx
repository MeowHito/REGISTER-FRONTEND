import {
    SettingOutlined,
    SearchOutlined,
    ShareAltOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {
    Button,
    Input,
    message,
    Space,
    Spin,
    Tag
} from 'antd';
import { useState, useMemo, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import { useTranslation } from 'react-i18next';
import Highlighter from 'react-highlight-words';

import backOfficeServices from 'services/backoffice.services';
import EventForm from '../eventForm';
import ParticipantList from '../participantList';
import dayjs from 'dayjs';
import { SYS_DATE_FORMAT, SYS_DATE_TIME_FORMAT } from 'constants/helper';
import { AlertConfirm, AlertError, AlertSuccess } from 'components/alert';
import { errorToMessage } from 'hooks/functions/errorToMessage';
import EventDetail from 'pages/front/eventDetail';
import { getMenuPermission, handleQueryStatus } from 'utils';
import EventPermission from '../eventPermission';
import useMe from 'hooks/useMe';
import PermissionActionTable from 'components/permissionActionTable';

const VIEWS = {
    LIST: 'list',
    CREATE: 'create',
    EDIT: 'edit',
    PARTICIPANT: 'participant',
    PREVIEW: 'preview',
    PERMISSION: 'permission',
};

const EventList = () => {
    const { t } = useTranslation();
    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
    const [eventId, setEventId] = useState(null);
    const [eventName, setEventName] = useState(null);
    const [view, setView] = useState(VIEWS.LIST);
    const [eventData, setEventData] = useState([]);
    const [order, setOrder] = useState('asc');
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState(undefined);
    const [limitPage, setLimitPage] = useState(5);
    const [page, setPage] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [sortedField, setSortedField] = useState(undefined);

    const { mutateAsync: updateStatus } = backOfficeServices.useMutationUpdateEventStatus();
    const { mutateAsync: deleteEvent } = backOfficeServices.useMutationDeleteEvent();

    const {
        data: me
    } = useMe({ retry: 0 });
    const roleUser = me?.role?.roleType;
    const [eventCanUpdate, setEventCanUpdate] = useState(true);

    const menuPerm = getMenuPermission('eventList', me);

    const canUpdateRecord = (record) =>
        roleUser === 'admin' || (menuPerm.canUpdate && (record?.permission?.canUpdate ?? true));

    const queryKey = useMemo(() => ["getAllActiveEvents", { page }], [page]);

    const paging = {
        size: limitPage,
        page: page - 1,
        sortField: sortedField,
        sortDirection: order,
        searchField: searchedColumn,
        searchText: searchText ? `%${searchText}%` : undefined,
        search: [
        ].filter(Boolean)
    };

    const { data, isFetching, refetch: refetchEvent, ...other } = backOfficeServices.useQueryGetAllActiveEvents({ paging, queryKey });

    useEffect(() => {
        handleQueryStatus(other, () => {
            setEventData(data.content);
            setTotalData(data.totalElements);
        })
    }, [other.fetchStatus])

    const handleRefetch = () => {
        refetchEvent();
        setEventId(null);
        setEventName(null);
        setView(null);
    };

    const handleChange = (pagination, filters, sorter) => {
        setOrder(sorter.order === 'descend' ? 'desc' : 'asc');
        setSortedField(sorter.field);
    };

    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const handleReset = (clearFilters) => {
        clearFilters();
        setSearchText('');
    };

    const handleUpdateStatus = (item) => {
        AlertConfirm({
            text: t("general.alertConfirm"),
            onOk: async () => {
                try {
                    await updateStatus({ id: item.id, isDraft: !item.isDraft });
                    refetchEvent()
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
                    refetchEvent()
                    AlertSuccess({ title: t("general.deleteSuccess"), text: "" })
                } catch (err) {
                    AlertError({ text: errorToMessage(err) })
                }
            },
        });
    }

    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                <Input
                    placeholder={t('general.searchPlaceholder', { field: dataIndex })}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{ width: 188, marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        {t('general.search')}
                    </Button>
                    <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
                        {t('general.reset')}
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered) => (
            <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        ),
        onFilter: (value, record) =>
            (record[dataIndex]?.toString().toLowerCase() || '').includes(value.toLowerCase()),
        render: (text) =>
            searchedColumn === dataIndex ? (
                <Highlighter
                    highlightStyle={{ backgroundColor: '#188fff55', padding: 0 }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={text?.toString() || ''}
                />
            ) : (
                text
            ),
    });

    const columns = useMemo(() => [
        {
            key: 'index',
            width: 50,
            render: (_text, _record, index) => {
                return totalData - ((page - 1) * limitPage) - index;
            }
        },
        {
            title: t('back.event.home.eventName'),
            dataIndex: 'name',
            key: 'name',
            sorter: true,
        },
        {
            title: t('back.event.home.eventDate'),
            dataIndex: 'eventDate',
            key: 'eventDate',
            render: (value) => value ? dayjs(value).format(SYS_DATE_FORMAT) : '-'
        },
        {
            title: t('back.event.home.location'),
            dataIndex: 'province',
            render: (value) => value?.stateLocal
        },
        {
            title: t('back.event.home.startRegistrationDate'),
            dataIndex: 'startRegistrationDate',
            key: 'startRegistrationDate',
            render: (value) => value ? dayjs(value).format(SYS_DATE_TIME_FORMAT) : '-'
        },
        {
            title: t('back.event.home.endRegistrationDate'),
            dataIndex: 'endRegistrationDate',
            key: 'endRegistrationDate',
            render: (value) => value ? dayjs(value).format(SYS_DATE_TIME_FORMAT) : '-'
        },
        {
            title: "สถานะ",
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            fixed: 'right',
            width: 100,
            render: (_, record) => (
                <div className="center gap-2">
                    {canUpdateRecord(record) ? (
                        record.isDraft ?
                            <Button
                                color="orange"
                                variant="outlined"
                                className='w-full'
                                onClick={() => {
                                    handleUpdateStatus(record);
                                }}
                            >
                                ฉบับร่าง
                            </Button>
                            :
                            <Button
                                type="primary"
                                className='w-full'
                                onClick={() => {
                                    handleUpdateStatus(record);
                                }}
                            >
                                ใช้งาน
                            </Button>
                    ) : (
                        record.isDraft ?
                            <Tag color="orange">ฉบับร่าง</Tag>
                            :
                            <Tag color="blue">ใช้งาน</Tag>
                    )}
                </div>
            ),
        },
    ], [page, limitPage, totalData, t, isMobile]);

    const renderSection = () => {
        if (view !== VIEWS.PARTICIPANT && view !== VIEWS.PERMISSION) {
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
            } else if (view === VIEWS.PREVIEW) {
                return <EventDetail eventId={eventId} setView={setView} />
            }
            return (
                <Spin spinning={isFetching}>
                    <PermissionActionTable
                        rowKey="id"
                        className="w-full text-nowrap"
                        columns={columns.map((col) =>
                            col.search ? { ...col, ...getColumnSearchProps(col.dataIndex) } : col
                        )}
                        dataSource={eventData}
                        bordered
                        scroll={{ x: true }}
                        pagination={{
                            pageSize: limitPage,
                            current: page,
                            onChange: (p, ps) => {
                                setPage(p);
                                setLimitPage(ps);
                            },
                            total: totalData,
                            pageSizeOptions: ["5", "10", "20", "50", "100"],
                            showSizeChanger: true,
                        }}
                        onChange={handleChange}

                        rawId="eventList"
                        totalText={t("back.event.home.allEvent")}
                        totalData={totalData}
                        createButtonText={t("back.event.home.createEvent")}
                        onView={(record) => {
                            setEventId(record?.id);
                            setView(VIEWS.PREVIEW);
                        }}
                        onCreate={() => {
                            setEventId(null);
                            setView(VIEWS.CREATE);
                        }}
                        onEdit={(record) => {
                            setEventId(record?.id);
                            setView(VIEWS.EDIT);
                        }}
                        onDelete={(record) => {
                            handleDelete(record)
                        }}
                        recordPermission={true}
                        extraPosition="start"
                        extraActions={(record) => [
                            <Button
                                key="shareLink"
                                variant="link" color="default"
                                onClick={async () => {
                                    const urlSlug = `${globalThis.location.protocol}//${globalThis.location.host}/eventDetail/${record?.link || record?.id}`;
                                    await navigator.clipboard.writeText(urlSlug);
                                    message.success(t("general.copySuccess"));
                                }}
                                icon={<ShareAltOutlined />}
                            >
                                {t("general.buttonShareLink")}
                            </Button>,
                            <Button
                                key="manageParticipants"
                                variant="link" color="default"
                                onClick={() => {
                                    setEventId(record?.id);
                                    setEventName(record?.name);
                                    setEventCanUpdate(canUpdateRecord(record));
                                    setView(VIEWS.PARTICIPANT);
                                }}
                                icon={<UserOutlined />}
                            >
                                {t("back.event.home.manageParticipants")}
                            </Button>,
                            (record?.permission?.role === 'owner' || roleUser === 'admin' || record?.permission?.role === 'admin') && (
                                <Button
                                    key="managePermission"
                                    variant="link" color="default"
                                    onClick={() => {
                                        setEventId(record?.id);
                                        setEventName(record?.name);
                                        setView(VIEWS.PERMISSION);
                                    }}
                                    icon={<SettingOutlined />}
                                >
                                    {t("back.event.home.managePermission")}
                                </Button>
                            ),
                        ].filter(Boolean)}
                    />
                </Spin>
            );
        } else if (view === VIEWS.PARTICIPANT) {
            return <ParticipantList eventId={eventId} eventName={eventName} setView={setView} eventCanUpdate={eventCanUpdate} />;
        } else if (view === VIEWS.PERMISSION) {
            return <EventPermission eventId={eventId} eventName={eventName} setView={setView} />;
        }
        return null;
    };

    return (
        <>
            {renderSection()}
        </>
    );
};

export default EventList;
