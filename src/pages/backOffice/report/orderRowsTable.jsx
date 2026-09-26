import React from "react";
import { Table } from "antd";
import { useTranslation } from "react-i18next";
import { DateCell, StatusTag } from "./parts";
import { moneyColumn } from "./columns";
import { methodLabel } from "./format";

/**
 * One row per participant (the registrant report and the revenue-detail report share this).
 * Related fields sit together in one cell (name + distance, order no + transaction id,
 * status + payment method) so the table reads left to right without a horizontal hunt.
 * Sorting and paging are server-side: `onChange` receives antd's (pagination, filters, sorter).
 */
export default function OrderRowsTable({
  rows,
  total,
  page,
  pageSize,
  loading,
  onChange,
  showStatus = true,
  showFee = false,
}) {
  const { t } = useTranslation();
  const c = (k) => t(`back.report.ui.orderColumns.${k}`);

  const columns = [
    {
      title: c("no"),
      key: "no",
      width: 56,
      align: "center",
      render: (_v, _r, i) => <span className="text-[#6e6e73] tabular-nums">{(page - 1) * pageSize + i + 1}</span>,
    },
    {
      title: c("registrant"),
      dataIndex: "fullName",
      key: "fullName",
      sorter: true,
      fixed: "left",
      width: 200,
      render: (v, r) => (
        <span className="inline-flex flex-col leading-tight">
          <span className="font-semibold text-[#1d1d1f]">{v || "–"}</span>
          <span className="text-[11px] text-[#6e6e73]">{r.eventTypeName || "–"}</span>
        </span>
      ),
    },
    {
      title: c("order"),
      dataIndex: "orderId",
      key: "orderId",
      sorter: true,
      width: 170,
      render: (v, r) => (
        <span className="inline-flex flex-col leading-tight">
          <span className="font-mono text-[12px] text-[#1d1d1f]">{v || "–"}</span>
          <span className="font-mono text-[11px] text-[#6e6e73]">{r.transactionId || "–"}</span>
        </span>
      ),
    },
    showStatus
      ? {
        title: c("status"),
        dataIndex: "paymentStatus",
        key: "paymentStatus",
        sorter: true,
        width: 130,
        render: (v, r) => (
          <span className="inline-flex flex-col items-start gap-1 leading-tight">
            <StatusTag status={v} />
            <span className="text-[11px] text-[#6e6e73]">{methodLabel(r.paymentMethod)}</span>
          </span>
        ),
      }
      : {
        title: c("method"),
        dataIndex: "paymentMethod",
        key: "paymentMethod",
        sorter: true,
        width: 120,
        render: (v) => methodLabel(v),
      },
    { title: c("registeredAt"), dataIndex: "registrationDateTime", key: "registrationDateTime", sorter: true, width: 110, render: (v) => <DateCell value={v} /> },
    { title: c("paidAt"), dataIndex: "paymentDateTime", key: "paymentDateTime", sorter: true, width: 110, render: (v) => <DateCell value={v} /> },
    moneyColumn({ title: c("registration"), dataIndex: "registrationFee", width: 110 }),
    moneyColumn({ title: c("coupon"), dataIndex: "discountCoupon", sign: "-", width: 110 }),
    moneyColumn({ title: c("shirt"), dataIndex: "discountShirt", sign: "-", width: 120 }),
    moneyColumn({ title: c("shipping"), dataIndex: "shippingFee", width: 100 }),
    moneyColumn({ title: c("addOn"), dataIndex: "addOnTotal", width: 110 }),
    // The totals stay pinned on the right while the middle columns scroll.
    moneyColumn({ title: c("net"), dataIndex: "totalAmount", strong: true, width: 120, fixed: "right", hint: t("back.report.ui.orderColumns.netHint") }),
    ...(showFee
      ? [
        moneyColumn({ title: c("fee"), dataIndex: "serviceFee", width: 110, fixed: "right", hint: t("back.report.ui.orderColumns.feeHint") }),
        moneyColumn({ title: c("withFee"), dataIndex: "totalAmountWithFee", strong: true, width: 140, fixed: "right", hint: t("back.report.ui.orderColumns.withFeeHint") }),
      ]
      : []),
  ];

  return (
    <Table
      className="bo-flush-table"
      size="middle"
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={rows}
      scroll={{ x: "max-content" }}
      onChange={onChange}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50", "100"],
        showTotal: (count, r) => t("back.shell.showing", { from: r[0], to: r[1], total: count }),
      }}
      locale={{ emptyText: t("back.report.ui.noRows") }}
    />
  );
}

