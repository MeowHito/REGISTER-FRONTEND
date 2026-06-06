import { ClearOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Col, Input, message, Popover, Row, Space, Spin, Table } from 'antd'
import CommonForm from "components/commonForm";
import FloatingLabel from 'components/floatingLabel';
import { SYS_DATE_FULL_TIME_FORMAT, SYS_YEAR_MONTH_FORMAT } from 'constants/helper';
import dayjs from 'dayjs';
import useMe from 'hooks/useMe';
import React, { useEffect, useState } from 'react'
import Highlighter from 'react-highlight-words';
import { useTranslation } from 'react-i18next';
import backOfficeServices from 'services/backoffice.services';
import fileService from 'services/file.services';
import { formatCurrency } from 'utils/format';

const RevenueDetailSummary = () => {
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

    const { data: dataEvent } = backOfficeServices.useQueryGetEventByOrganizer({
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

    const { data: dataRevenueDetailSummary, isFetching: isLoadingData, refetch } = backOfficeServices.useQueryGetRevenueDetailSummary({
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
        if (dataRevenueDetailSummary?.content?.length > 0) {
            setData(dataRevenueDetailSummary.content);
            setTotalData(dataRevenueDetailSummary.totalElements);
        } else {
            setData([])
            setTotalData(0);
        }
    }, [dataRevenueDetailSummary]);

    const { mutateAsync: revenueDetailDownload } = fileService.useMutationDownloadSummaryRevenueDetailExcel();

    const handleFilter = (values) => {
        const { eventId, revenueDate } = values;
        if (!revenueDate) return;
        
        const selectedDate = dayjs(revenueDate);
        const startDate = selectedDate.startOf('month').toISOString();
        const endDate = selectedDate.endOf('month').toISOString();

        if (eventId === filteredData?.id && startDate === filteredData?.startDate) {
            refetch();
        } else {
            setFilteredData({
                id: eventId,
                startDate,
                endDate,
            });
        }
    };

    const handleDownload = async () => {
        const { eventId, revenueDate } = form.getFieldsValue();
        if (!eventId || !revenueDate || !dayjs(revenueDate).isValid()) {
            message.error(t("required.export"));
            return;
        }

        const selectedDate = dayjs(revenueDate);
        const startDate = selectedDate.startOf('month').toISOString();
        const endDate = selectedDate.endOf('month').toISOString();

        try {
            setLoading(true);

            await revenueDetailDownload({
                id: eventId,
                startDate,
                endDate,
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
            title: t("back.report.revenueDetailSummary.columns.eventName"),
            dataIndex: "eventName",
            key: "eventName",
            sorter: true,
            search: true,
        },
        {
            title: t("back.report.revenueDetailSummary.columns.orderId"),
            dataIndex: "orderId",
            key: "orderId",
            sorter: true,
            search: true,
        },
        {
            title: t("back.report.revenueDetailSummary.columns.transactionId"),
            dataIndex: "transactionId",
            key: "transactionId",
            sorter: true,
            search: true,
        },
        {
            title: t("back.report.revenueDetailSummary.columns.paymentDateTime"),
            dataIndex: "paymentDateTime",
            key: "paymentDateTime",
            sorter: true,
            render: (date) => date ? dayjs(date).format(SYS_DATE_FULL_TIME_FORMAT) : "",
        },
        {
            title: t("back.report.revenueDetailSummary.columns.fullName"),
            dataIndex: "fullName",
            key: "fullName",
            sorter: true,
            search: true,
        },
        {
            title: t("back.report.revenueDetailSummary.columns.registrationFee"),
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
            title: t("back.report.revenueDetailSummary.columns.totalAmount"),
            dataIndex: "totalAmount",
            key: "totalAmount",
            align: "right",
            render: (value) => formatCurrency(value)
        },
        {
            title: t("back.report.revenueDetailSummary.columns.serviceFee"),
            dataIndex: "serviceFee",
            key: "serviceFee",
            align: "right",
            render: (value) => formatCurrency(value)
        },
        {
            title: t("back.report.revenueDetailSummary.columns.totalAmountWithFee"),
            dataIndex: "totalAmountWithFee",
            key: "totalAmountWithFee",
            align: "right",
            render: (value) => formatCurrency(value)
        },
        {
            title: t("back.report.revenueDetailSummary.columns.type"),
            dataIndex: "eventTypeName",
            key: "eventTypeName",
            sorter: true,
            search: true,
        },
        {
            title: t("back.report.revenueDetailSummary.columns.paymentMethod"),
            dataIndex: "paymentMethod",
            key: "paymentMethod",
            sorter: true,
            search: true,
        },
        {
            title: t("back.report.revenueDetailSummary.columns.registrationDateTime"),
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
                name="revenue-detail-summary-report"
                layout="vertical"
                onFinish={handleFilter}
                autoComplete="off"
            >
                <Row gutter={[16, 16]} align="top">
                    <Col xs={24} md={24}>
                        <div className="text-xl font-semibold opacity-60 mb-4">
                            {t("back.report.revenueDetailSummary.title")}
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
                                    label={t("back.report.revenueDetailSummary.labels.organizer")}
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
                                label={t("back.report.revenueDetailSummary.labels.event")}
                                type="select"
                                options={eventOptions}
                                required
                            />
                        </CommonForm.Item>
                    </Col>
                    <Col xs={24} sm={12} md={5}>
                        <CommonForm.Item
                            name="revenueDate"
                            rules={[{ required: true, message: t("required.month") }]}
                        >
                            <FloatingLabel
                                type="date"
                                format={SYS_YEAR_MONTH_FORMAT}
                                label={"เดือน"}
                                picker="month"
                                required
                            />
                        </CommonForm.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <CommonForm.Item>
                            <Space size="middle">
                                <Popover content={t("back.report.revenueDetailSummary.popover.filter")}>
                                    <Button
                                        icon={<SearchOutlined />}
                                        size="large"
                                        type="primary"
                                        htmlType="submit"
                                        disabled={isLoadingData}
                                        loading={isLoadingData}
                                    >
                                    </Button>
                                </Popover>
                                <Popover content={t("back.report.revenueDetailSummary.popover.export")}>
                                    <Button
                                        icon={<DownloadOutlined />}
                                        size="large"
                                        color="primary"
                                        variant="outlined"
                                        onClick={handleDownload}
                                        disabled={loading}
                                        loading={loading}
                                    >
                                    </Button>
                                </Popover>
                                <Popover content={t("back.report.revenueDetailSummary.popover.clear")}>
                                    <Button
                                        icon={<ClearOutlined />}
                                        size="large"
                                        onClick={handleClear}
                                        danger
                                    >
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
                />
            </Spin>
        </div>
    )
}

export default RevenueDetailSummary

