import React, { useEffect, useState } from "react";
import { Button } from "antd";
import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import backOfficeServices from "services/backoffice.services";
import fileService from "services/file.services";
import OrderRowsTable from "../orderRowsTable";
import { EmptyNote, Panel, ReportHeader, SearchBar } from "../parts";
import { fmtInt } from "../format";

/** Admin only: paid participants of the event in the period, with Action's fee on every row. */
export default function RevenueDetailSummary({ filters }) {
  const { t } = useTranslation();
  const tr = (k, o) => t(`back.report.ui.revenueDetail.${k}`, o);
  const { eventId, event, startDate, endDate, periodText } = filters;
  const ready = !!(eventId && startDate && endDate);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState({ field: undefined, order: undefined });
  const [search, setSearch] = useState({ field: "fullName", text: "" });
  useEffect(() => setPage(1), [eventId, startDate, endDate, search]);

  const { data, isFetching, refetch } = backOfficeServices.useQueryGetRevenueDetailSummary({
    id: ready ? eventId : undefined,
    startDate,
    endDate,
    paging: {
      page: page - 1,
      size: pageSize,
      sortField: sort.field,
      sortDirection: sort.order,
      searchField: search.text ? search.field : undefined,
      searchText: search.text || undefined,
    },
  });
  const rows = data?.content || [];
  const total = data?.totalElements || 0;

  const [exporting, setExporting] = useState(false);
  const { mutateAsync: downloadExcel } = fileService.useMutationDownloadSummaryRevenueDetailExcel();
  const handleExcel = async () => {
    try {
      setExporting(true);
      await downloadExcel({ id: eventId, startDate, endDate });
    } catch (error) {
      console.error("Error Revenue Detail Excel", error);
    } finally {
      setExporting(false);
    }
  };

  const handleTableChange = (pagination, _filters, sorter) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
    setSort({ field: sorter.order ? sorter.field : undefined, order: sorter.order === "descend" ? "desc" : sorter.order ? "asc" : undefined });
  };

  const searchFields = ["fullName", "orderId", "transactionId", "eventTypeName", "paymentMethod"]
    .map((value) => ({ value, label: t(`back.report.ui.searchFields.${value}`) }));

  return (
    <div className="flex flex-col">
      <ReportHeader
        title={event ? `${tr("title")} · ${event.name}` : tr("title")}
        description={ready ? `${tr("desc")} · ${periodText}` : tr("desc")}
        extra={(
          <>
            <Button icon={<ReloadOutlined />} disabled={!ready} loading={isFetching} onClick={() => refetch()}>{t("back.report.ui.actions.refresh")}</Button>
            <Button type="primary" icon={<DownloadOutlined />} disabled={!ready} loading={exporting} onClick={handleExcel}>{t("back.report.ui.actions.excel")}</Button>
          </>
        )}
      />
      {!ready ? (
        <EmptyNote text={t("back.report.ui.needEvent")} />
      ) : (
        <Panel
          title={t("back.report.ui.found", { count: fmtInt(total) })}
          description={tr("hint")}
          extra={<SearchBar fields={searchFields} onSearch={setSearch} loading={isFetching} />}
        >
          <OrderRowsTable rows={rows} total={total} page={page} pageSize={pageSize} loading={isFetching} onChange={handleTableChange} showStatus={false} showFee />
        </Panel>
      )}
    </div>
  );
}
