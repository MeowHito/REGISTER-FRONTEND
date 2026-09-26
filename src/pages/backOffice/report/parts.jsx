import React, { useState } from "react";
import { Input, Select, Space, Tag, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { SYS_DATE_FORMAT } from "constants/helper";
import { fmtMoney, num } from "./format";

/** Right-aligned money. `sign="-"` renders a discount as −x in red; zero is a quiet dash. */
export function Money({ value, sign, strong = false, className = "" }) {
  const n = num(value);
  if (n === 0) return <span className={`text-[#a1a1a6] ${className}`}>–</span>;
  const tone = sign === "-" ? "text-[#b3261e]" : strong ? "font-semibold text-[#1d1d1f]" : "text-[#1d1d1f]";
  return (
    <span className={`tabular-nums whitespace-nowrap ${tone} ${className}`}>
      {sign === "-" ? "−" : ""}{fmtMoney(Math.abs(n))}
    </span>
  );
}

export function HeaderHint({ title, hint }) {
  return (
    <span className="inline-flex items-center gap-1">
      {title}
      <Tooltip title={hint}><InfoCircleOutlined className="text-[#a1a1a6]" /></Tooltip>
    </span>
  );
}

// ---------- order fields ----------

const STATUS = {
  SUCCESS: { color: "success", key: "success" },
  PENDING: { color: "warning", key: "pending" },
  REVIEW: { color: "orange", key: "review" },
  FAILED: { color: "error", key: "failed" },
  CANCELLED: { color: "default", key: "cancelled" },
  CANCELED: { color: "default", key: "cancelled" },
};

export function StatusTag({ status }) {
  const { t } = useTranslation();
  const s = STATUS[String(status || "").toUpperCase()];
  if (!s) return <Tag className="m-0">{status || "–"}</Tag>;
  return <Tag color={s.color} className="m-0">{t(`back.report.ui.status.${s.key}`)}</Tag>;
}

/** Two-line date cell: the day on top, the time below. */
export function DateCell({ value }) {
  if (!value) return <span className="text-[#a1a1a6]">–</span>;
  const d = dayjs(value);
  return (
    <span className="inline-flex flex-col leading-tight tabular-nums">
      <span>{d.format(SYS_DATE_FORMAT)}</span>
      <span className="text-[11px] text-[#6e6e73]">{d.format("HH:mm")}</span>
    </span>
  );
}

// ---------- layout ----------

/** Headline money tile. */
export function Stat({ label, value, sub, tone = "gray", loading = false }) {
  const tones = { gray: "text-[#1d1d1f]", blue: "text-[#0071e3]", green: "text-[#1d7c34]", red: "text-[#b3261e]" };
  return (
    <div className="bo-card px-4 py-3 min-w-0 flex flex-col justify-center">
      <div className="text-[12px] text-[#6e6e73] truncate">{label}</div>
      <div className={`text-[22px] font-bold leading-tight tabular-nums truncate mt-0.5 ${tones[tone] || tones.gray}`}>
        {loading ? "–" : value}
      </div>
      {sub && <div className="text-[11px] text-[#6e6e73] truncate mt-1">{sub}</div>}
    </div>
  );
}

/** The strip at the top of a tab: what this report is, and its actions (refresh, Excel, …). */
export function ReportHeader({ title, description, extra }) {
  return (
    <div className="bo-card flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 md:px-5 py-3">
      <div className="min-w-0">
        <h2 className="m-0 text-[17px] font-semibold text-[#1d1d1f]">{title}</h2>
        {description && <p className="m-0 mt-0.5 text-[12px] text-[#6e6e73]">{description}</p>}
      </div>
      {extra && <div className="flex items-center flex-wrap gap-2 shrink-0">{extra}</div>}
    </div>
  );
}

/** A report panel: small title + one-line description on the left, controls on the right, body flush. */
export function Panel({ title, description, extra, children, className = "", bodyClassName = "" }) {
  return (
    <section className={`bo-card flex flex-col min-w-0 ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 md:px-5 pt-4 pb-3 border-b border-[#e5e5ea]">
        <div className="min-w-0">
          <h3 className="m-0 text-[14px] font-semibold text-[#1d1d1f]">{title}</h3>
          {description && <p className="m-0 mt-0.5 text-[12px] text-[#6e6e73]">{description}</p>}
        </div>
        {extra && <div className="flex items-center flex-wrap gap-2 shrink-0">{extra}</div>}
      </header>
      <div className={`flex-1 min-w-0 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function EmptyNote({ text }) {
  return <div className="bo-card min-h-[160px] flex items-center justify-center text-[13px] text-[#a1a1a6] px-4 text-center">{text}</div>;
}

/**
 * Receipt-style breakdown. `lines`: [{ key, label, value, op }] where op is "+" (default),
 * "-" (subtracted, shown in red) or "=" (a total, drawn with a rule above it).
 */
export function Receipt({ lines, currency }) {
  const OP = {
    "+": { sym: "+", cls: "bg-[rgba(0,0,0,0.05)] text-[#424245]" },
    "-": { sym: "−", cls: "bg-[rgba(179,38,30,0.1)] text-[#b3261e]" },
    "=": { sym: "=", cls: "bg-[rgba(0,113,227,0.12)] text-[#0071e3]" },
  };
  return (
    <dl className="m-0">
      {lines.map((l) => {
        const op = OP[l.op] ? l.op : "+";
        const total = op === "=";
        const n = num(l.value);
        return (
          <div
            key={l.key}
            className={`flex items-baseline justify-between gap-3 py-2 ${total ? "border-t border-[#1d1d1f] mt-1" : "border-b border-dashed border-[#e5e5ea]"}`}
          >
            <dt className={`m-0 flex items-center gap-2 text-[13px] ${total ? "font-semibold text-[#1d1d1f]" : "text-[#424245]"}`}>
              <span className={`inline-flex w-5 h-5 shrink-0 items-center justify-center rounded-md text-[12px] font-semibold ${OP[op].cls}`}>{OP[op].sym}</span>
              <span>{l.label}</span>
            </dt>
            <dd className={`m-0 tabular-nums whitespace-nowrap ${total ? "text-[16px] font-bold text-[#1d1d1f]" : op === "-" && n ? "text-[13px] text-[#b3261e]" : "text-[13px] text-[#1d1d1f]"}`}>
              {op === "-" && n ? "−" : ""}{fmtMoney(Math.abs(n))}
              <span className="ml-1 text-[11px] font-normal text-[#6e6e73]"> {currency}</span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Field picker + text box for the reports' single-field server-side search. */
export function SearchBar({ fields, onSearch, loading = false }) {
  const { t } = useTranslation();
  const [field, setField] = useState(fields[0]?.value);
  const [text, setText] = useState("");
  return (
    <Space.Compact>
      <Select value={field} onChange={setField} options={fields} className="min-w-[150px]" />
      <Input.Search
        allowClear
        placeholder={t("back.report.ui.searchPlaceholder")}
        value={text}
        loading={loading}
        className="w-[240px]"
        onChange={(e) => {
          setText(e.target.value);
          if (!e.target.value) onSearch({ field, text: "" });
        }}
        onSearch={(v) => onSearch({ field, text: (v ?? "").trim() })}
      />
    </Space.Compact>
  );
}
