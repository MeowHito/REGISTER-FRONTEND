import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * Back-office page title block: optional breadcrumb or back link, a title with
 * an optional count / tag, a subtitle, and actions on the right.
 */
export default function PageHeader({
  menu,
  breadcrumb,
  backLabel,
  onBack,
  title,
  count,
  tag,
  subtitle,
  extra,
  className = "",
}) {
  const { t } = useTranslation();
  // `menu` = a back.menu.<key> entry: its name/desc are the default title/subtitle.
  if (menu) {
    title = title ?? t(`back.menu.${menu}.name`);
    subtitle = subtitle ?? t(`back.menu.${menu}.desc`);
  }
  return (
    <div className={`mb-6 ${className}`}>
      {breadcrumb?.length > 0 && (
        <nav className="flex items-center flex-wrap gap-1.5 text-xs text-[#6e6e73] mb-2">
          {breadcrumb.map((item, i) => (
            <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <RightOutlined className="text-[9px]" />}
              {item.to ? (
                <Link to={item.to} className="!text-[#6e6e73] hover:!text-[#0071e3]">
                  {item.label}
                </Link>
              ) : (
                <span className={i === breadcrumb.length - 1 ? "text-[#1d1d1f] font-semibold" : ""}>
                  {item.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-[#0071e3] hover:text-[#005bbf] mb-2 cursor-pointer"
        >
          <LeftOutlined className="text-[11px]" />
          {backLabel}
        </button>
      )}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center flex-wrap gap-3">
            <h1 className="text-[24px] md:text-[28px] font-bold leading-tight tracking-[-0.015em] text-[#1d1d1f] m-0">
              {title}
            </h1>
            {count !== undefined && count !== null && (
              <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2.5 rounded-full bg-[rgba(0,0,0,0.06)] text-[13px] font-semibold text-[#424245]">
                {count}
              </span>
            )}
            {tag}
          </div>
          {subtitle && <p className="mt-1.5 mb-0 text-sm text-[#6e6e73] leading-relaxed">{subtitle}</p>}
        </div>
        {extra && <div className="flex items-center flex-wrap gap-2 shrink-0">{extra}</div>}
      </div>
    </div>
  );
}
