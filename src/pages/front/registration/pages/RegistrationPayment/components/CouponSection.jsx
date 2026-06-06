import React from 'react';
import { Card, Row, Col, AutoComplete, Input, Button, Typography } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

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
      <Card
        style={{
          marginBottom: "20px",
          background: "#fff7e6",
          borderRadius: "12px",
          border: "1.5px solid #FFD591",
          boxShadow: "0 2px 8px rgba(255,185,70,0.06)"
        }}
      >
        <Row gutter={12} align="middle" justify="space-between" wrap={false}>
          <Col flex="none">
            <GiftOutlined style={{ fontSize: 24, color: "#faad14", marginRight: 10 }} />
          </Col>
          <Col flex="auto">
            <div style={{ position: 'relative' }}>
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
                style={{
                  width: '100%',
                  borderRadius: 8,
                }}
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
                  style={{
                    borderRadius: 8,
                    borderColor: "#FFD591",
                    background: "#fffbe6",
                    paddingRight: 24,
                    height: 40
                  }}
                  onPressEnter={handleApplyCoupon}
                />
              </AutoComplete>
              {couponMsg && couponMsgType === 'warning' && (
                <Text
                  className="!text-red-500"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    fontSize: 12,
                    fontFamily: "inherit",
                    marginTop: 1,
                    whiteSpace: 'nowrap',
                    padding: '2px 12px',
                    zIndex: 1
                  }}
                >
                  {couponMsg}
                </Text>
              )}
            </div>
          </Col>
          <Col flex="none">
            <Button
              type="primary"
              size="large"
              style={{
                background: "#FFB946",
                borderColor: "#FFD591",
                borderRadius: 8,
                marginLeft: 6,
                minWidth: 88,
                fontWeight: "bold"
              }}
              loading={isApplying}
              onClick={handleApplyCoupon}
            >
              {t("back.reg.payment.apply")}
            </Button>
          </Col>
        </Row>
      </Card>

      {totalCoupon > 0 && (
        <Card
          style={{
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
            borderRadius: 8,
            marginBottom: 20,
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
                  <li key={idx}>
                    <span className="text-[13px]">{a.idNo}</span>
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
