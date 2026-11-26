import React from 'react';
import { FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import CopyButton from 'components/copyButton';

/** "รายละเอียดใบสมัคร": order number with a copy button and the payment status pill (Stitch #12). */
const OrderDetails = ({ orderNo, currentStatus }) => {
  const { t } = useTranslation();
  const paid = currentStatus === "SUCCESS";
  const pending = !currentStatus || currentStatus === "PENDING";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.08)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4f46e5] to-indigo-400" />
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-[#4338ca]">
            <FileTextOutlined />
          </span>
          <span className="text-[15px] font-semibold text-slate-800">{t("back.reg.payment.orderDetail")}</span>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
            paid
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : pending
                ? "border-amber-200/60 bg-amber-50 text-amber-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${paid ? "bg-emerald-500" : pending ? "bg-amber-500 animate-pulse" : "bg-rose-500"}`} />
          {t(`back.reg.payment.${currentStatus || "PENDING"}`, { defaultValue: t("back.reg.payment.loading") })}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
        <div className="min-w-0">
          <span className="block text-xs text-slate-400">{t("back.reg.payment.orderNo")}</span>
          <span className="block truncate font-mono text-[15px] font-semibold tracking-wider text-slate-800">{orderNo || "-"}</span>
        </div>
        {orderNo ? <CopyButton text={orderNo} label className="!text-[#4338ca]" /> : null}
      </div>
    </section>
  );
};

export default OrderDetails;
