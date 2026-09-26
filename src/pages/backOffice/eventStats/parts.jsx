import { Tooltip } from "antd";
import { StarFilled } from "@ant-design/icons";
import { SERIES, fmtNumber, pct } from "./chartTheme";

/** A flush dashboard panel: small title row, optional control on the right, body fills the rest. */
export function Panel({ title, extra, children, className = "", bodyClassName = "" }) {
  return (
    <section className={`bo-card flex flex-col min-h-[240px] xl:min-h-0 min-w-0 ${className}`}>
      {/* Wraps instead of truncating: a legend drops under the title when the panel is narrow. */}
      <header className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-4 pt-3 pb-1 min-h-[36px]">
        <h3 className="m-0 text-[13px] font-semibold text-[#1d1d1f] min-w-0">{title}</h3>
        {extra}
      </header>
      <div className={`flex-1 min-h-0 px-4 pb-3 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/** Headline number tile. */
export function Kpi({ label, value, sub, progress, tone = "#0071e3" }) {
  return (
    <div className="bo-card px-4 py-3 min-w-0 flex flex-col justify-center">
      <div className="text-[12px] text-[#6e6e73] truncate">{label}</div>
      <div className="text-[22px] font-bold leading-tight text-[#1d1d1f] truncate mt-0.5">{value}</div>
      {progress !== undefined && (
        <div className="h-1 rounded-full bg-[#ececf0] mt-1.5 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min(progress, 100)}%`, background: tone }} />
        </div>
      )}
      {sub && <div className="text-[11px] text-[#6e6e73] truncate mt-1">{sub}</div>}
    </div>
  );
}

