import React, { useState } from "react";
import { Button, Input, Modal, Table, Tooltip } from "antd";
import { DownloadOutlined, FileTextOutlined, ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import backOfficeServices from "services/backoffice.services";
import fileService from "services/file.services";
import { EmptyNote, Money, Panel, Receipt, ReportHeader, Stat } from "../parts";
import { moneyColumn } from "../columns";
import { fmtInt, fmtMoney, num, pct } from "../format";

/**
 * Per-event money summary for the selected period: headline tiles, registrations by
 * distance / price, add-on sales, and a receipt-style walk from registration fees down to the
 * final total. Admin can also export Excel and generate the hand-over (ใบส่งมอบเงิน) PDF.
 */
export default function FinanceSummary({ filters }) {
  const { t } = useTranslation();
  const tr = (k, o) => t(`back.report.ui.finance.${k}`, o);
  const { isAdmin, eventId, event, startDate, endDate, periodText } = filters;
  const ready = !!(eventId && startDate && endDate);

  const { data, isFetching, refetch } = backOfficeServices.useQueryGetFinanceSummary({
    id: ready ? eventId : undefined,
    startDate,
    endDate,
    paging: {},
  });
  const { data: addOns, isFetching: fetchingAddOns, refetch: refetchAddOns } = backOfficeServices.useQueryGetFinanceAddOnSummary({
    id: ready ? eventId : undefined,
    startDate,
    endDate,
  });

  const rows = data?.content?.content || [];
  const sum = data?.summary || {};
  const registrationTotal = rows.reduce((s, r) => s + num(r.total), 0);
  const qtyTotal = rows.reduce((s, r) => s + num(r.qty), 0);
  const addOnRows = addOns || [];
  const addOnTotal = addOnRows.reduce((s, r) => s + num(r.total), 0);
  const discountTotal = num(sum.totalDiscountCoupon) + num(sum.totalDiscountShirt);
  const loading = isFetching || fetchingAddOns;

  // ---- exports ----
  const [exporting, setExporting] = useState(false);
  const { mutateAsync: downloadExcel } = fileService.useMutationDownloadSummaryFinanceExcel();
  const { mutateAsync: downloadDocument } = fileService.useMutationSummaryFinanceDocument();
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [remark, setRemark] = useState("");
  const [creating, setCreating] = useState(false);

  const handleExcel = async () => {
    try {
      setExporting(true);
      await downloadExcel({ id: eventId, startDate, endDate });
    } catch (error) {
      console.error("Error Finance Summary Excel", error);
    } finally {
      setExporting(false);
    }
  };

  const handleCreateDocument = async () => {
    try {
      setCreating(true);
      const response = await downloadDocument({ values: { id: eventId, startDate, endDate, remark } });
      if (response?.url) globalThis.open(response.url, "_blank");
    } catch (error) {
      console.error("Error Finance Summary Document", error);
    } finally {
      setCreating(false);
      setRemarkOpen(false);
      setRemark("");
    }
  };

  // ---- tables ----
  const c = (k) => tr(`columns.${k}`);
  const typeColumns = [
    { title: t("back.report.financeSummary.columns.no"), key: "no", width: 56, align: "center", render: (_v, _r, i) => <span className="text-[#6e6e73] tabular-nums">{i + 1}</span> },
    { title: c("type"), dataIndex: "eventTypeName", key: "eventTypeName", render: (v) => <span className="font-semibold text-[#1d1d1f]">{v}</span> },
    moneyColumn({ title: c("price"), dataIndex: "registrationFee", width: 130 }),
    { title: c("qty"), dataIndex: "qty", key: "qty", align: "right", width: 110, render: (v) => <span className="tabular-nums">{fmtInt(v)}</span> },
    moneyColumn({ title: c("total"), dataIndex: "total", strong: true, width: 150 }),
    {
      title: c("share"),
      key: "share",
      width: 150,
      render: (_v, r) => {
        const p = pct(r.total, registrationTotal);
        return (
          <span className="flex items-center gap-2">
            <span className="flex-1 h-1.5 rounded-full bg-[#ececf0] overflow-hidden">
              <span className="block h-full rounded-full bg-[#2a78d6]" style={{ width: `${p}%` }} />
            </span>
            <span className="w-9 text-right text-[12px] tabular-nums text-[#424245]">{p}%</span>
          </span>
        );
      },
    },
  ];

  const addOnColumns = [
    { title: t("back.report.financeSummary.columns.no"), key: "no", width: 56, align: "center", render: (_v, _r, i) => <span className="text-[#6e6e73] tabular-nums">{i + 1}</span> },
    { title: tr("addOnColumns.name"), dataIndex: "eventTypeName", key: "eventTypeName", render: (v) => <span className="font-semibold text-[#1d1d1f]">{v}</span> },
    moneyColumn({ title: tr("addOnColumns.unitPrice"), dataIndex: "registrationFee", width: 130 }),
    { title: tr("addOnColumns.qty"), dataIndex: "qty", key: "qty", align: "right", width: 110, render: (v) => <span className="tabular-nums">{fmtInt(v)}</span> },
    moneyColumn({ title: tr("addOnColumns.total"), dataIndex: "total", strong: true, width: 150 }),
  ];

  // Footer row: label spans No / name / price, then the qty and money totals (and a blank share cell).
  const totalRow = (label, qty, total, hasShare) => (
    <Table.Summary fixed>
      <Table.Summary.Row className="bg-[#fbfbfd]">
        <Table.Summary.Cell index={0} colSpan={3} className="font-semibold">{label}</Table.Summary.Cell>
        <Table.Summary.Cell index={1} align="right" className="font-semibold tabular-nums">{fmtInt(qty)}</Table.Summary.Cell>
        <Table.Summary.Cell index={2} align="right"><Money value={total} strong /></Table.Summary.Cell>
        {hasShare && <Table.Summary.Cell index={3} />}
      </Table.Summary.Row>
    </Table.Summary>
  );

  const receiptLines = [
    { key: "registration", label: tr("lines.registration"), value: sum.totalAmount, op: "+" },
    { key: "coupon", label: tr("lines.coupon"), value: sum.totalDiscountCoupon, op: "-" },
    { key: "shirt", label: tr("lines.shirt"), value: sum.totalDiscountShirt, op: "-" },
    { key: "shipping", label: tr("lines.shipping"), value: sum.totalShippingFee, op: "+" },
    { key: "addOn", label: tr("lines.addOn"), value: sum.totalAddOn, op: "+" },
    { key: "net", label: tr("lines.net"), value: sum.totalNetAmount, op: "=" },
    ...(isAdmin
      ? [
        { key: "fee", label: tr("lines.fee"), value: sum.totalServiceFee, op: "+" },
        { key: "withFee", label: tr("lines.withFee"), value: sum.totalAmountWithFee, op: "=" },
      ]
      : []),
  ];

  const actions = (
    <>
      <Button icon={<ReloadOutlined />} disabled={!ready} loading={loading} onClick={() => { refetch(); refetchAddOns(); }}>
        {t("back.report.ui.actions.refresh")}
      </Button>
      <Button icon={<DownloadOutlined />} disabled={!ready} loading={exporting} onClick={handleExcel}>
        {t("back.report.ui.actions.excel")}
      </Button>
      {isAdmin && (
        <Tooltip title={tr("receiptTip")}>
          <Button type="primary" icon={<FileTextOutlined />} disabled={!ready} onClick={() => setRemarkOpen(true)}>
            {t("back.report.ui.actions.receipt")}
          </Button>
        </Tooltip>
      )}
    </>
  );

  return (
    <div className="flex flex-col">
      <ReportHeader
        title={event ? `${tr("title")} · ${event.name}` : tr("title")}
        description={ready ? `${tr("desc")} · ${periodText}` : tr("desc")}
        extra={actions}
      />

      {!ready ? (
        <EmptyNote text={t("back.report.ui.needEvent")} />
      ) : (
        <>
          <div className={`grid grid-cols-2 md:grid-cols-3 ${isAdmin ? "xl:grid-cols-7" : "xl:grid-cols-5"}`}>
            <Stat label={tr("stat.registration")} value={fmtMoney(sum.totalAmount)} sub={tr("stat.people", { count: fmtInt(qtyTotal) })} loading={loading} />
            <Stat label={tr("stat.discount")} value={discountTotal ? `−${fmtMoney(discountTotal)}` : fmtMoney(0)} tone={discountTotal ? "red" : "gray"} sub={tr("stat.discountSub", { coupon: fmtMoney(sum.totalDiscountCoupon), shirt: fmtMoney(sum.totalDiscountShirt) })} loading={loading} />
            <Stat label={tr("stat.shipping")} value={fmtMoney(sum.totalShippingFee)} loading={loading} />
            <Stat label={tr("stat.addOn")} value={fmtMoney(sum.totalAddOn)} sub={addOnRows.length ? tr("stat.addOnSub", { count: addOnRows.length }) : undefined} loading={loading} />
            <Stat label={tr("stat.net")} value={fmtMoney(sum.totalNetAmount)} tone="blue" sub={tr("stat.netSub")} loading={loading} />
            {isAdmin && <Stat label={tr("stat.fee")} value={fmtMoney(sum.totalServiceFee)} loading={loading} />}
            {isAdmin && <Stat label={tr("stat.withFee")} value={fmtMoney(sum.totalAmountWithFee)} tone="green" sub={tr("stat.withFeeSub")} loading={loading} />}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12">
            <div className="xl:col-span-8 flex flex-col">
              <Panel title={tr("byType")} description={tr("byTypeDesc")}>
                <Table
                  className="bo-flush-table"
                  size="middle"
                  rowKey={(r) => `${r.eventTypeName}-${r.registrationFee}`}
                  loading={isFetching}
                  columns={typeColumns}
                  dataSource={rows}
                  pagination={false}
                  scroll={{ x: "max-content" }}
                  locale={{ emptyText: t("back.report.ui.noRows") }}
                  summary={() => (rows.length ? totalRow(tr("sum"), qtyTotal, registrationTotal, true) : null)}
                />
              </Panel>
              {addOnRows.length > 0 && (
                <Panel title={tr("addOns")} description={tr("addOnsDesc")}>
                  <Table
                    className="bo-flush-table"
                    size="middle"
                    rowKey={(r) => `${r.eventTypeName}-${r.registrationFee}`}
                    loading={fetchingAddOns}
                    columns={addOnColumns}
                    dataSource={addOnRows}
                    pagination={false}
                    scroll={{ x: "max-content" }}
                    summary={() => totalRow(tr("sum"), addOnRows.reduce((acc, r) => acc + num(r.qty), 0), addOnTotal, false)}
                  />
                </Panel>
              )}
            </div>

            <Panel className="xl:col-span-4" title={tr("receipt")} description={tr("receiptDesc")} bodyClassName="px-4 md:px-5 py-3">
              <Receipt lines={receiptLines} currency={t("back.report.financeSummary.currency")} />
              <p className="m-0 mt-3 text-[11px] leading-relaxed text-[#6e6e73]">
                {tr("countNote")}
                {isAdmin ? ` ${tr("feeNote")}` : ""}
              </p>
            </Panel>
          </div>
        </>
      )}

      <Modal
        title={t("back.report.financeSummary.modal.title")}
        open={remarkOpen}
        onOk={handleCreateDocument}
        onCancel={() => { setRemarkOpen(false); setRemark(""); }}
        okText={t("back.report.financeSummary.createReceipt")}
        cancelText={t("general.cancelConfirm")}
        confirmLoading={creating}
      >
        <p className="mt-0 mb-3 text-[13px] text-[#6e6e73]">
          {event?.name} · {periodText}
        </p>
        <Input.TextArea
          rows={4}
          autoFocus
          placeholder={t("back.report.financeSummary.modal.placeholders.remark")}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />
      </Modal>
    </div>
  );
}
