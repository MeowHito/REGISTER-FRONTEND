import { Tag, Tooltip } from "antd";
import { GiftOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import numeral from "numeral";

const addOnName = (a, lang) => (lang === "en" ? a.nameEn || a.name : a.name) || "-";

/**
 * Read-only list of the add-ons (hotel, photo package, …) on an order or a
 * participant row, as returned in OrderAddOnDto. A per-order add-on has no
 * orderDetailId and is labelled as belonging to the whole order.
 */
export default function AddOnList({ items = [], showApplicant = true }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.toLowerCase();
  if (!items.length) return null;
  return (
    <div className="bo-inset divide-y divide-[#e5e5ea]">
      {items.map((a) => (
        <div key={a.id} className="flex items-start justify-between gap-4 px-4 py-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="shrink-0 w-8 h-8 rounded-lg bg-[rgba(0,113,227,0.1)] text-[#0071e3] flex items-center justify-center">
              <GiftOutlined />
            </span>
            <div className="min-w-0">
              <p className="m-0 text-sm font-semibold text-[#1d1d1f]">{addOnName(a, lang)}</p>
              <p className="m-0 mt-0.5 text-xs text-[#6e6e73]">
                {t("component.addOn.qty", { qty: a.qty ?? 1 })}
                {" · "}
                {a.orderDetailId
                  ? showApplicant && a.applicantName
                    ? a.applicantName
                    : t("component.addOn.perApplicant")
                  : t("component.addOn.perOrder")}
              </p>
              {a.note && (
                <p className="m-0 mt-1 text-xs text-[#424245] break-words">
                  <span className="text-[#6e6e73]">{a.noteLabel || t("component.addOn.note")}:</span> {a.note}
                </p>
              )}
            </div>
          </div>
          <span className="shrink-0 text-sm font-semibold text-[#1d1d1f] tabular-nums">
            ฿{numeral(a.totalPrice || 0).format("0,0.00")}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Compact tags for a table cell; details (note, whole-order) in the tooltip. */
export function AddOnTags({ items = [] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.toLowerCase();
  if (!items.length) return <span className="text-[#a1a1a6]">-</span>;
  return (
    <div className="flex flex-wrap gap-1 max-w-[260px]">
      {items.map((a) => (
        <Tooltip
          key={a.id}
          title={
            <div className="text-xs">
              <div>{a.orderDetailId ? t("component.addOn.perApplicant") : t("component.addOn.perOrder")}</div>
              {a.note && <div>{(a.noteLabel || t("component.addOn.note")) + ": " + a.note}</div>}
            </div>
          }
        >
          <Tag bordered={false} color="blue" className="!m-0 !text-xs">
            {addOnName(a, lang)}{(a.qty ?? 1) > 1 ? ` ×${a.qty}` : ""}
          </Tag>
        </Tooltip>
      ))}
    </div>
  );
}
