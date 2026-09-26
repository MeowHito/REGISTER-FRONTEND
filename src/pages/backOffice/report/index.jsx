import React from "react";
import { DatePicker, Segmented, Select, Tabs } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SYS_DATE_FORMAT, SYS_YEAR_MONTH_FORMAT } from "constants/helper";
import useReportFilters from "./useReportFilters";
import FinanceSummary from "./financeSummary";
import ParticipantSummary from "./participantSummary";
import RevenueSummary from "./revenueSummary";
import RevenueDetailSummary from "./revenueDetailSummary";

// Tabs are addressable (?tab=participants). The two revenue tabs are admin-only, like their APIs.
const TABS = [
  { key: "finance", Component: FinanceSummary, adminOnly: false, scope: "event" },
  { key: "participants", Component: ParticipantSummary, adminOnly: false, scope: "event" },
  { key: "revenue", Component: RevenueSummary, adminOnly: true, scope: "all" },
  { key: "revenueDetail", Component: RevenueDetailSummary, adminOnly: true, scope: "event" },
];

/**
 * Reports. One filter strip (event + period) drives every tab, so switching reports never
 * means re-entering the same event and dates; each tab explains what it counts in its header.
 */
export default function Report() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useReportFilters();
  const { isAdmin } = filters;

  const tabs = TABS.filter((tab) => isAdmin || !tab.adminOnly);
  const requested = searchParams.get("tab");
  const active = tabs.find((tab) => tab.key === requested) || tabs[0];
  const eventScoped = active.scope === "event";

  const presets = [
    { label: t("back.report.ui.filter.presets.last7"), value: [dayjs().subtract(6, "day"), dayjs()] },
    { label: t("back.report.ui.filter.presets.thisMonth"), value: [dayjs().startOf("month"), dayjs().endOf("month")] },
    { label: t("back.report.ui.filter.presets.lastMonth"), value: [dayjs().subtract(1, "month").startOf("month"), dayjs().subtract(1, "month").endOf("month")] },
    { label: t("back.report.ui.filter.presets.thisYear"), value: [dayjs().startOf("year"), dayjs()] },
  ];

  const field = (label, control) => (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6e6e73]">{label}</span>
      {control}
    </label>
  );

  return (
    <div className="flex flex-col">
      <div className="bo-card flex flex-wrap items-end gap-x-5 gap-y-3 px-4 md:px-5 py-3">
        {field(
          t("back.report.ui.filter.event"),
          eventScoped ? (
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={t("back.report.ui.filter.pickEvent")}
              loading={filters.loadingEvents}
              value={filters.eventId}
              onChange={filters.setEventId}
              options={filters.eventOptions}
              className="w-[min(100%,360px)] min-w-[240px]"
            />
          ) : (
            <span className="inline-flex items-center h-10 px-3 rounded-lg bg-[#ececf0] text-[13px] text-[#424245] min-w-[240px]">
              {t("back.report.ui.filter.allEvents")}
            </span>
          ),
        )}
        {field(
          t("back.report.ui.filter.period"),
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              value={filters.periodMode}
              onChange={filters.setPeriodMode}
              options={[
                { value: "month", label: t("back.report.ui.filter.byMonth") },
                { value: "custom", label: t("back.report.ui.filter.custom") },
              ]}
            />
            {filters.periodMode === "month" ? (
              <DatePicker
                picker="month"
                allowClear={false}
                format={SYS_YEAR_MONTH_FORMAT}
                value={filters.month}
                onChange={(v) => v && filters.setMonth(v)}
                suffixIcon={<CalendarOutlined />}
                className="w-[140px]"
              />
            ) : (
              <DatePicker.RangePicker
                format={SYS_DATE_FORMAT}
                value={filters.range}
                onChange={filters.setRange}
                presets={presets}
                placeholder={[t("back.report.ui.filter.from"), t("back.report.ui.filter.to")]}
                className="w-[280px]"
              />
            )}
          </div>,
        )}
        <div className="ml-auto self-center text-[12px] text-[#6e6e73]">
          {t("back.report.ui.filter.countedBy")}
        </div>
      </div>

      <Tabs
        className="bo-tabs"
        activeKey={active.key}
        onChange={(key) => setSearchParams({ tab: key }, { replace: true })}
        destroyOnHidden
        items={tabs.map((tab) => ({
          key: tab.key,
          label: t(`back.report.ui.tabs.${tab.key}`),
          children: <tab.Component filters={filters} />,
        }))}
      />
    </div>
  );
}
