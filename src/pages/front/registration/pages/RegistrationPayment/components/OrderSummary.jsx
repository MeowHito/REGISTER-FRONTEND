import React from 'react';
import { Card, Row, Col, Divider } from 'antd';
import { useTranslation } from 'react-i18next';

const OrderSummary = ({
  totalShirtPrice,
  totalDeliveryFee,
  totalDiscount,
  totalCoupon,
  finalTotal,
  feePercent,
  feeAmount,
  totalAmountWithFee,
  paymentDueTH,
  formatMoney
}) => {
  const { t } = useTranslation();

  return (
    <Card style={{ marginBottom: "20px", background: "#FAFAFA", borderRadius: "12px" }}>
      <div className="text-base font-semibold text-gray-800 mb-3">{t("back.reg.payment.orderSummary")}</div>

      <Row className="text-sm text-gray-700">
        <Col span={16}>
          <div>{t("back.reg.payment.totalRegFee")}</div>
        </Col>
        <Col span={8}>
          <div className="text-right font-semibold">{formatMoney(totalShirtPrice)} {t("general.unitBaht")}</div>
        </Col>
      </Row>

      <Row className="text-sm text-gray-700 mt-1">
        <Col span={16}>
          <div>{t("back.reg.payment.totalShipping")}</div>
        </Col>
        <Col span={8}>
          <div className="text-right font-semibold">{formatMoney(totalDeliveryFee)} {t("general.unitBaht")}</div>
        </Col>
      </Row>

      <Row className="text-sm text-gray-700 mt-1">
        <Col span={16}>
          <div>{t("back.reg.common.discount")} ({t("back.reg.payment.noReceive")})</div>
        </Col>
        <Col span={8}>
          <div className="text-right !text-red-500">-{formatMoney(totalDiscount)} {t("general.unitBaht")}</div>
        </Col>
      </Row>

      <Row className="text-sm text-gray-700 mt-1">
        <Col span={16}>
          <div>{t("back.reg.payment.couponDiscount")}</div>
        </Col>
        <Col span={8}>
          <div className="text-right text-primary">-{formatMoney(totalCoupon)} {t("general.unitBaht")}</div>
        </Col>
      </Row>
      <Row className="text-sm text-gray-700 mt-1">
        <Col span={16}>
          <div>{t("back.reg.payment.total")}</div>
        </Col>
        <Col span={8}>
          <div className="text-right ">{formatMoney(finalTotal)}  {t("general.unitBaht")}</div>
        </Col>
      </Row>
      {feePercent > 0 && (
        <Row>
          <Col span={12}>
            <span>{t("back.reg.payment.fee")}  {feePercent}%</span>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <span>{formatMoney(feeAmount)}  {t("general.unitBaht")}</span>
          </Col>
        </Row>
      )}

      <Divider />

      <Row className="text-lg font-bold text-gray-800">
        <Col span={16}>
          <div>{t("back.reg.payment.total")}</div>
        </Col>
        <Col span={8}>
          <div className="text-right text-primary">{formatMoney(totalAmountWithFee)} {t("general.unitBaht")}</div>
        </Col>
      </Row>

      <Row className="mt-2">
        <Col span={24}>
          <div className="text-sm !text-red-500">
            {t("back.reg.payment.dueIn")} <span style={{ color: 'red' }} className="font-semibold">{paymentDueTH || "-"}</span>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default OrderSummary;
