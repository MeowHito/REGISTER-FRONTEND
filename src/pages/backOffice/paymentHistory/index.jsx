import React, { useEffect, useState } from "react";
import { Table, Button, Row, Col, Tag, Tooltip, Modal, message } from "antd";
import CommonForm from "components/commonForm";
import { SearchOutlined, EyeOutlined } from "@ant-design/icons";
import backOfficeServices from "services/backoffice.services";
import { handleQueryStatus } from "utils/index";
import { SYS_DATE_FORMAT, SYS_DATE_FULL_TIME_FORMAT } from "constants/helper";
import dayjs from "dayjs";
import FloatingLabel from "components/floatingLabel";
import { useTranslation } from "react-i18next";
import HistoryDetail from "./historyDetail";

const statusColors = {
  PENDING: { color: "#faad14", label: "รอดำเนินการ" },
  CANCELLED: { color: "#ff4d4f", label: "ยกเลิกโดยผู้ใช้" },
  FAILED: { color: "#ff4d4f", label: "ล้มเหลว" },
  SUCCESS: { color: "#52c41a", label: "ดำเนินการสำเร็จ" },
  REVIEW: { color: "#fa8c16", label: "รอตรวจสอบ" },
};

const HistoryList = () => {
  const { t } = useTranslation();
  const [form] = CommonForm.useForm();
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({});
  const [limitPage, setLimitPage] = useState(10);
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [mode, setMode] = useState("list");
  const [paymentId, setPaymentId] = useState(null);

  const { data: payments, refetch, isFetching, ...other } = backOfficeServices.useQueryGetAllPaymentHistory({
    params: filters,
    paging: {
      page: page - 1,
      size: limitPage,
    }
  });

  useEffect(() => {
    handleQueryStatus(other, () => {
      if (payments?.content?.length > 0) {
        setData(payments?.content);
        setTotalData(payments?.totalElements);
      } else {
        setData([])
        setTotalData(0);
      }
    })
  }, [other.fetchStatus])

  const cancelOrderMutation = backOfficeServices.useMutationCancelOrder();

  const handleSearch = (values) => {
    const { q, status } = values;

    const isSameFilter =
      q === filters?.q &&
      status === filters?.status;

    if (isSameFilter) {
      refetch();
    } else {
      setFilters({ q, status });
      setPage(1);
    }
  };

  const handleViewDetail = (paymentId) => {
    setPaymentId(paymentId)
    setMode("detail")
  }

  const columns = [
    {
      title: t("back.history.historyList.columns.orderNo"),
      dataIndex: "orderNo",
      key: "orderNo",
    },
    {
      title: t("back.history.historyList.columns.eventName"),
      dataIndex: "eventName",
      key: "eventName",
    },
    {
      title: t("back.history.historyList.columns.eventDate"),
      dataIndex: "eventDate",
      key: "eventDate",
      render: (date) => date ? dayjs(date).format(SYS_DATE_FORMAT) : "",
    },
    {
      title: t("back.history.historyList.columns.createdTime"),
      dataIndex: "createdTime",
      key: "createdTime",
      render: (date) => date ? dayjs(date).format(SYS_DATE_FULL_TIME_FORMAT) : "",
    },
    {
      title: t("back.history.historyList.columns.amount"),
      dataIndex: "amount",
      key: "amount",
    },
    {
      title: t("back.history.historyList.columns.status"),
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const normalized = status?.toUpperCase();
        const { color } = statusColors[normalized] || { color: "blue" };
        const label = t(`back.history.historyList.status.${normalized}`) || status;
        return (
          <Tag color={color} style={{ fontWeight: "bold" }}>{label}</Tag>
        );
      },
    },
    {
      title: t("back.history.historyList.columns.action"),
      key: "action",
      fixed: 'right',
      render: (_, record) => (
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          <Tooltip title={t("back.history.historyList.action.viewTooltip")}>
            <Button icon={<EyeOutlined />} onClick={() => { handleViewDetail(record.id) }} size="small">{t("back.history.historyList.action.view")}</Button>
          </Tooltip>
          {record.status === "PENDING" && (
            <Button
              danger
              size="small"
              onClick={() => {
                Modal.confirm({
                  title: t("back.history.historyList.cancel.confirmTitle"),
                  content: t("back.history.historyList.cancel.confirmContent", { orderNo: record.orderNo }),
                  okText: t("back.history.historyList.confirm.ok"),
                  cancelText: t("back.history.historyList.confirm.cancel"),
                  onOk: () => {
                    cancelOrderMutation.mutate(
                      {
                        orderId: record.id,
                        cancelledBy: "USER",
                      },
                      {
                        onSuccess: () => {
                          message.success(t("back.history.historyList.cancel.success", { orderNo: record.orderNo }));
                          refetch();
                        },
                        onError: () => {
                          message.error(t("back.history.historyList.cancel.failed"));
                        },
                      }
                    );
                  },
                });
              }}
            >
              {t("back.history.historyList.action.cancel")}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return mode === "list" ?
    <>
      <CommonForm
        form={form}
        name="finance-summary-report"
        layout="vertical"
        onFinish={handleSearch}
        autoComplete="off"
      >
        <Row gutter={[4, 4]}>
          <Col className="gutter-row" xs={12} md={16}>
            <CommonForm.Item
              name="q"
            >
              <FloatingLabel
                label={t("back.history.historyList.filters.orderOrEventLabel")}
                placeholder={t("back.history.historyList.filters.orderOrEventPlaceholder")}
                type="text"
                allowClear
              />
            </CommonForm.Item>
          </Col>
          <Col className="gutter-row" xs={10} md={6}>
            <CommonForm.Item
              name="status"
            >
              <FloatingLabel
                label={t("back.history.historyList.filters.status")}
                type="select"
                options={[
                  { value: "PENDING", label: t("back.history.historyList.status.PENDING") },
                  { value: "SUCCESS", label: t("back.history.historyList.status.SUCCESS") },
                  { value: "FAILED", label: t("back.history.historyList.status.FAILED") },
                  { value: "CANCELLED", label: t("back.history.historyList.status.CANCELLED") },
                  { value: "REVIEW", label: t("back.history.historyList.status.REVIEW") },
                ]}
                allowClear
              />
            </CommonForm.Item>
          </Col>
          <Col className="gutter-row" xs={2}>
            <Button size="large" className="w-full" type="primary" htmlType="submit">
              <span className="xl:hidden"><SearchOutlined /></span>
              <span className="hidden xl:inline">{t("back.history.historyList.filters.search")}</span>
            </Button>
          </Col>
        </Row>
      </CommonForm>

      <Table
        rowKey="id"
        className="!w-full !text-nowrap"
        dataSource={data}
        columns={columns}
        bordered
        pagination={{
          pageSize: limitPage,
          current: page,
          onChange: (page, pageSize) => {
            setPage(page);
            setLimitPage(pageSize);
          },
          total: totalData,
          pageSizeOptions: ["10", "20", "50", "100"],
          showSizeChanger: true
        }}
        scroll={{ x: true }}
        loading={isFetching}
      />
    </>
    : <HistoryDetail paymentId={paymentId} setMode={setMode} />
};

export default HistoryList;
