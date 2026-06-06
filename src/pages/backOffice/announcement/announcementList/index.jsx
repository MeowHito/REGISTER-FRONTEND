import React, { useEffect, useState } from 'react';
import { Input, Button, Tag, Space, message, Spin } from 'antd';
import { CheckOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import UseModalHook from 'hooks/useModalHook';
import Highlighter from 'react-highlight-words';
import Announcement from '../announcementForm';
import backOfficeServices from 'services/backoffice.services';
import { AlertConfirm, AlertError } from 'components/alert';
import { errorToMessage } from 'hooks/functions/errorToMessage';
import dayjs from 'dayjs';
import { SYS_DATE_FORMAT } from 'constants/helper';
import useMe from 'hooks/useMe';
import PermissionActionTable from 'components/permissionActionTable';

const AnnouncementList = () => {
    const { t } = useTranslation();
    const [mode, setMode] = useState(null);
    const [announcementData, setAnnouncementData] = useState([]);
    const [editAnnouncement, setEditAnnouncement] = useState(null);
    const [totalData, setTotalData] = useState(0);
    const [order, setOrder] = useState('asc');
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState(undefined);
    const [limitPage, setLimitPage] = useState(10);
    const [page, setPage] = useState(1);
    const [sortedField, setSortedField] = useState(undefined);

    const {
        data: me
    } = useMe({ retry: 0 });
    const roleUser = me?.role?.roleType;

    const {
        open: openAnnouncement,
        handleOpen: handleOpenAnnouncement,
        handleClose: handleCloseAnnouncement,
    } = UseModalHook();

    const handleApprove = (id) => {
        AlertConfirm({
            text: t("back.announcementList.readConfirm"),
            onOk: () => {
                updateAnnouncementReadStatus({ id, isRead: true });
            },
        });
    };

    const handleDelete = (id) => {
        AlertConfirm({
            text: t("general.deleteConfirm"),
            onOk: () => {
                deleteAnnouncement({ id });
            },
        });
    };

    const { refetch: refetchAnnouncement, isFetching: isLoadingData, data: dataAnnouncement } = backOfficeServices.useQueryGetAllAnnouncement({
        paging: {
            page: page - 1,
            size: limitPage,
            sortField: sortedField,
            sortDirection: order,
            searchField: searchedColumn,
            searchText: (searchText != "" && searchText != undefined) ? "%" + searchText + "%" : undefined,
        },
    });

    useEffect(() => {
        if (dataAnnouncement?.content?.length > 0) {
            setAnnouncementData(dataAnnouncement?.content)
            setTotalData(dataAnnouncement?.totalElements);
        } else {
            setAnnouncementData([])
            setTotalData(0);
        }
    }, [dataAnnouncement]);

    const { mutate: updateAnnouncementReadStatus } = backOfficeServices.useMutationUpdateAnnouncementReadStatus(
        () => {
            message.success(t("general.alertSuccess"));
            refetchAnnouncement();
        },
        (err) => {
            AlertError({ text: errorToMessage(err) });
        }
    );

    const { mutate: deleteAnnouncement } = backOfficeServices.useMutationDeleteAnnouncement(
        () => {
            message.success(t("general.alertSuccess"));
            refetchAnnouncement();
        },
        (err) => {
            AlertError({ text: errorToMessage(err) });
        }
    );
    const columns = [
        {
            title: t("back.announcementList.no"),
            key: "index",
            align: "center",
            render: (_text, _record, index) => {
                return totalData - (page - 1) * limitPage - index;
            }
        },
        {
            title: t("back.announcementList.eventName"),
            dataIndex: 'eventName',
            key: 'eventName',
        },
        {
            title: t("back.announcementList.title"),
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: t("back.announcementList.startDate"),
            dataIndex: 'startDate',
            key: 'startDate',
            render: (date) => date ? dayjs(date).format(SYS_DATE_FORMAT) : "",
        },
        {
            title: t("back.announcementList.status"),
            dataIndex: 'isRead',
            key: 'isRead',
            render: (isRead) => (
                <Tag color={isRead ? 'green' : 'orange'}>
                    {t(isRead ? "back.announcementList.read" : "back.announcementList.unread")}
                </Tag>
            ),
        },
    ];

    const handleChange = (pagination, filters, sorter) => {
        setOrder(sorter.order == 'descend' ? 'desc' : 'asc')
        setSortedField(sorter.field)
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

    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                <Input
                    placeholder={`Search ${dataIndex}`}
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
                        Search
                    </Button>
                    <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
                        Reset
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
        onFilter: (value, record) =>
            (record[dataIndex]?.toString().toLowerCase() || '').includes(value.toLowerCase()),
        render: (text) =>
            searchedColumn === dataIndex ? (
                <Highlighter
                    highlightStyle={{ backgroundColor: '#188fff55', padding: 0 }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={text.toString()}
                />
            ) : (
                text
            ),
    });

    return (
        <>
            <Spin spinning={isLoadingData}>
                <PermissionActionTable
                    rowKey="id"
                    className="w-full !text-nowrap"
                    columns={columns.map(column => ({
                        ...column,
                        ...(column.search && getColumnSearchProps(column.dataIndex))
                    }))}
                    dataSource={announcementData}
                    bordered
                    scroll={{ x: true }}
                    pagination={{
                        pageSize: limitPage,
                        current: page,
                        onChange: (page, pageSize) => {
                            setPage(page);
                            setLimitPage(pageSize);
                        },
                        total: totalData,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showSizeChanger: true
                    }}
                    onChange={handleChange}

                    rawId="announcementList"
                    totalText={t("back.announcementList.allAnnouncements")}
                    totalData={totalData}
                    createButtonText={t("back.announcementList.buttonAnnouncement")}
                    onCreate={roleUser === "organizer" ?
                        () => {
                            setEditAnnouncement(null);
                            handleOpenAnnouncement();
                            setMode("new")
                        } : undefined
                    }
                    onView={(record) => {
                        setEditAnnouncement({ ...record });
                        setMode("view");
                        handleOpenAnnouncement();
                    }}
                    onEdit={(record) => {
                        setEditAnnouncement({ ...record });
                        setMode("edit");
                        handleOpenAnnouncement();
                    }}
                    onDelete={(record) => {
                        handleDelete(record?.id)
                    }}
                    recordPermission={true}
                    extraPosition="start"
                    extraActions={(record) => [
                        (roleUser === "admin" && !record?.isRead) && (
                            <Button
                                variant="link"
                                color="default"
                                icon={<CheckOutlined />}
                                onClick={() => handleApprove(record?.id)}
                            >
                                {t("back.announcementList.buttonApprove")}
                            </Button>
                        )
                    ].filter(Boolean)}
                />
            </Spin>
            <Announcement
                isEditable={mode === "new" || mode === "edit"}
                data={editAnnouncement}
                open={openAnnouncement}
                onOk={handleCloseAnnouncement}
                onCancel={handleCloseAnnouncement}
                refetch={refetchAnnouncement}
                mode={mode}
            />
        </>
    );
};

export default AnnouncementList;
