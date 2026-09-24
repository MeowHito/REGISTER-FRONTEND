/**
 * A white back-office card with an optional icon tile, title, description and
 * header actions. `id` makes it an anchor target (e.g. for tab navigation).
 */
const ICON_TONES = {
  blue: "bg-[#0071e3]",
  orange: "bg-[#ff9f0a]",
  indigo: "bg-[#5856d6]",
  green: "bg-[#34c759]",
  red: "bg-[#ff3b30]",
  teal: "bg-[#30b0c7]",
  gray: "bg-[#8e8e93]",
};

export default function SectionCard({
  id,
  icon,
  tone = "blue",
  title,
  description,
  extra,
  children,
  className = "",
  bodyClassName = "",
  divider = true,
}) {
  const hasHeader = title || description || extra || icon;
  return (
    <section id={id} className={`bo-card scroll-mt-24 ${className}`}>
      {hasHeader && (
        <div className={`flex items-start justify-between gap-4 px-4 md:px-6 pt-5 md:pt-6 ${divider ? "pb-4 md:pb-5 mx-0 border-b border-[#e5e5ea]" : "pb-0"}`}>
          <div className="flex items-start gap-3 min-w-0">
            {icon && (
              <span
                className={`${ICON_TONES[tone] || ICON_TONES.blue} shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg`}
              >
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="m-0 text-[18px] font-semibold leading-snug text-[#1d1d1f]">{title}</h2>}
              {description && <p className="m-0 mt-0.5 text-[13px] text-[#6e6e73] leading-relaxed">{description}</p>}
            </div>
          </div>
          {extra && <div className="shrink-0 flex items-center gap-2">{extra}</div>}
        </div>
      )}
      <div className={`px-4 md:px-6 py-5 md:py-6 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
