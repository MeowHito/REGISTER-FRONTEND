import React from 'react';
import { ClockCircleOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const Line = ({ label, children, valueClass = "font-semibold text-slate-800" }) => (
  <div className="flex items-center justify-between gap-3 text-slate-600">
    <span className="min-w-0">{label}</span>
    <span className={`shrink-0 text-right ${valueClass}`}>{children}</span>
  </div>
);

/**
 * "สรุปรายการสั่งซื้อ" card (Stitch #12): each charge, discounts, the one grand total the gateway
 * charges (fee included), and the payment deadline. The lines plus the fee add up to that total.
 */
const OrderSummary = ({
  itemCount = 0,
  totalShirtPrice,
  totalDeliveryFee,
  totalAddOns = 0,
  addOns = [],
  totalDiscount,
  totalCoupon,
  feePercent,
  feeAmount,
  totalAmountWithFee,
  paymentDueTH,
  formatMoney
}) => {
  const { t } = useTranslation();
  const baht = t("general.unitBaht");

  return (
    <section className="space-y-3.5 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <span className="flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-slate-800">
          <ShoppingOutlined className="text-[#4338ca]" />
          {t("back.reg.payment.orderSummary")}
        </span>
        {itemCount > 0 && (
          <span className="text-[13px] text-slate-400">{t("back.reg.payment.itemCount", { count: itemCount })}</span>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <Line label={t("back.reg.payment.totalRegFee")}>{formatMoney(totalShirtPrice)} {baht}</Line>
        <Line label={t("back.reg.payment.totalShipping")}>{formatMoney(totalDeliveryFee)} {baht}</Line>
        {totalAddOns > 0 && (
          <>
            <Line label={t("back.reg.addOn.title")}>{formatMoney(totalAddOns)} {baht}</Line>
            {addOns.map((a, i) => (
              <div key={i} className="flex justify-between gap-3 pl-3 text-[13px] text-slate-500">
                <span className="truncate">• {a.name}{a.qty > 1 ? ` × ${a.qty}` : ""}</span>
                <span className="shrink-0">{formatMoney(a.totalPrice)} {baht}</span>
              </div>
            ))}
          </>
        )}
        <Line
          label={
            <span className="flex items-center gap-1.5">
              {t("back.reg.common.discount")} ({t("back.reg.payment.noReceive")})
              <span className="rounded bg-emerald-50 px-1.5 text-[11px] text-emerald-600">{t("back.reg.payment.privilege")}</span>
            </span>
          }
          valueClass="font-medium text-red-500"
        >
          -{formatMoney(totalDiscount)} {baht}
        </Line>
        <Line label={t("back.reg.payment.couponDiscount")} valueClass="font-medium text-sky-600">
          -{formatMoney(totalCoupon)} {baht}
        </Line>
        {feePercent > 0 && (
          <Line label={`${t("back.reg.payment.fee")} ${feePercent}%`}>{formatMoney(feeAmount)} {baht}</Line>
        )}
      </div>

      <hr className="my-1 border-dashed border-slate-200" />

      <div className="flex items-baseline justify-between gap-3 pt-1">
        <span className="text-[15px] font-bold text-slate-900">{t("back.reg.payment.total")}</span>
        <span className="text-right">
          <span className="text-2xl font-bold tracking-tight text-[#4338ca]">{formatMoney(totalAmountWithFee)}</span>
          <span className="ml-1 text-sm font-semibold text-slate-700">{baht}</span>
        </span>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50/70 p-3">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <ClockCircleOutlined className="text-[12px]" />
        </span>
        <div className="text-[13px] leading-relaxed">
          <div className="font-medium text-rose-600">{t("back.reg.payment.dueIn")}</div>
          <div className="mt-0.5 font-bold text-rose-700">{paymentDueTH || "-"}</div>
        </div>
      </div>
    </section>
  );
};

export default OrderSummary;
