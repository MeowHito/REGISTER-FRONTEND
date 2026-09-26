import React, { useEffect, useMemo, useState } from 'react'
import { Select, Tooltip } from 'antd';
import Chart from 'react-apexcharts';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import backOfficeServices from 'services/backoffice.services';
import useActiveEvent from 'hooks/useActiveEvent';
import useCountryStateHook from 'hooks/useCountryStateHook';
import { BarList, DistanceChips, DistanceList, Empty, Kpi, Legend, MiniSegmented, Panel, SplitBar } from './parts';
import { SERIES, STATUS_COLOR, barChart, baseChart, distanceColor, fmtBaht, fmtNumber, pct } from './chartTheme';

// Categorical order for shirt types past the first two (same validated order as SERIES).
const SHIRT_COLORS = [...SERIES, "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
const SIZE_ORDER = ["3XS", "2XS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL", "7XL", "FREESIZE"];
const SIZE_ALIASES = { XXXS: "3XS", XXS: "2XS", XXL: "2XL", XXXL: "3XL", XXXXL: "4XL", XXXXXL: "5XL", XXXXXXL: "6XL", XXXXXXXL: "7XL", "FREE SIZE": "FREESIZE" };
const normalizeSize = (s) => {
  const k = String(s ?? "").trim().toUpperCase();
  return SIZE_ALIASES[k] || k;
};
const sizeRank = (s) => {
  const i = SIZE_ORDER.indexOf(s);
  return i === -1 ? SIZE_ORDER.length : i;
};
const ageLower = (ag) => {
  const n = Number.parseInt(String(ag).split("-")[0], 10);
  return Number.isNaN(n) ? Infinity : n;
};
const lowerKeys = (obj) => Object.fromEntries(Object.entries(obj || {}).map(([k, v]) => [String(k).toLowerCase(), v]));

const METHOD_LABELS = { creditcard: "Credit Card", qrcode: "QR Code", ewallet: "eWallet", alipay: "Alipay", wechatpay: "WeChat Pay" };
const normalizeMethod = (m) => String(m ?? "").toLowerCase().replace(/[^a-z0-9]/g, "") || "unknown";
const normalizeStatus = (s) => {
  const k = String(s ?? "").toLowerCase().trim();
  if (k === "success") return "success";
  if (k === "pending") return "pending";
  return "failed";
};
const REASON_KEYS = { FAILED: "failed", CANCELED: "cancelled", CANCELLED: "cancelled", EXPIRED: "expired" };

/**
 * One-screen dashboard for the starred event (or one picked here when nothing is starred).
 * From xl up the page is exactly one viewport tall; panels shrink to fit instead of scrolling.
 * Same two endpoints the old overview / registration tabs used.
 */
export default function EventStats() {
  const { t } = useTranslation();
  const { activeEvent } = useActiveEvent();
  const { provinceOption } = useCountryStateHook();

  const { data: events } = backOfficeServices.useQueryGetAllEventsDashboard();
  const [pickedEvent, setPickedEvent] = useState(null);
  const eventId = activeEvent?.id || pickedEvent || events?.[0]?.id;

  // Selected distance (event type uuid); every panel is filtered by the API when set.
  const [distance, setDistance] = useState(null);
  useEffect(() => setDistance(null), [eventId]);

  const { data: od, isFetching: fetchingOverview } = backOfficeServices.useQueryGetDashboardOverview({ eventId, eventTypeId: distance });
  const { data: rd, isFetching: fetchingRegistration } = backOfficeServices.useQueryGetDashboardRegistration({ eventId, eventTypeId: distance });
  const fetching = fetchingOverview || fetchingRegistration;

  const [timelineMode, setTimelineMode] = useState("cumulative");

  // Always the full list of the event's distances (the API keeps these unfiltered), each with its colour.
  const distances = useMemo(() => (
    od?.eventTypes?.length
      ? od.eventTypes
      : Object.keys(od?.participantByEventType || {}).map((name) => ({ id: null, name }))
  ).map((et, i) => ({
    id: et.id,
    name: et.name,
    color: distanceColor(i),
    registered: od?.participantByEventType?.[et.name]?.participant ?? 0,
    capacity: od?.participantByEventType?.[et.name]?.capacityByEventType ?? 0,
    paid: od?.paidByEventType?.[et.name] ?? 0,
  })), [od]);

  const noData = t("back.stats.noData");

  // ---- Headline numbers ----
  const registered = od?.participantByEvent ?? 0;
  const capacity = od?.capacityByEvent ?? 0;
  const paid = od?.paidByEvent ?? 0;
  const statusText = {
    REGISTRATION_CLOSED: t("back.dashboard.statusClosed"),
    REGISTRATION_OPEN: t("back.dashboard.statusOpen").replace("{days}", od?.elapsedDays ?? 0),
    REGISTRATION_UNDEFINED: t("back.dashboard.statusUndefined"),
    REGISTRATION_NOT_OPEN_YET: t("back.dashboard.statusNotOpenYet"),
  }[od?.operationStatusCode];

  // ---- Registrations over time (gap days filled with 0) ----
  const timeline = useMemo(() => {
    const toMap = (rows) => {
      const m = {};
      (rows || []).forEach((r) => {
        const d = dayjs(r.dateTime).format("YYYY-MM-DD");
        m[d] = (m[d] || 0) + (Number(r.daily) || 0);
      });
      return m;
    };
    const reg = toMap(od?.participantsPerDay);
    const pay = toMap(od?.paidParticipantsPerDay);
    const keys = [...Object.keys(reg), ...Object.keys(pay)].sort();
    if (!keys.length) return null;
    const days = [];
    for (let d = dayjs(keys[0]); !d.isAfter(dayjs(keys[keys.length - 1])); d = d.add(1, "day")) days.push(d.format("YYYY-MM-DD"));

    if (timelineMode === "monthly") {
      const months = [...new Set(days.map((d) => d.slice(0, 7)))];
      const perMonth = (map) => months.map((m) => days.filter((d) => d.startsWith(m)).reduce((sum, d) => sum + (map[d] || 0), 0));
      return {
        categories: months.map((m) => dayjs(`${m}-01`).format("MM/YYYY")),
        series: [
          { name: t("back.stats.registered"), data: perMonth(reg) },
          { name: t("back.stats.paid"), data: perMonth(pay) },
        ],
      };
    }
    const series = (map) => {
      let acc = 0;
      return days.map((d) => (timelineMode === "daily" ? map[d] || 0 : (acc += map[d] || 0)));
    };
    return {
      categories: days.map((d) => dayjs(d).format("DD/MM")),
      series: [
        { name: t("back.stats.registered"), data: series(reg) },
        { name: t("back.stats.paid"), data: series(pay) },
      ],
    };
  }, [od, timelineMode, t]);

  const distanceRows = distances.map((d) => ({ ...d, paidLabel: `${t("back.stats.paid")} ${fmtNumber(d.paid)}` }));

  // ---- Payments ----
  const methodRows = useMemo(() => {
    const agg = {};
    (od?.paymentStatusByMethod || []).forEach((r) => {
      const m = normalizeMethod(r?.method);
      agg[m] = agg[m] || { success: 0, pending: 0, failed: 0 };
      agg[m][normalizeStatus(r?.status)] += Number(r?.count) || 0;
    });
    return Object.entries(agg).map(([m, v]) => ({
      key: m,
      label: METHOD_LABELS[m] || (m === "unknown" ? t("back.dashboard.unknown") : m),
      ...v,
    }));
  }, [od, t]);
  const failureRows = (od?.failureReasons || []).filter((r) => Number(r?.count) > 0);

  // ---- Applicants (already narrowed to the selected distance by the API) ----
  const gender = lowerKeys(rd?.genderByEvent);
  const otherGender = Object.entries(gender)
    .filter(([k]) => k !== "male" && k !== "female")
    .reduce((s, [, v]) => s + (Number(v) || 0), 0);

  const age = useMemo(() => {
    const src = rd?.ageGroupByEvent;
    const groups = Object.keys(src || {}).sort((a, b) => ageLower(a) - ageLower(b));
    return {
      groups,
      series: ["male", "female"].map((g) => ({
        name: t(`back.dashboard.${g}`),
        data: groups.map((ag) => Number(lowerKeys(src?.[ag])[g]) || 0),
      })),
    };
  }, [rd, t]);

  const shirt = useMemo(() => {
    const src = rd?.shirtByEvent || {};
    const types = Object.keys(src);
    const sizes = [...new Set(types.flatMap((ty) => Object.keys(src[ty] || {}).map(normalizeSize)))]
      .sort((a, b) => sizeRank(a) - sizeRank(b) || a.localeCompare(b));
    return {
      types,
      sizes,
      series: types.map((ty) => {
        const counts = {};
        Object.entries(src[ty] || {}).forEach(([s, c]) => {
          const k = normalizeSize(s);
          counts[k] = (counts[k] || 0) + (Number(c) || 0);
        });
        return { name: ty, data: sizes.map((s) => counts[s] || 0) };
      }),
    };
  }, [rd]);

  const provinceName = useMemo(() => {
    const m = new Map();
    (provinceOption || []).forEach((g) => (g?.options || []).forEach((p) => {
      if (p?.value != null) m.set(String(p.value), p.label);
    }));
    return m;
  }, [provinceOption]);
  const provinceRows = useMemo(() => {
    const totals = {};
    Object.entries(rd?.participantByProvince || {}).forEach(([k, v]) => {
      const key = String(k).trim();
      if (!key) return;
      const name = key.toUpperCase() === "UNKNOWN" ? t("back.dashboard.unknown") : provinceName.get(key) || key;
      totals[name] = (totals[name] || 0) + (Number(v) || 0);
    });
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    // Two columns of seven: the top 13 plus everything else as one row.
    const TOP = 13;
    const top = sorted.slice(0, TOP).map(([name, v]) => ({ key: name, label: name, value: v }));
    const rest = sorted.slice(TOP).reduce((s, [, v]) => s + v, 0);
    return rest
      ? [...top, { key: "_other", label: t("back.stats.otherProvinces", { count: sorted.length - TOP }), value: rest }]
      : top;
  }, [rd, provinceName, t]);

  const addOns = rd?.addOnSales || [];

  const chartBox = "h-[200px] xl:h-full";

  return (
    <div className={`flex flex-col xl:h-[calc(100vh-4rem)] xl:min-h-[680px] transition-opacity ${fetching ? "opacity-70" : ""}`}>
      {!activeEvent && (
        <div className="bo-card flex flex-wrap items-center gap-3 px-4 py-2">
          <span className="text-[13px] text-[#6e6e73]">{t("back.dashboard.event")}</span>
          <Select
            showSearch
            optionFilterProp="label"
            className="min-w-[280px]"
            value={eventId}
            onChange={setPickedEvent}
            options={(events || []).map((e) => ({ value: e.id, label: e.name }))}
          />
          <span className="text-[12px] text-[#a1a1a6]">{t("back.stats.starHint")}</span>
        </div>
      )}

      {/* Headline numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
        <Kpi
          label={t("back.stats.registered")}
          value={fmtNumber(registered)}
          progress={pct(registered, capacity)}
          sub={capacity ? t("back.stats.ofCapacity", { capacity: fmtNumber(capacity), percent: pct(registered, capacity) }) : undefined}
        />
        <Kpi
          label={t("back.stats.paid")}
          value={fmtNumber(paid)}
          progress={pct(paid, registered)}
          tone={STATUS_COLOR.success}
          sub={t("back.stats.ofRegistered", { percent: pct(paid, registered) })}
        />
        <Kpi label={t("back.dashboard.pending")} value={fmtNumber(rd?.pendingPayment)} sub={t("back.stats.holdingSlots")} />
        <Kpi label={t("back.dashboard.registrationFee")} value={fmtBaht(od?.totalRegistrationFee)} />
        <Kpi label={t("back.dashboard.deliveryFee")} value={fmtBaht(od?.totalShippingFee)} />
        <Kpi label={t("back.dashboard.netAmount")} value={fmtBaht(od?.totalNetRevenue)} />
        <Kpi
          label={t("back.stats.window")}
          value={`${od?.progressOperation ?? 0}%`}
          progress={od?.progressOperation ?? 0}
          tone="#86868b"
          sub={statusText}
        />
      </div>

      {/* Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 xl:flex-1 xl:min-h-0">
        <Panel
          className="lg:col-span-6"
          title={t("back.dashboard.statistics")}
          extra={
            <div className="flex items-center gap-3">
              <Legend items={[{ label: t("back.stats.registered") }, { label: t("back.stats.paid") }]} />
              <MiniSegmented
                value={timelineMode}
                onChange={setTimelineMode}
                options={[
                  { value: "cumulative", label: t("back.dashboard.cumulative").trim() },
                  { value: "daily", label: t("back.dashboard.daily") },
                  { value: "monthly", label: t("back.stats.monthly") },
                ]}
              />
            </div>
          }
        >
          {timeline ? (
            <div className={chartBox}>
              <Chart
                key={timelineMode}
                type={timelineMode === "cumulative" ? "line" : "bar"}
                height="100%"
                series={timeline.series}
                options={timelineMode !== "cumulative"
                  ? barChart({ categories: timeline.categories, labelEvery: Math.max(1, Math.ceil(timeline.categories.length / 8)) })
                  : baseChart({
                    chart: { ...baseChart().chart, type: "line" },
                    colors: SERIES,
                    stroke: { width: 2, curve: "straight" },
                    markers: { size: 0, hover: { size: 5 } },
                    xaxis: { ...baseChart().xaxis, categories: timeline.categories, tickAmount: 8, labels: { ...baseChart().xaxis.labels, rotate: 0, hideOverlappingLabels: true } },
                  })}
              />
            </div>
          ) : <Empty text={noData} />}
        </Panel>

        <Panel
          className="lg:col-span-3"
          title={t("back.stats.byDistance")}
          extra={<Legend items={[{ label: t("back.stats.registered"), color: "#c7c7cc" }, { label: t("back.stats.paid"), color: "#6e6e73" }]} />}
          bodyClassName="overflow-y-auto"
        >
          <DistanceList rows={distanceRows} selected={distance} onSelect={setDistance} emptyText={noData} />
        </Panel>

        <Panel className="lg:col-span-3" title={t("back.stats.payments")} bodyClassName="overflow-y-auto flex flex-col gap-4">
          <SplitBar
            emptyText={noData}
            parts={[
              { key: "success", label: t("back.dashboard.success"), value: rd?.paidPayment || 0, color: STATUS_COLOR.success },
              { key: "pending", label: t("back.dashboard.pending"), value: rd?.pendingPayment || 0, color: STATUS_COLOR.pending },
              { key: "failed", label: t("back.dashboard.failed"), value: rd?.unpaidPayment || 0, color: STATUS_COLOR.failed },
            ]}
          />
          {methodRows.length > 0 && (
            <div>
              <div className="text-[12px] font-semibold text-[#424245] mb-1.5">{t("back.dashboard.paymentMethods")}</div>
              <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
                {methodRows.map((m) => {
                  const parts = [
                    { key: "success", value: m.success, label: t("back.dashboard.success") },
                    { key: "pending", value: m.pending, label: t("back.dashboard.pending") },
                    { key: "failed", value: m.failed, label: t("back.dashboard.failed") },
                  ];
                  const total = m.success + m.pending + m.failed;
                  return (
                    <li key={m.key} className="min-w-0">
                      <div className="flex items-baseline justify-between gap-2 text-[12px]">
                        <span className="truncate text-[#1d1d1f]">{m.label}</span>
                        <span className="tabular-nums text-[#424245] shrink-0">{fmtNumber(total)}</span>
                      </div>
                      <div className="flex h-1.5 gap-[2px] rounded-full overflow-hidden mt-1 bg-[#ececf0]">
                        {parts.filter((p) => p.value > 0).map((p) => (
                          <Tooltip key={p.key} title={`${p.label}: ${fmtNumber(p.value)} (${pct(p.value, total)}%)`}>
                            <div style={{ flex: p.value, background: STATUS_COLOR[p.key] }} />
                          </Tooltip>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {failureRows.length > 0 && (
            <div>
              <div className="text-[12px] font-semibold text-[#424245] mb-1.5">{t("back.dashboard.failureReasons")}</div>
              <BarList
                color={STATUS_COLOR.failed}
                rows={failureRows.map((r) => ({
                  key: r.reason,
                  label: t(`back.dashboard.${REASON_KEYS[String(r.reason).toUpperCase()] || "failed"}`),
                  value: Number(r.count) || 0,
                }))}
              />
            </div>
          )}
        </Panel>
      </div>

      {/* Applicants */}
      <div className="bo-card flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
        <span className="text-[13px] font-semibold text-[#1d1d1f]">{t("back.dashboard.registrationInfo")}</span>
        {distances.length > 0 && (
          <DistanceChips items={distances} selected={distance} onSelect={setDistance} allLabel={t("back.stats.allDistances")} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 xl:flex-1 xl:min-h-0">
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <Panel className="!min-h-0 shrink-0" title={t("back.dashboard.gender")}>
            <SplitBar
              emptyText={noData}
              parts={[
                { key: "male", label: t("back.dashboard.male"), value: Number(gender.male) || 0, color: SERIES[0] },
                { key: "female", label: t("back.dashboard.female"), value: Number(gender.female) || 0, color: SERIES[1] },
                ...(otherGender ? [{ key: "other", label: t("back.dashboard.unknown"), value: otherGender, color: "#a1a1a6" }] : []),
              ]}
            />
          </Panel>
          <Panel className="flex-1 !min-h-[160px] xl:!min-h-0" title={t("back.dashboard.addOn")} bodyClassName="overflow-y-auto">
            {addOns.length ? (
              <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {addOns.map((a) => (
                  <li key={a.id} className="text-[12px] min-w-0">
                    <div className="flex justify-between gap-2">
                      <span className="truncate text-[#1d1d1f]">{a.name}</span>
                      <span className="tabular-nums font-semibold shrink-0">
                        {fmtNumber(a.sold)}{a.quota != null ? ` / ${fmtNumber(a.quota)}` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 text-[11px] text-[#6e6e73]">
                      <span className="truncate">{t("back.dashboard.addOnReserved")} {fmtNumber(a.reserved)}</span>
                      <span className="tabular-nums shrink-0">{fmtBaht(a.revenue)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <Empty text={t("back.dashboard.addOnEmpty")} />}
          </Panel>
        </div>

        <Panel
          className="lg:col-span-3"
          title={t("back.dashboard.totalByAge")}
          extra={age.groups.length > 0 && <Legend items={age.series.map((s) => ({ label: s.name }))} />}
        >
          {age.groups.length ? (
            <div className={chartBox}>
              <Chart type="bar" height="100%" series={age.series} options={barChart({ categories: age.groups, stacked: true })} />
            </div>
          ) : <Empty text={noData} />}
        </Panel>

        <Panel
          className="lg:col-span-3"
          title={t("back.dashboard.shirt")}
          extra={shirt.types.length > 1 && <Legend items={shirt.types.map((ty, i) => ({ label: ty, color: SHIRT_COLORS[i] }))} />}
        >
          {shirt.sizes.length ? (
            <div className={chartBox}>
              <Chart
                type="bar"
                height="100%"
                series={shirt.series}
                options={barChart({ categories: shirt.sizes, stacked: shirt.types.length > 1, colors: SHIRT_COLORS })}
              />
            </div>
          ) : <Empty text={noData} />}
        </Panel>

        <Panel className="lg:col-span-4" title={t("back.dashboard.province")} bodyClassName="overflow-y-auto">
          <BarList rows={provinceRows} emptyText={noData} columns={2} />
        </Panel>

      </div>
    </div>
  )
}
