import { LeftOutlined } from "@ant-design/icons";

/**
 * Back-office page action row: an optional back link on the left and actions on the right.
 * The breadcrumb / title / subtitle block was removed on purpose (the sidebar and tabs already
 * say where you are); those props are still accepted so existing call sites keep working.
 */
export default function PageHeader({ backLabel, onBack, extra, className = "" }) {
  if (!onBack && !extra) return null;
  return (
    <div className={`bo-page-header mb-6 flex items-center justify-between flex-wrap gap-3 ${className}`}>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-[#0071e3] hover:text-[#005bbf] cursor-pointer"
        >
          <LeftOutlined className="text-[11px]" />
          {backLabel}
        </button>
      ) : (
        <span />
      )}
      {extra && <div className="flex items-center flex-wrap gap-2 shrink-0">{extra}</div>}
    </div>
  );
}
