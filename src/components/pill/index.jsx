/**
 * Small rounded label (distance, province, status, price phase…), one look for the whole site.
 *
 * Kanit's tall line box sat the text low inside a padded pill, so the coloured background looked
 * shifted off the words. A fixed height with the text centred by flexbox keeps them lined up on
 * every phone; the text itself keeps a normal line height so Thai tone marks are never clipped.
 */
const TONES = {
  blue: { box: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]", dot: "bg-[#3b82f6]", icon: "text-[#2563eb]" },
  slate: { box: "border-slate-200 bg-slate-100/70 text-slate-700", dot: "bg-slate-400", icon: "text-slate-500" },
  amber: { box: "border-[#fde68a] bg-[#fffbeb] text-[#78350f]", dot: "bg-[#f59e0b]", icon: "text-[#b45309]" },
  green: { box: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]", dot: "bg-[#22c55e]", icon: "text-[#16a34a]" },
  red: { box: "border-[#fecaca] bg-[#fef2f2] text-[#dc2626]", dot: "bg-[#ef4444]", icon: "text-[#dc2626]" },
  orange: { box: "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]", dot: "bg-[#f97316]", icon: "text-[#ea580c]" },
  // Registration page palette (#006193).
  brand: { box: "border-[#b3d4ea] bg-[#eaf4fb] text-[#006193]", dot: "bg-[#006193]", icon: "text-[#006193]" },
  solid: { box: "border-[#006193] bg-[#006193] text-white", dot: "bg-white", icon: "text-white" },
  glass: { box: "border-white/25 bg-white/10 text-slate-100", dot: "bg-white", icon: "text-slate-200" },
  // Colours come from the caller's className (e.g. a per-race-type palette).
  none: { box: "", dot: "bg-current", icon: "" },
};

const SIZES = {
  sm: "h-6 px-2.5 gap-1 text-[12px]",
  md: "h-7 px-3 gap-1.5 text-[13px]",
  lg: "h-8 px-3.5 gap-1.5 text-[14px]",
};

export default function Pill({ tone = "slate", size = "md", icon = null, dot = false, title, className = "", children }) {
  const t = TONES[tone] || TONES.slate;
  return (
    <span
      title={title}
      className={`inline-flex items-center max-w-full min-w-0 rounded-full border font-semibold leading-none whitespace-nowrap align-middle ${SIZES[size] || SIZES.md} ${t.box} ${className}`}
    >
      {dot ? <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.dot}`} /> : null}
      {icon ? <span className={`inline-flex items-center shrink-0 ${t.icon}`}>{icon}</span> : null}
      <span className="min-w-0 overflow-hidden text-ellipsis leading-[1.6]">{children}</span>
    </span>
  );
}
