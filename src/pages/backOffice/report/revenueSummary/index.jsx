import { ClearOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Col, Input, message, Popover, Row, Space, Spin, Table, Typography } from 'antd';
import CommonForm from "components/commonForm";
import FloatingLabel from 'components/floatingLabel';
import { SYS_YEAR_MONTH_FORMAT } from 'constants/helper';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import backOfficeServices from 'services/backoffice.services';
import fileService from 'services/file.services';
import { formatCurrency } from 'utils/format';

const { Text } = Typography;

const RevenueSummary = () => {
    const [form] = CommonForm.useForm();
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [totalData, setTotalData] = useState(0);
    const [limitPage, setLimitPage] = useState(10);
    const [page, setPage] = useState(1);
    const [order, setOrder] = useState('asc');
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState(undefined);
    const [sortedField, setSortedField] = useState(undefined);
    const [loading, setLoading] = useState(false);

    const { data: dataRevenueSummary, isFetching: isLoadingData, refetch } = backOfficeServices.useQueryGetRevenueSummary({
        startDate,
        endDate,
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
        if (dataRevenueSummary?.content?.length > 0) {
            setData(dataRevenueSummary.content);
            setTotalData(dataRevenueSummary.totalElements);
        } else {
            setData([])
            setTotalData(0);
        }
    }, [dataRevenueSummary]);

    const { mutateAsync: revenueDownload } = fileService.useMutationDownloadSummaryRevenueExcel();

    const handleFilter = (values) => {
        const { revenueDate } = values;
        if (!revenueDate) return;
        const selectedDate = dayjs(revenueDate);
        const newStartDate = selectedDate.startOf('month').toISOString();
        const newEndDate = selectedDate.endOf('month').toISOString();

        if (newStartDate === startDate && newEndDate === endDate) {
            refetch();
        } else {
            setStartDate(newStartDate);
            setEndDate(newEndDate);
        }
    };

    const handleDownload = async () => {
        const { revenueDate } = form.getFieldsValue();
        if (!revenueDate || !dayjs(revenueDate).isValid()) {
            message.error(t("required.date"));
            return;
        }

        const selectedDate = dayjs(revenueDate);
        const startDate = selectedDate.startOf('month').toISOString();
        const endDate = selectedDate.endOf('month').toISOString();

        try {
            setLoading(true);

            await revenueDownload({
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
        setPage(1)
        setStartDate(null);
        setEndDate(null);
        setData([]);
    };

    const columns = [
        {
            title: t("back.report.revenueSummary.columns.contractNo"),
            dataIndex: "contractNo",
            key: "contractNo",
        },
        {
            title: t("back.report.revenueSummary.columns.eventName"),
            dataIndex: "eventName",
            key: "eventName",
        },
        {
            title: t("back.report.revenueSummary.columns.paymentMethod"),
            dataIndex: "paymentMethod",
            key: "paymentMethod",
        },
        {
            title: t("back.report.revenueSummary.columns.registrationFee"),
            dataIndex: "registrationFee",
            key: "registrationFee",
            align: "right",
            render: (value) => formatCurrency(value)
        },
        {
            title: t("back.report.revenueSummary.columns.serviceFee"),
            dataIndex: "serviceFee",
            key: "serviceFee",
            align: "right",
            render: (value) => formatCurrency(value)
        },
        {
            title: t("back.report.revenueSummary.columns.total"),
            dataIndex: "total",
            key: "total",
            align: "right",
            render: (value) => formatCurrency(value)
        },
        {
            title: t("back.report.revenueSummary.columns.shippingFee"),
            dataIndex: "shippingFee",
            key: "shippingFee",
            align: "right",
            render: (value) => formatCurrency(value)
        },
        {
            title: t("back.report.revenueSummary.columns.totalWithShipping"),
            dataIndex: "totalWithShipping",
            key: "totalWithShipping",
            align: "right",
            render: (value) => formatCurrency(value)
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
        <div className="md:max-w-screen-lg xl:max-w-screen-xl mx-auto">
            <CommonForm
                form={form}
                name="revenue-summary-report"
                layout="vertical"
                onFinish={handleFilter}
                autoComplete="off"
            >
                <Row gutter={[16, 16]} align="top">
                    <Col xs={24} md={24}>
                        <div className="text-xl font-semibold opacity-60 mb-4">
                            {t("back.report.revenueSummary.title")}
                        </div>
                    </Col>
                </Row>
                <Row gutter={[16, 16]} align="top">
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
                                <Popover content={t("back.report.revenueSummary.popover.filter")}>
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
                                <Popover content={t("back.report.revenueSummary.popover.export")}>
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
                                <Popover content={t("back.report.revenueSummary.popover.clear")}>
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
                    rowKey={(record) => `${record.contractNo}-${record.paymentMethod}`}
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

export default RevenueSummary

