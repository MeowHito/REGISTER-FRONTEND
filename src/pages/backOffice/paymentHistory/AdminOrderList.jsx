import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Pagination, Select, Empty, Spin } from "antd";
import { SearchOutlined, RightOutlined, UserOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import backOfficeServices from "services/backoffice.services";
import generalService from "services/general.services";
import { SYS_DATE_FORMAT } from "constants/helper";
import PageHeader from "components/pageHeader";
import Pill from "components/pill";

const STATUS_TONE = { SUCCESS: "green", PENDING: "orange", REVIEW: "orange", CANCELLED: "red", FAILED: "red" };
const STATUS_FILTERS = ["", "SUCCESS", "PENDING", "REVIEW", "CANCELLED", "FAILED"];

/**
 * Admin view of every registration, newest first. Each order is a full-width row that already
 * shows who registered (Thai + English names), the distance, payment status and amounts, so
 * nothing has to be opened or scrolled sideways to read it. "View" opens the full order.
 */
export default function AdminOrderList({ onView }) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ q: undefined, status: undefined, eventId: undefined });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);

  const { data, isFetching, refetch } = backOfficeServices.useQueryGetAllPaymentHistory({
    params: filters,
    paging: { page: page - 1, size },
  });
  const orders = data?.content || [];
  const total = data?.totalElements || 0;

  // Every event, for the event filter (page 0 = unpaged).
  const eventPaging = useMemo(() => ({ page: 0, size: 1000, search: [] }), []);
  const { data: events, refetch: loadEvents } = generalService.useQueryGetAllEvents({
    paging: eventPaging,
    queryKey: ["adminOrderEvents"],
  });
  useEffect(() => { loadEvents(); }, [loadEvents]);
  const eventOptions = useMemo(
    () => (events?.content || []).map((e) => ({ value: e.id, label: e.name })),
    [events]
  );

  const apply = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const money = (n) =>
    `${Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t("general.unitBaht")}`;
  const fmtTime = (d) => (d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "-");
  // React already escapes; i18next's own escaping would print "/" in dates as "&#x2F;".
  const noEsc = { interpolation: { escapeValue: false } };
  const statusText = (s) => t(`back.history.historyList.status.${s}`, { defaultValue: s });

  const paymentLine = (o) => {
    const s = o.status?.toUpperCase();
    if (s === "SUCCESS") {
      return t("back.history.admin.paidAt", {
        time: fmtTime(o.paymentDateTime),
        method: o.paymentMethod ? ` · ${String(o.paymentMethod).toUpperCase()}` : "",
        ...noEsc,
      });
    }
    if (s === "PENDING" && o.paymentDueDatetime) return t("back.history.admin.payBy", { time: fmtTime(o.paymentDueDatetime), ...noEsc });
    if (s === "REVIEW" && o.reviewReason) return o.reviewReason;
    return null;
  };

  const renderOrder = (o) => {
    const s = o.status?.toUpperCase();
    const applicants = o.applicants || [];
    const pay = paymentLine(o);
    return (
      <article key={o.id} className="px-4 md:px-5 py-4 border-b border-[#f0f0f2] last:border-b-0 hover:bg-[#fafafc] transition-colors">
        <div className="grid gap-3 md:gap-5 md:grid-cols-[230px_minmax(0,1fr)_170px]">
          {/* Order */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[15px] text-[#1d1d1f] tabular-nums">{o.orderNo}</span>
              <Pill size="sm" tone={STATUS_TONE[s] || "blue"} dot>{statusText(s)}</Pill>
            </div>
            <p className="mt-1 text-[14px] font-medium text-[#0071e3] break-words leading-snug">{o.eventName || "-"}</p>
            <p className="mt-1 text-[13px] text-[#6e6e73]">
              {t("back.history.admin.eventDay")} {o.eventDate ? dayjs(o.eventDate).format(SYS_DATE_FORMAT) : "-"}
            </p>
            <p className="text-[13px] text-[#6e6e73]">{t("back.history.admin.orderedAt", { time: fmtTime(o.createdTime), ...noEsc })}</p>
            {pay ? <p className={`text-[13px] ${s === "SUCCESS" ? "text-[#15803d]" : "text-[#c2410c]"}`}>{pay}</p> : null}
          </div>

          {/* Applicants — always open */}
          <div className="min-w-0">
            <p className="text-[13px] text-[#6e6e73] mb-1.5">
              {t("back.history.admin.applicants", { count: applicants.length })}
            </p>
            <ul className="flex flex-col gap-1.5">
              {applicants.map((a, i) => (
                <li key={i} className="flex gap-2.5 rounded-xl bg-[#f5f5f7] px-3 py-2.5">
                  <UserOutlined className="self-start mt-[3px] shrink-0 text-[#86868b]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                      <p className="min-w-0 leading-snug">
                        <span className="font-semibold text-[14px] text-[#1d1d1f] break-words">{a.name || "-"}</span>
                        {a.nameEn ? <span className="block text-[13px] text-[#6e6e73] break-words">{a.nameEn}</span> : null}
                      </p>
                      <span className="flex flex-wrap items-center gap-1.5 min-w-0">
                        {a.eventTypeName ? <Pill size="sm" tone="blue" title={a.eventTypeName}>{a.eventTypeName}</Pill> : null}
                        {a.bibNo ? <Pill size="sm" tone="slate">BIB {a.bibNo}</Pill> : null}
                        {a.isSelf === false ? <Pill size="sm" tone="orange">{t("back.history.historyDetail.friend")}</Pill> : null}
                      </span>
                    </div>
                    {a.phone ? <p className="mt-1 text-[13px] text-[#6e6e73] tabular-nums">{a.phone}</p> : null}
                  </div>
                </li>
              ))}
              {applicants.length === 0 && <li className="text-[13px] text-[#86868b]">-</li>}
            </ul>
            {(o.buyerName || o.buyerEmail) && (
              <p className="mt-2 text-[13px] text-[#6e6e73] break-words">
                {t("back.history.admin.buyer")}: {[o.buyerName, o.buyerEmail].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          {/* Amount + action */}
          <div className="flex md:flex-col items-center md:items-end justify-between gap-2">
            <div className="md:text-right">
              <p className="text-[13px] text-[#6e6e73]">{t("back.history.historyList.columns.amount")}</p>
              <p className="text-[18px] font-bold text-[#1d1d1f] tabular-nums">{money(o.amount)}</p>
            </div>
            <Button onClick={() => onView(o.id)}>
              {t("back.history.historyList.action.view")} <RightOutlined className="text-[11px]" />
            </Button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <>
      <PageHeader menu="historyList" />
      <div className="bo-card overflow-hidden">
        {/* Filters */}
        <div className="px-4 md:px-5 pt-4 pb-3 border-b border-[#e5e5ea] flex flex-col gap-3">
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_280px_auto]">
            <Input
              size="large"
              allowClear
              prefix={<SearchOutlined className="text-[#86868b]" />}
              placeholder={t("back.history.admin.searchPlaceholder")}
              value={q}
              onChange={(e) => { setQ(e.target.value); if (!e.target.value) apply({ q: undefined }); }}
              onPressEnter={() => apply({ q: q.trim() || undefined })}
            />
            <Select
              size="large"
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={t("back.history.admin.allEvents")}
              options={eventOptions}
              value={filters.eventId}
              onChange={(v) => apply({ eventId: v || undefined })}
            />
            <div className="flex gap-2">
              <Button size="large" type="primary" icon={<SearchOutlined />} onClick={() => apply({ q: q.trim() || undefined })}>
                {t("back.history.historyList.filters.search")}
              </Button>
              <Button size="large" icon={<ReloadOutlined />} onClick={() => refetch()} aria-label="reload" />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => {
              const active = (filters.status || "") === s;
              return (
                <button
                  key={s || "all"}
                  type="button"
                  onClick={() => apply({ status: s || undefined })}
                  className={`h-8 px-3.5 rounded-full border text-[13px] font-medium transition-colors ${active
                    ? "border-[#0071e3] bg-[#0071e3] text-white"
                    : "border-[#d2d2d7] bg-white text-[#1d1d1f] hover:border-[#0071e3]"}`}
                >
                  {s ? statusText(s) : t("back.history.admin.allStatus")}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders */}
        <Spin spinning={isFetching}>
          <div className="min-h-[200px]">
            {orders.length ? orders.map(renderOrder) : (
              !isFetching && <div className="py-12"><Empty description={t("back.history.historyList.empty")} /></div>
            )}
          </div>
        </Spin>

        {total > 0 && (
          <div className="px-4 md:px-5 py-3 border-t border-[#e5e5ea] flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] text-[#6e6e73]">
              {t("back.history.admin.showing", {
                from: (page - 1) * size + 1,
                to: Math.min(page * size, total),
                total,
              })}
            </span>
            <Pagination
              current={page}
              pageSize={size}
              total={total}
              showSizeChanger
              pageSizeOptions={["20", "50", "100"]}
              onChange={(p, ps) => { setPage(ps !== size ? 1 : p); setSize(ps); }}
            />
          </div>
        )}
      </div>
    </>
  );
}
