import { hexToRgba } from "utils/dashboard";

/**
 * A white back-office card with an optional icon tile, title, description and
 * header actions. `id` makes it an anchor target (e.g. for tab navigation).
 * `accent` (a #rrggbb colour) tints the card faintly; `active` makes the tint a
 * little stronger and shows a bar on the left edge, to mark the section in view.
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
  accent,
  active = false,
}) {
  const hasHeader = title || description || extra || icon;
  return (
    <section
      id={id}
      className={`bo-card scroll-mt-24 ${accent ? "relative transition-colors duration-300" : ""} ${className}`}
      style={accent ? { backgroundColor: hexToRgba(accent, active ? 0.06 : 0.025) } : undefined}
    >
      {accent && (
        <span
          aria-hidden
          className={`absolute left-0 top-0 bottom-0 w-1 transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0"}`}
          style={{ backgroundColor: accent }}
        />
      )}
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
              {title && (
                <h2 className="m-0 flex items-center gap-2.5 text-[18px] font-semibold leading-snug text-[#1d1d1f]">
                  {accent && <span aria-hidden className="shrink-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accent }} />}
                  {title}
                </h2>
              )}
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
