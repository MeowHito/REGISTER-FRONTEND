import React, { useEffect, useRef, useState } from 'react';
import { Table, Button, Row, Col, Space, Popover, Typography, message, Spin, Input, Modal } from 'antd';
import CommonForm from "components/commonForm";
import { DownloadOutlined, SearchOutlined, ClearOutlined, FileAddOutlined } from '@ant-design/icons';
import FloatingLabel from 'components/floatingLabel';
import { useTranslation } from 'react-i18next';
import backOfficeServices from 'services/backoffice.services';
import fileService from 'services/file.services';
import { formatCurrency } from 'utils/format';
import { SYS_DATE_FORMAT } from 'constants/helper';
import useMe from 'hooks/useMe';

const FinanceSummary = () => {
    const [form] = CommonForm.useForm();
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const [dataSummary, setDataSummary] = useState([]);
    const [order, setOrder] = useState('asc');
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState(undefined);
    const [sortedField, setSortedField] = useState(undefined);
    const [filteredData, setFilteredData] = useState([]);
    const [organizerOptions, setOrganizerOptions] = useState([]);
    const [eventOptions, setEventOptions] = useState([]);
    const [organizerId, setOrganizerId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [remark, setRemark] = useState('');
    const inputRef = useRef(null);

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


    const { data: dataEvent, refetch: refetchEvent } = backOfficeServices.useQueryGetEventByOrganizer({
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

    const { data: dataFinanceSummary, isFetching: isLoadingData, refetch } = backOfficeServices.useQueryGetFinanceSummary({
        id: filteredData?.id,
        startDate: filteredData?.startDate,
        endDate: filteredData?.endDate,
        paging: {
            sortField: sortedField,
            sortDirection: order,
            searchField: searchedColumn,
            searchText: (searchText != "" && searchText != undefined) ? "%" + searchText + "%" : undefined,
        },
    });

    useEffect(() => {
        if (dataFinanceSummary?.content?.content?.length > 0) {
            setData(dataFinanceSummary.content.content);
            setDataSummary(dataFinanceSummary?.summary)
        } else {
            setData([])
            setDataSummary([])
        }
    }, [dataFinanceSummary]);

    const { mutateAsync: downloadSummaryFinanceExcel } = fileService.useMutationDownloadSummaryFinanceExcel();
    const { mutateAsync: downloadSummaryFinanceDocument } = fileService.useMutationSummaryFinanceDocument();

    const handleFilter = async (values) => {
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

            downloadSummaryFinanceExcel({
                id: eventId,
                startDate: startDate?.startOf("day").toISOString(),
                endDate: endDate?.endOf("day").toISOString(),
            });

        } catch (error) {
            console.error("Error Finance Summary Document", error);
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
        setFilteredData(null);
        setData([]);
    };

    const handleOrganizerChange = (value) => {
        setOrganizerId(value);
        form.setFieldsValue({ event: null });
    };

    const columns = [
        {
            title: t("back.report.financeSummary.columns.no"),
            dataIndex: "key",
            key: "key",
            width: 60,
            align: 'center',
            render: (_, __, index) => index + 1
        },
        {
            title: t("back.report.financeSummary.columns.detail"),
            dataIndex: "eventTypeName",
            key: "eventTypeName",
            fixed: 'left',
        },
        {
            title: t("back.report.financeSummary.columns.price"),
            dataIndex: "registrationFee",
            key: "registrationFee",
            align: "right",
            render: (value) => formatCurrency(value)
        },
        {
            title: t("back.report.financeSummary.columns.qty"),
            dataIndex: "qty",
            key: "qty",
            align: "center",
        },
        {
            title: t("back.report.financeSummary.columns.total"),
            dataIndex: "total",
            key: "total",
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

    const renderRowSummary = (labelKey, value) => (
        <div className="flex justify-between mb-2 pb-2 border-b border-gray-200">
            <span>{t(`back.report.financeSummary.columns.${labelKey}`)}</span>
            <span style={{ wordSpacing: '6px' }}>{formatCurrency(value)} {t("back.report.financeSummary.currency")}</span>
        </div>
    );

    useEffect(() => {
        if (isModalOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isModalOpen]);

    const handleOpenRemarkModal = () => {
        const { eventId, range } = form.getFieldsValue();
        const [startDate, endDate] = range || [];

        if (!eventId || !startDate || !endDate) {
            message.error(t("required.export"));
            return;
        }

        setIsModalOpen(true);
    };

    const handleCancelRemarkModal = () => {
        setIsModalOpen(false);
        setRemark('');
    };

    const handleConfirmRemark = async () => {
        const { eventId, range } = form.getFieldsValue();
        const [startDate, endDate] = range || [];

        if (!eventId || !startDate || !endDate) {
            message.error(t("required.export"));
            return;
        }

        try {
            setLoading(true);
            const response = await downloadSummaryFinanceDocument({
                values: {
                    id: eventId,
                    startDate: startDate?.startOf("day").toISOString(),
                    endDate: endDate?.endOf("day").toISOString(),
                    remark: remark
                }
            });
            globalThis.open(response.url, "_blank");

        } catch (error) {
            console.error("Error Finance Summary Document", error);
        } finally {
            setLoading(false);
            setIsModalOpen(false);
            setRemark('');
        }
    };

    return (
        <div className="md:max-w-screen-lg xl:max-w-screen-xl mx-auto">
            <CommonForm
                form={form}
                name="finance-summary-report"
                layout="vertical"
                onFinish={handleFilter}
                autoComplete="off"
            >
                <Row gutter={[16, 16]} align="top">
                    <Col xs={24} md={24}>
                        <div className="text-xl font-semibold opacity-60 mb-4">
                            {t("back.report.financeSummary.title")}
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
                                    label={t("back.report.financeSummary.labels.organizer")}
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
                                label={t("back.report.financeSummary.labels.event")}
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
                                label={t("back.report.financeSummary.labels.range")}
                                type="range"
                                format={SYS_DATE_FORMAT}
                                required
                            />
                        </CommonForm.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <CommonForm.Item>
                            <Space size="middle">
                                <Popover content={t("back.report.financeSummary.popover.filter")}>
                                    <Button
                                        icon={<SearchOutlined />}
                                        size="large"
                                        type="primary"
                                        htmlType="submit"
                                    >
                                    </Button>
                                </Popover>
                                <Popover content={t("back.report.financeSummary.popover.export")}>
                                    <Button
                                        icon={<DownloadOutlined />}
                                        size="large"
                                        color="primary"
                                        variant="outlined"
                                        onClick={handleDownload}
                                        loading={loading}
                                    >
                                    </Button>
                                </Popover>
                                <Popover content={t("back.report.financeSummary.popover.clear")}>
                                    <Button
                                        icon={<ClearOutlined />}
                                        size="large"
                                        onClick={handleClear}
                                        danger
                                    >
                                    </Button>
                                </Popover>
                                {roleUser === "admin" && (
                                    <Popover content={t("back.report.financeSummary.popover.createReceipt")}>
                                        <Button
                                            icon={<FileAddOutlined />}
                                            color="primary"
                                            size="large"
                                            variant="outlined"
                                            onClick={handleOpenRemarkModal}>
                                        </Button>
                                    </Popover>
                                )}
                            </Space>
                        </CommonForm.Item>
                    </Col>
                </Row>
            </CommonForm>
            <Spin spinning={isLoadingData}>
                <Table
                    rowKey={(record) => `${record.eventTypeName}-${record.registrationFee}`}
                    columns={columns.map(column => ({
                        ...column,
                        ...(column.search && getColumnSearchProps(column.dataIndex))
                    }))}
                    dataSource={data}
                    bordered
                    pagination={false}
                    scroll={{ x: true }}
                    onChange={handleChange}
                />
                <div style={{ marginTop: 24 }}>
                    <Typography.Title level={5}>{t("back.report.financeSummary.summaryTitle")}</Typography.Title>

                    <div style={{ maxWidth: 500, marginTop: 15 }}>
                        {renderRowSummary("totalAmount", dataSummary.totalAmount)}
                        {renderRowSummary("totalDiscountCoupon", dataSummary.totalDiscountCoupon)}
                        {renderRowSummary("totalDiscountShirt", dataSummary.totalDiscountShirt)}
                        {renderRowSummary("totalShippingFee", dataSummary.totalShippingFee)}
                        {renderRowSummary("totalNetAmount", dataSummary.totalNetAmount)}
                        {roleUser === "admin" && (
                            <>
                                {renderRowSummary("totalServiceFee", dataSummary.totalServiceFee)}
                                {renderRowSummary("totalAmountWithFee", dataSummary.totalAmountWithFee)}
                            </>
                        )}
                    </div>
                </div>
            </Spin>
            <Modal
                title={t("back.report.financeSummary.modal.title")}
                open={isModalOpen}
                onOk={handleConfirmRemark}
                onCancel={handleCancelRemarkModal}
                okText={t("back.report.financeSummary.createReceipt")}
                cancelText={t("general.cancelConfirm")}
                confirmLoading={loading}
            >
                <CommonForm layout="vertical">
                    <CommonForm.Item
                        label={t("back.report.financeSummary.modal.labels.remark")}
                    >
                        <Input.TextArea
                            rows={4}
                            autoFocus
                            placeholder={t("back.report.financeSummary.modal.placeholders.remark")}
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                        />
                    </CommonForm.Item>
                </CommonForm>
            </Modal>
        </div>
    );
};

export default FinanceSummary;