/** Tiny segmented control for panel headers. */
export function MiniSegmented({ value, onChange, options }) {
  return (
    <div className="inline-flex shrink-0 rounded-lg bg-[#ececf0] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-2.5 h-6 rounded-md text-[12px] cursor-pointer transition-colors ${
            value === o.value ? "bg-white shadow-sm font-semibold text-[#1d1d1f]" : "text-[#6e6e73] hover:text-[#1d1d1f]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Horizontal bar rows (label, value, bar). `rows`: { key, label, value, max?, inner?, tooltip? } —
 * `inner` draws a darker nested segment (e.g. paid inside registered).
 */
export function BarList({ rows, color = SERIES[0], innerColor, emptyText, columns = 1 }) {
  if (!rows.length) return <Empty text={emptyText} />;
  const top = Math.max(...rows.map((r) => r.max ?? r.value), 1);
  return (
    <ul className={`m-0 p-0 list-none ${columns === 2 ? "grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5" : "flex flex-col gap-2.5"}`}>
      {rows.map((r) => {
        const scale = r.max ?? top;
        return (
          <Tooltip key={r.key} title={r.tooltip} placement="left">
            <li className="min-w-0">
              <div className="flex items-baseline justify-between gap-2 text-[12px]">
                <span className="text-[#1d1d1f] truncate">{r.label}</span>
                <span className="text-[#424245] tabular-nums shrink-0">{r.valueText ?? fmtNumber(r.value)}</span>
              </div>
              <div className="relative h-1.5 rounded-full bg-[#ececf0] mt-1 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${pct(r.value, scale)}%`, background: innerColor ? "#b7d3f6" : color }}
                />
                {innerColor && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${pct(r.inner || 0, scale)}%`, background: innerColor }}
                  />
                )}
              </div>
            </li>
          </Tooltip>
        );
      })}
    </ul>
  );
}

/** One 100% bar split into labelled parts: [{ key, label, value, color }]. */
export function SplitBar({ parts, emptyText }) {
  const total = parts.reduce((s, p) => s + (p.value || 0), 0);
  if (!total) return <Empty text={emptyText} />;
  const shown = parts.filter((p) => p.value > 0);
  return (
    <div>
      <div className="flex h-2.5 gap-[2px] rounded-full overflow-hidden">
        {shown.map((p) => (
          <Tooltip key={p.key} title={`${p.label}: ${fmtNumber(p.value)} (${pct(p.value, total)}%)`}>
            <div style={{ flex: p.value, background: p.color }} />
          </Tooltip>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {parts.map((p) => (
          <span key={p.key} className="inline-flex items-center gap-1.5 text-[12px] text-[#424245]">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.label}
            <span className="font-semibold text-[#1d1d1f] tabular-nums">{fmtNumber(p.value)}</span>
            <span className="text-[#6e6e73] tabular-nums">{pct(p.value, total)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Empty({ text }) {
  return <div className="h-full min-h-[60px] flex items-center justify-center text-[12px] text-[#a1a1a6]">{text}</div>;
}

/** Legend chips for charts with 2+ series (identity is never colour alone). */
export function Legend({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {items.map((it, i) => (
        <span key={it.label} className="inline-flex items-center gap-1.5 text-[11px] text-[#424245]">
          <span className="w-2 h-2 rounded-full" style={{ background: it.color ?? SERIES[i] }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

/**
 * Distances as clickable rows: registered (tint) and paid (solid) in the distance's own colour.
 * Clicking a row selects that distance for the whole page; clicking it again clears it.
 */
export function DistanceList({ rows, selected, onSelect, emptyText }) {
  if (!rows.length) return <Empty text={emptyText} />;
  return (
    <ul className="m-0 p-0 list-none flex flex-col gap-1">
      {rows.map((r) => {
        const active = !!r.id && selected === r.id;
        const dimmed = selected && !active;
        const scale = r.capacity || Math.max(...rows.map((x) => x.registered), 1);
        return (
          <li key={r.id}>
            {/* A row without an id (older API without eventTypes) is shown but not selectable. */}
            <button
              type="button"
              aria-pressed={active}
              disabled={!r.id}
              onClick={() => onSelect(active ? null : r.id)}
              className={`w-full text-left rounded-lg px-2 py-1.5 -mx-2 ${r.id ? "cursor-pointer" : "cursor-default"} transition-colors ${
                active ? "bg-[rgba(245,179,1,0.1)]" : "hover:bg-[rgba(0,0,0,0.04)]"
              } ${dimmed ? "opacity-50 hover:opacity-100" : ""}`}
            >
              <div className="flex items-center justify-between gap-2 text-[12px]">
                <span className="flex items-center gap-1.5 min-w-0">
                  {active
                    ? <span className="text-[#f5b301] leading-none shrink-0"><StarFilled /></span>
                    : <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} />}
                  <span className="truncate font-semibold text-[#1d1d1f]">{r.name}</span>
                </span>
                <span className="text-[#424245] tabular-nums shrink-0">
                  {r.capacity ? `${fmtNumber(r.registered)} / ${fmtNumber(r.capacity)}` : fmtNumber(r.registered)}
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-[#ececf0] mt-1 overflow-hidden">
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct(r.registered, scale)}%`, background: r.color, opacity: 0.35 }} />
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct(r.paid, scale)}%`, background: r.color }} />
              </div>
              <div className="flex justify-between text-[11px] text-[#6e6e73] mt-0.5 tabular-nums">
                <span>{r.paidLabel}</span>
                {r.capacity ? <span>{pct(r.registered, r.capacity)}%</span> : null}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** "All" + one chip per distance, each carrying the distance's colour; mirrors DistanceList's selection. */
export function DistanceChips({ items, selected, onSelect, allLabel }) {
  const chip = (key, label, color, active, onClick) => (
    <button
      key={key}
      type="button"
      aria-pressed={active}
      disabled={!onClick}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full border text-[12px] ${onClick ? "cursor-pointer" : "cursor-default"} transition-colors ${
        active ? "bg-white font-semibold text-[#1d1d1f] shadow-sm" : "bg-transparent text-[#424245] border-transparent hover:bg-white/70"
      }`}
      style={active ? { borderColor: color || "#d2d2d7" } : undefined}
    >
      {color && (active
        ? <span className="text-[#f5b301] leading-none"><StarFilled /></span>
        : <span className="w-2 h-2 rounded-full" style={{ background: color }} />)}
      {label}
    </button>
  );
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-full bg-[#ececf0] p-0.5">
      {chip("all", allLabel, null, !selected, () => onSelect(null))}
      {/* Always list every distance; one without an id (older API) is shown but can't be picked. */}
      {items.map((it) => chip(it.id || it.name, it.name, it.color, !!it.id && selected === it.id,
        it.id ? () => onSelect(selected === it.id ? null : it.id) : null))}
    </div>
  );
}
