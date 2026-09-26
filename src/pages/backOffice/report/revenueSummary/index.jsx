import React, { useMemo, useState } from "react";
import { Button, Table } from "antd";
import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import backOfficeServices from "services/backoffice.services";
import fileService from "services/file.services";
import { EmptyNote, Money, Panel, ReportHeader, Stat } from "../parts";
import { moneyColumn } from "../columns";
import { fmtInt, fmtMoney, methodLabel, num } from "../format";

/**
 * Admin only: what every event took in during the period, one row per event × payment
 * method (the backend computes the whole list in memory, so it is fetched unpaged and totalled
 * here). Rows of the same event share one event cell so the grouping is visible at a glance.
 */
export default function RevenueSummary({ filters }) {
  const { t } = useTranslation();
  const tr = (k, o) => t(`back.report.ui.revenue.${k}`, o);
  const { startDate, endDate, periodText } = filters;
  const ready = !!(startDate && endDate);

  const { data, isFetching, refetch } = backOfficeServices.useQueryGetRevenueSummary({
    startDate: ready ? startDate : undefined,
    endDate: ready ? endDate : undefined,
    paging: { page: 0, size: 2000 },
  });

  // Sorted by contract then event so each event's rows are contiguous; `span` marks the first
  // row of a group with the group's size (rowSpan) and the rest with 0.
  const rows = useMemo(() => {
    const list = [...(data?.content || [])].sort((a, b) =>
      String(a.contractNo || "").localeCompare(String(b.contractNo || ""), "th")
      || String(a.eventName || "").localeCompare(String(b.eventName || ""), "th")
      || String(a.paymentMethod || "").localeCompare(String(b.paymentMethod || "")));
    const out = [];
    for (let i = 0; i < list.length; i += 1) {
      const key = `${list[i].contractNo}|${list[i].eventName}`;
      let span = 0;
      if (i === 0 || key !== `${list[i - 1].contractNo}|${list[i - 1].eventName}`) {
        span = 1;
        while (i + span < list.length && `${list[i + span].contractNo}|${list[i + span].eventName}` === key) span += 1;
      }
      out.push({ ...list[i], key: `${key}|${list[i].paymentMethod}|${i}`, span });
    }
    return out;
  }, [data]);

  const totals = useMemo(() => rows.reduce((acc, r) => ({
    registrationFee: acc.registrationFee + num(r.registrationFee),
    addOnTotal: acc.addOnTotal + num(r.addOnTotal),
    serviceFee: acc.serviceFee + num(r.serviceFee),
    total: acc.total + num(r.total),
    shippingFee: acc.shippingFee + num(r.shippingFee),
    totalWithShipping: acc.totalWithShipping + num(r.totalWithShipping),
  }), { registrationFee: 0, addOnTotal: 0, serviceFee: 0, total: 0, shippingFee: 0, totalWithShipping: 0 }), [rows]);
  const eventCount = rows.filter((r) => r.span > 0).length;

  const [exporting, setExporting] = useState(false);
  const { mutateAsync: downloadExcel } = fileService.useMutationDownloadSummaryRevenueExcel();
  const handleExcel = async () => {
    try {
      setExporting(true);
      await downloadExcel({ startDate, endDate });
    } catch (error) {
      console.error("Error Revenue Summary Excel", error);
    } finally {
      setExporting(false);
    }
  };

  const groupCell = (r) => ({ rowSpan: r.span });
  const c = (k) => tr(`columns.${k}`);
  const columns = [
    { title: c("contractNo"), dataIndex: "contractNo", key: "contractNo", width: 120, onCell: groupCell, render: (v) => <span className="font-mono text-[12px]">{v || "–"}</span> },
    { title: c("event"), dataIndex: "eventName", key: "eventName", width: 260, onCell: groupCell, render: (v) => <span className="font-semibold text-[#1d1d1f]">{v}</span> },
    { title: c("method"), dataIndex: "paymentMethod", key: "paymentMethod", width: 130, render: (v) => methodLabel(v) },
    moneyColumn({ title: c("registration"), dataIndex: "registrationFee", width: 130 }),
    moneyColumn({ title: c("addOn"), dataIndex: "addOnTotal", width: 120 }),
    moneyColumn({ title: c("fee"), dataIndex: "serviceFee", width: 130, hint: tr("feeHint") }),
    moneyColumn({ title: c("subtotal"), dataIndex: "total", width: 140, hint: tr("subtotalHint") }),
    moneyColumn({ title: c("shipping"), dataIndex: "shippingFee", width: 110 }),
    moneyColumn({ title: c("total"), dataIndex: "totalWithShipping", strong: true, width: 150 }),
  ];

  return (
    <div className="flex flex-col">
      <ReportHeader
        title={tr("title")}
        description={ready ? `${tr("desc")} · ${periodText}` : tr("desc")}
        extra={(
          <>
            <Button icon={<ReloadOutlined />} disabled={!ready} loading={isFetching} onClick={() => refetch()}>{t("back.report.ui.actions.refresh")}</Button>
            <Button type="primary" icon={<DownloadOutlined />} disabled={!ready} loading={exporting} onClick={handleExcel}>{t("back.report.ui.actions.excel")}</Button>
          </>
        )}
      />
      {!ready ? (
        <EmptyNote text={t("back.report.ui.needPeriod")} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            <Stat label={tr("stat.events")} value={fmtInt(eventCount)} sub={tr("stat.rows", { count: fmtInt(rows.length) })} loading={isFetching} />
            <Stat label={tr("stat.registration")} value={fmtMoney(totals.registrationFee)} loading={isFetching} />
            <Stat label={tr("stat.addOn")} value={fmtMoney(totals.addOnTotal)} loading={isFetching} />
            <Stat label={tr("stat.fee")} value={fmtMoney(totals.serviceFee)} tone="green" sub={tr("feeHint")} loading={isFetching} />
            <Stat label={tr("stat.shipping")} value={fmtMoney(totals.shippingFee)} loading={isFetching} />
            <Stat label={tr("stat.total")} value={fmtMoney(totals.totalWithShipping)} tone="blue" sub={tr("stat.totalSub")} loading={isFetching} />
          </div>
          <Panel title={tr("table")} description={tr("tableDesc")}>
            <Table
              className="bo-flush-table"
              size="middle"
              rowKey="key"
              loading={isFetching}
              columns={columns}
              dataSource={rows}
              pagination={false}
              scroll={{ x: "max-content" }}
              locale={{ emptyText: t("back.report.ui.noRows") }}
              summary={() => (rows.length ? (
                <Table.Summary fixed>
                  <Table.Summary.Row className="bg-[#fbfbfd]">
                    <Table.Summary.Cell index={0} colSpan={3} className="font-semibold">{tr("sum")}</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right"><Money value={totals.registrationFee} strong /></Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right"><Money value={totals.addOnTotal} strong /></Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right"><Money value={totals.serviceFee} strong /></Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right"><Money value={totals.total} strong /></Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="right"><Money value={totals.shippingFee} strong /></Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right"><Money value={totals.totalWithShipping} strong /></Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              ) : null)}
            />
          </Panel>
        </>
      )}
    </div>
  );
}
