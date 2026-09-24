const TONES = {
  blue: { icon: "bg-[rgba(0,113,227,0.1)] text-[#0071e3]", badge: "bg-[rgba(0,113,227,0.1)] text-[#0071e3]" },
  gray: { icon: "bg-[rgba(0,0,0,0.05)] text-[#424245]", badge: "bg-[rgba(0,0,0,0.06)] text-[#424245]" },
  green: { icon: "bg-[rgba(52,199,89,0.12)] text-[#1d7c34]", badge: "bg-[rgba(52,199,89,0.12)] text-[#1d7c34]" },
  orange: { icon: "bg-[rgba(255,159,10,0.14)] text-[#b36200]", badge: "bg-[rgba(255,159,10,0.14)] text-[#b36200]" },
};

/** One KPI tile: label, big number, a small pill, and an icon. */
export default function StatCard({ label, value, badge, icon, tone = "gray", loading = false }) {
  const t = TONES[tone] || TONES.gray;
  return (
    <div className="bo-card bo-card-pad flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="m-0 text-[13px] font-medium text-[#424245]">{label}</p>
        <div className="flex items-center flex-wrap gap-2 mt-2">
          <span className="text-[30px] leading-none font-bold tracking-[-0.02em] text-[#1d1d1f] tabular-nums">
            {loading ? "–" : value}
          </span>
          {badge && !loading && (
            <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-semibold ${t.badge}`}>
              {badge}
            </span>
          )}
        </div>
      </div>
      {icon && (
        <span className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl ${t.icon}`}>
          {icon}
        </span>
      )}
    </div>
  );
}
