import { ClearOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Col, Input, message, Popover, Row, Space, Spin, Table } from 'antd'
import CommonForm from "components/commonForm";
import FloatingLabel from 'components/floatingLabel';
import { SYS_DATE_FORMAT, SYS_DATE_FULL_TIME_FORMAT } from 'constants/helper';
import dayjs from 'dayjs';
import useMe from 'hooks/useMe';
import React, { useEffect, useState } from 'react'
import Highlighter from 'react-highlight-words';
import { useTranslation } from 'react-i18next';
import backOfficeServices from 'services/backoffice.services';
import fileService from 'services/file.services';
import { formatCurrency } from 'utils/format';

const ParticipantSummary = () => {
    const [form] = CommonForm.useForm();
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const [totalData, setTotalData] = useState(0);
    const [limitPage, setLimitPage] = useState(10);
    const [page, setPage] = useState(1);
    const [order, setOrder] = useState('asc');
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState(undefined);
    const [sortedField, setSortedField] = useState(undefined);
    const [organizerOptions, setOrganizerOptions] = useState([]);
    const [eventOptions, setEventOptions] = useState([]);
    const [organizerId, setOrganizerId] = useState(null);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);

    const {
        data: me
    } = useMe({ retry: 0 });
    const userId = me?.id;
    const roleUser = me?.role?.roleType;

    useEffect(() => {
        if (roleUser === "organizer" && userId) {
            setOrganizerId(userId);
        }
    }, [userId]);

    const { data: dataOrganizer } = backOfficeServices.useQueryGetUserActiveByRole({
        role: "organizer",
    });

    useEffect(() => {
        if (dataOrganizer?.length > 0) {
            let options = dataOrganizer.map((n) => {
                return { value: n.id, label: `${n?.firstName || ''} ${n?.lastName || ''}${n?.companyName ? ` (${n.companyName})` : ''}`.trim() };
            });

            setOrganizerOptions(options);
        } else {
            setOrganizerOptions([]);
        }
    }, [dataOrganizer]);

    const { data: dataEvent, refetch: refetchEvent } = backOfficeServices.useQueryGetEventByPermission({
        id: organizerId,
    });

    useEffect(() => {
        if (dataEvent?.length > 0) {
            const options = dataEvent?.map(({ name, id }) => ({
                value: id, label: name
            })) || [];
            setEventOptions(options);
        } else {
            setEventOptions([]);
        }
    }, [dataEvent]);

    const { data: dataRegistrantSummary, isFetching: isLoadingData, refetch } = backOfficeServices.useQueryGetRegistrantSummary({
        id: filteredData?.id,
        startDate: filteredData?.startDate,
        endDate: filteredData?.endDate,
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
        if (dataRegistrantSummary?.content?.length > 0) {
            setData(dataRegistrantSummary.content);
            setTotalData(dataRegistrantSummary.totalElements);
        } else {
            setData([])
            setTotalData(0);
        }
    }, [dataRegistrantSummary]);

    const { mutateAsync: participantDownload } = fileService.useMutationDownloadSummaryRegistrantExcel();

    const handleFilter = (values) => {
        const { eventId, range } = values;
        const [startDate, endDate] = range || [];

        const startISO = startDate?.startOf("day").toISOString();
        const endISO = endDate?.endOf("day").toISOString();

        const isSameFilter =
            eventId === filteredData?.id &&
            startISO === filteredData?.startDate &&
            endISO === filteredData?.endDate;

        if (isSameFilter) {
            refetch();
        } else {
            setFilteredData({
                id: eventId,
                startDate: startISO,
                endDate: endISO,
            });
        }
    };

    const handleDownload = async () => {
        const { eventId, range } = form.getFieldsValue();
        const [startDate, endDate] = range || [];

        if (!eventId || !startDate || !endDate) {
            message.error(t("required.export"));
            return;
        }

        try {
            setLoading(true);

            await participantDownload({
                id: eventId,
                startDate: startDate?.startOf("day").toISOString(),
                endDate: endDate?.endOf("day").toISOString()
            });

        } catch (error) {
            console.error("Error Participant Summary Excel", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        form.resetFields();
        if (roleUser === "admin") {
            setOrganizerId(null);
            setEventOptions([]);
        }
        setPage(1)
        setFilteredData(null);
        setData([])
    };

    const handleOrganizerChange = (value) => {
        setOrganizerId(value);
        form.setFieldsValue({ event: null });
    };

    const columns = [
        {
            title: t("back.report.participantSummary.columns.no"),
            key: "index",
            align: "center",
            render: (_text, _record, index) => {
                return totalData - (page - 1) * limitPage - index;
            }
        },
        {
            title: t("back.report.participantSummary.columns.eventName"),
            dataIndex: "eventName",
            key: "eventName",
            sorter: true,
            search: true,
        },
        {
            title: t("back.report.participantSummary.columns.orderId"),
            dataIndex: "orderId",
            key: "orderId",
            sorter: true,
            search: true,
        },
        {
            title: t("back.report.participantSummary.columns.transactionId"),
            dataIndex: "transactionId",
            key: "transactionId",
            sorter: true,
            search: true,
        },
        {
            title: t("back.report.participantSummary.columns.paymentDateTime"),
            dataIndex: "paymentDateTime",
            key: "paymentDateTime",
            sorter: true,
            render: (date) => date ? dayjs(date).format(SYS_DATE_FULL_TIME_FORMAT) : "",
        },
        {
            title: t("back.report.participantSummary.columns.fullName"),
            dataIndex: "fullName",
            key: "fullName",
            sorter: true,
            search: true,
        },
        {
            title: t("back.report.participantSummary.columns.registrationFee"),
            dataIndex: "registrationFee",
            key: "registrationFee",
            align: "right",
            render: (value) => formatCurrency(value)
        },
        {
            title: t("back.report.participantSummary.columns.discountCoupon"),
            dataIndex: "discountCoupon",
            key: "discountCoupon",
            align: "right",
            render: (value) => formatCurrency(value)
        },
        {
            title: t("back.report.participantSummary.columns.discountShirt"),
            dataIndex: "discountShirt",
            key: "discountShirt",
            align: "right",
            render: (value) => formatCurrency(value)
        },
        {
            title: t("back.report.participantSummary.columns.shippingFee"),
            dataIndex: "shippingFee",
            key: "shippingFee",
            align: "right",
            render: (value) => formatCurrency(value)
        },
        {
            title: t("back.report.participantSummary.columns.totalAmount"),
            dataIndex: "totalAmount",
            key: "totalAmount",
            align: "right",
            render: (value) => formatCurrency(value)
        },
        {
            title: t("back.report.participantSummary.columns.type"),
            dataIndex: "eventTypeName",
            key: "eventTypeName",
            sorter: true,
            search: true,
        },
        {
            title: t("back.report.participantSummary.columns.status"),
            dataIndex: "paymentStatus",
            key: "paymentStatus",
            sorter: true,
            search: true,
        },
        {
            title: t("back.report.participantSummary.columns.paymentMethod"),
            dataIndex: "paymentMethod",
            key: "paymentMethod",
            sorter: true,
            search: true,
        },
        {
            title: t("back.report.participantSummary.columns.registrationDateTime"),
            dataIndex: "registrationDateTime",
            key: "registrationDateTime",
            sorter: true,
            render: (date) => date ? dayjs(date).format(SYS_DATE_FULL_TIME_FORMAT) : "",
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
                    textToHighlight={String(text ?? "")}
                />
            ) : (
                text ?? ""
            ),
    });

    return (
        <div className="md:max-w-screen-lg xl:max-w-screen-xl mx-auto">
            <CommonForm
                form={form}
                name="participant-summary-report"
                layout="vertical"
                onFinish={handleFilter}
                autoComplete="off"
            >
                <Row gutter={[16, 16]} align="top">
                    <Col xs={24} md={24}>
                        <div className="text-xl font-semibold opacity-60 mb-4">
                            {t("back.report.participantSummary.title")}
                        </div>
                    </Col>
                </Row>
                <Row gutter={[16, 16]} align="top">
                    {roleUser === "admin" && (
                        <Col xs={24} sm={12} md={5}>
                            <CommonForm.Item
                                name="organizerId"
                                rules={[{ required: true, message: t("required.organizer") }]}
                            >
                                <FloatingLabel
                                    label={t("back.report.participantSummary.labels.organizer")}
                                    type="select"
                                    options={organizerOptions}
                                    onChange={handleOrganizerChange}
                                    required
                                />
                            </CommonForm.Item>
                        </Col>
                    )}
                    <Col xs={24} sm={12} md={5}>
                        <CommonForm.Item
                            name="eventId"
                            rules={[{ required: true, message: t("required.event") }]}
                        >
                            <FloatingLabel
                                label={t("back.report.participantSummary.labels.event")}
                                type="select"
                                options={eventOptions}
                                onDropdownVisibleChange={(open) => open && refetchEvent()}
                                required
                            />
                        </CommonForm.Item>
                    </Col>
                    <Col xs={24} sm={12} md={5}>
                        <CommonForm.Item
                            name="range"
                            rules={[{ required: true, message: t("required.dateRange") }]}
                        >
                            <FloatingLabel
                                label={t("back.report.participantSummary.labels.range")}
                                type="range"
                                format={SYS_DATE_FORMAT}
                                required
                            />
                        </CommonForm.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <CommonForm.Item>
                            <Space size="middle">
                                <Popover content={t("back.report.participantSummary.popover.filter")}>
                                    <Button
                                        icon={<SearchOutlined />}
                                        size="large"
                                        type="primary"
                                        htmlType="submit"
                                        disabled={isLoadingData}
                                        loading={isLoadingData}
                                    >
                                        {/* {t("back.report.participantSummary.filter")} */}
                                    </Button>
                                </Popover>
                                <Popover content={t("back.report.participantSummary.popover.export")}>
                                    <Button
                                        icon={<DownloadOutlined />}
                                        size="large"
                                        color="primary"
                                        variant="outlined"
                                        onClick={handleDownload}
                                        disabled={loading}
                                        loading={loading}
                                    >
                                        {/* {t("back.report.participantSummary.export")} */}
                                    </Button>
                                </Popover>
                                <Popover content={t("back.report.participantSummary.popover.clear")}>
                                    <Button
                                        icon={<ClearOutlined />}
                                        size="large"
                                        onClick={handleClear}
                                        danger
                                    >
                                        {/* {t("back.report.participantSummary.clear")} */}
                                    </Button>
                                </Popover>
                            </Space>
                        </CommonForm.Item>
                    </Col>
                </Row>
            </CommonForm>
            <Spin spinning={isLoadingData}>
                <Table className="!w-full !text-nowrap"
                    rowKey="id"
                    columns={columns.map(column => ({
                        ...column,
                        ...(column.search && getColumnSearchProps(column.dataIndex))
                    }))}
                    dataSource={data}
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
                    rowClassName={(record) => {
                        const status = record.paymentStatus?.toUpperCase();
                        if (status === "PENDING") return "!bg-yellow-50";
                        if (status === "SUCCESS") return "!bg-green-50";
                        if (status === "FAILED") return "!bg-red-50";
                        if (status === "CANCELLED") return "!bg-purple-50";
                        return "";
                    }}
                />
            </Spin>
        </div>
    )
}

export default ParticipantSummary

