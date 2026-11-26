import React from 'react';
import { Card, AutoComplete, Input, Button, Typography } from 'antd';
import { GiftOutlined, TagOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

// Only the last 4 characters of an ID card / passport number are shown on screen.
const maskIdNo = (idNo) => {
  const v = String(idNo || "").trim();
  return v.length <= 4 ? v : `${"•".repeat(Math.min(v.length - 4, 9))}${v.slice(-4)}`;
};

const CouponSection = ({
  availableCoupons,
  couponCode,
  setCouponCode,
  setCouponType,
  handleApplyCoupon,
  handleApplyCouponSelected,
  handleRemoveCoupon,
  isApplying,
  couponMsg,
  couponMsgType,
  setCouponMsg,
  setCouponMsgType,
  totalCoupon,
  couponMeta,
  applicants
}) => {
  const { t } = useTranslation();

  return (
    <>
      <section className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/70 via-amber-50/30 to-orange-50/40 p-4 shadow-sm">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
            <GiftOutlined />
          </span>
          <span className="text-sm font-semibold tracking-wide text-amber-900">{t("back.reg.payment.couponTitle")}</span>
        </div>
        <div className="flex items-start gap-2">
          <div className="relative min-w-0 flex-1">
            <AutoComplete
              options={availableCoupons.map(coupon => ({
                value: coupon.couponCode,
                label: (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 500, color: "#096dd9" }}>
                      {coupon.couponName || coupon.couponCode}
                    </span>
                    <span style={{ fontSize: 12, color: "#888" }}>
                      {t("back.reg.common.discount")} {coupon.deductionPercentage}%
                    </span>
                  </div>
                ),
                couponType: coupon.type,
              }))}
              className="w-full"
              size="large"
              placeholder={t("back.reg.payment.placeholder")}
              value={couponCode}
              allowClear
              onChange={(value, option) => {
                setCouponCode(value);
                if (option) setCouponType(option.couponType);
                if (!value) {
                  setCouponMsg('');
                  setCouponMsgType('');
                }
              }}
              onSelect={(value, option) => {
                setCouponCode(value);
                setCouponType(option.couponType);
                setCouponMsg('');
                setCouponMsgType('');
                handleApplyCouponSelected(value, availableCoupons, option.couponType);
              }}
              disabled={isApplying}
              notFoundContent={availableCoupons.length === 0 ? t("back.reg.payment.notFound") : null}
            >
              <Input
                className="!h-11 !rounded-xl !border-amber-200 !bg-white !text-base"
                suffix={<TagOutlined className="text-slate-300" />}
                onPressEnter={handleApplyCoupon}
              />
            </AutoComplete>
            {couponMsg && couponMsgType === 'warning' && (
              <Text className="!text-red-500 block mt-1 !text-[13px] px-1" style={{ fontFamily: "inherit" }}>
                {couponMsg}
              </Text>
            )}
          </div>
          <Button
            type="primary"
            size="large"
            className="!h-11 !rounded-xl !border-0 !bg-gradient-to-r !from-amber-400 !to-amber-500 !px-4 !font-semibold !text-white !shadow-[0_4px_14px_-2px_rgba(245,158,11,0.45)] shrink-0"
            loading={isApplying}
            onClick={handleApplyCoupon}
          >
            {t("back.reg.payment.apply")}
          </Button>
        </div>
      </section>

      {totalCoupon > 0 && (
        <Card
          style={{
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
            borderRadius: 16,
            marginTop: 12,
            padding: "0px",
            position: "relative",
            boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
          }}
        >
          <Button
            type="link"
            danger
            size="small"
            style={{
              position: "absolute",
              top: 8,
              right: 12,
              padding: 0,
              fontSize: "13px",
            }}
            onClick={handleRemoveCoupon}
          >
            {t("general.buttonCancel")}
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <GiftOutlined style={{ fontSize: 24, color: "#52c41a" }} />
            <div>
              <div className="font-semibold text-[16px] text-success">
                {t("back.reg.payment.appliedSuccess")}
              </div>
              <div className="text-sm text-gray-600">
                {t("back.reg.payment.code")}: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-sm">
                  {couponMeta.couponCode}
                </span> — {t("back.reg.common.discount")} {couponMeta.deductionPercentage}%
              </div>
            </div>
          </div>

          <div style={{ paddingLeft: 36 }}>
            <div className="text-[13px] text-[#595959]">{t("back.reg.payment.validFor")}: </div>
            <ul style={{ margin: "4px 0 0 0", paddingLeft: 20 }}>
              {applicants
                .filter(a => a.couponApplied)
                .map((a, idx) => (
                  <li key={idx} className="text-[13px]">
                    {[a.firstName, a.lastName].filter(Boolean).join(" ")}
                    {a.idNo ? <span className="ml-1 font-mono text-gray-500">({maskIdNo(a.idNo)})</span> : null}
                  </li>
                ))}
            </ul>
          </div>
        </Card>
      )}
    </>
  );
};

export default CouponSection;
