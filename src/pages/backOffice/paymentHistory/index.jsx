import React, { useEffect, useState } from "react";
import { Table, Button, Row, Col, Tag, Tooltip, Modal, message } from "antd";
import CommonForm from "components/commonForm";
import { SearchOutlined, EyeOutlined, RightOutlined, CalendarOutlined } from "@ant-design/icons";
import { useMediaQuery } from "react-responsive";
import { useSearchParams } from "react-router-dom";
import backOfficeServices from "services/backoffice.services";
import { handleQueryStatus } from "utils/index";
import { SYS_DATE_FORMAT, SYS_DATE_FULL_TIME_FORMAT } from "constants/helper";
import dayjs from "dayjs";
import FloatingLabel from "components/floatingLabel";
import { useTranslation } from "react-i18next";
import HistoryDetail from "./historyDetail";
import PageHeader from "components/pageHeader";

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
  // /historyList?order=<uuid> (from the "view my registration" button) opens that order directly.
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("order") ? "detail" : "list");
  const [paymentId, setPaymentId] = useState(searchParams.get("order"));
  // Phones get one card per order instead of a table that has to be scrolled sideways.
  const isPhone = useMediaQuery({ query: "(max-width: 767px)" });

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

  const confirmCancel = (record) => {
    Modal.confirm({
      title: t("back.history.historyList.cancel.confirmTitle"),
      content: t("back.history.historyList.cancel.confirmContent", { orderNo: record.orderNo }),
      okText: t("back.history.historyList.confirm.ok"),
      okButtonProps: { danger: true },
      cancelText: t("back.history.historyList.confirm.cancel"),
      onOk: () =>
        cancelOrderMutation.mutateAsync({ orderId: record.id, cancelledBy: "USER" }).then(
          () => {
            message.success(t("back.history.historyList.cancel.success", { orderNo: record.orderNo }));
            refetch();
          },
          () => message.error(t("back.history.historyList.cancel.failed"))
        ),
    });
  };

  const statusTag = (status) => {
    const normalized = status?.toUpperCase();
    const { color } = statusColors[normalized] || { color: "blue" };
    return (
      <Tag color={color} className="!m-0 !font-semibold">
        {t(`back.history.historyList.status.${normalized}`, { defaultValue: status })}
      </Tag>
    );
  };

  const money = (n) =>
    `${Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t("general.unitBaht")}`;

  const renderCard = (record) => {
    const pending = record.status?.toUpperCase() === "PENDING";
    return (
      <div key={record.id} className="rounded-2xl border border-[#e5e5ea] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          onClick={() => handleViewDetail(record.id)}
          className="w-full text-left cursor-pointer"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="m-0 font-semibold text-[15px] leading-snug text-[#1d1d1f] break-words min-w-0">
              {record.eventName || "-"}
            </p>
            {statusTag(record.status)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[13px] text-[#6e6e73]">
            <CalendarOutlined />
            {record.eventDate ? dayjs(record.eventDate).format(SYS_DATE_FORMAT) : "-"}
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 text-[12px] text-[#6e6e73]">{t("back.history.historyList.columns.orderNo")}</p>
              <p className="m-0 text-[13px] font-medium text-[#1d1d1f] tabular-nums break-all">{record.orderNo}</p>
              <p className="m-0 mt-1 text-[12px] text-[#6e6e73]">
                {t("back.history.historyList.columns.createdTime")}{" "}
                {record.createdTime ? dayjs(record.createdTime).format(SYS_DATE_FULL_TIME_FORMAT) : "-"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="m-0 text-[12px] text-[#6e6e73]">{t("back.history.historyList.columns.amount")}</p>
              <p className="m-0 text-[17px] font-bold text-[#1d1d1f] tabular-nums">{money(record.amount)}</p>
            </div>
          </div>
        </button>
        <div className="mt-3 pt-3 border-t border-[#f0f0f2] flex gap-2">
          {pending ? (
            <>
              <Button danger className="!h-10 flex-1" onClick={() => confirmCancel(record)}>
                {t("back.history.historyList.action.cancel")}
              </Button>
              <Button type="primary" className="!h-10 flex-[2]" onClick={() => handleViewDetail(record.id)}>
                {t("back.history.historyList.action.payNow")}
              </Button>
            </>
          ) : (
            <Button className="!h-10 w-full" onClick={() => handleViewDetail(record.id)}>
              {t("back.history.historyList.action.view")} <RightOutlined className="text-[11px]" />
            </Button>
          )}
        </div>
      </div>
    );
  };

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
      render: (amount) => money(amount),
    },
    {
      title: t("back.history.historyList.columns.status"),
      dataIndex: "status",
      key: "status",
      render: (status) => statusTag(status),
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
            <Button danger size="small" onClick={() => confirmCancel(record)}>
              {t("back.history.historyList.action.cancel")}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return mode === "list" ?
    <>
      <PageHeader menu="historyList" />
      <div className="bo-card overflow-hidden">
      <div className="px-4 md:px-5 pt-5 border-b border-[#e5e5ea]">
      <CommonForm
        form={form}
        name="finance-summary-report"
        layout="vertical"
        onFinish={handleSearch}
        autoComplete="off"
      >
        <Row gutter={[4, 4]}>
          <Col className="gutter-row" xs={24} md={16}>
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
          <Col className="gutter-row" xs={18} md={6}>
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
          <Col className="gutter-row" xs={6} md={2}>
            <Button size="large" className="w-full" type="primary" htmlType="submit">
              <span className="xl:hidden"><SearchOutlined /></span>
              <span className="hidden xl:inline">{t("back.history.historyList.filters.search")}</span>
            </Button>
          </Col>
        </Row>
      </CommonForm>
      </div>

      {isPhone ? (
        <div className="p-3 flex flex-col gap-3 bg-[#f5f5f7]">
          {isFetching && data.length === 0 && (
            <div className="py-10 text-center text-[#6e6e73]">{t("general.loading", { defaultValue: "กำลังโหลด..." })}</div>
          )}
          {!isFetching && data.length === 0 && (
            <div className="py-10 text-center text-[#6e6e73]">{t("back.history.historyList.empty")}</div>
          )}
          {data.map(renderCard)}
          {totalData > data.length && (
            <Button className="!h-11" loading={isFetching} onClick={() => setLimitPage((n) => n + 10)}>
              {t("back.history.historyList.loadMore")}
            </Button>
          )}
        </div>
      ) : (
      <Table
        rowKey="id"
        className="!w-full !text-nowrap bo-flush-table"
        dataSource={data}
        columns={columns}
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
      )}
      </div>
    </>
    : <HistoryDetail paymentId={paymentId} setMode={setMode} />
};

export default HistoryList;
