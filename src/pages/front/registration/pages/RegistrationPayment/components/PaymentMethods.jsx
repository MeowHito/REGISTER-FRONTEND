import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { CreditCardOutlined, QrcodeOutlined } from '@ant-design/icons';
import { TrueMoneyIcon, RabbitLinePayIconComponent, AlipayIconComponent, WechatIconComponent } from 'components/CustomIcons';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

const PaymentMethods = ({ selectedPayment, handlePaymentSelection }) => {
  const { t } = useTranslation();

  const renderCard = (type, icon, label) => (
    <Card
      className={`payment-option-card ${selectedPayment === type ? 'selected' : ''}`}
      hoverable
      onClick={() => handlePaymentSelection(type)}
      style={{
        border: selectedPayment === type ? "2px solid #FFB946" : "1px solid #ddd",
        textAlign: "center",
        padding: "8px",
        height: "100px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "6px",
        transition: "all 0.3s",
        boxShadow: selectedPayment === type ? "0 0 8px rgba(255, 185, 70, 0.5)" : "none"
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        {icon}
        <Text style={{ fontFamily: "inherit", fontSize: '13px', lineHeight: 1.2, textAlign: 'center', color: selectedPayment === type ? "#000" : "#555" }}>
          {label}
        </Text>
      </div>
    </Card>
  );

  // Two per row on every screen; an odd last one stretches across the full width.
  const methods = [
    { type: 'qrcode', label: t("back.reg.payment.payWithQR"),
      icon: <QrcodeOutlined style={{ fontSize: '24px', color: selectedPayment === 'qrcode' ? "#FFB946" : "#666" }} /> },
    { type: 'creditcard', label: t("back.reg.payment.payWithCard"),
      icon: <CreditCardOutlined style={{ fontSize: '24px', color: selectedPayment === 'creditcard' ? "#FFB946" : "#999" }} /> },
    { type: 'ewallet', label: t("back.reg.payment.payWithEWallet"),
      icon: (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", maxWidth: "100%" }}>
          <RabbitLinePayIconComponent sizew={78} sizeh={26} />
          <TrueMoneyIcon sizew={48} sizeh={36} />
        </div>
      ) },
    { type: 'alipay', label: "Alipay", icon: <AlipayIconComponent sizew={78} sizeh={26} /> },
    { type: 'wechatpay', label: "WeChatPay", icon: <WechatIconComponent sizew={78} sizeh={26} /> },
  ];
  const lastIsAlone = methods.length % 2 === 1;

  return (
    <div id="payment-methods" className="scroll-mt-20">
      <Title level={5} style={{ fontFamily: "inherit" }}>{t("back.reg.payment.selectMethod")}</Title>
      <Row gutter={[12, 12]}>
        {methods.map((m, i) => (
          <Col key={m.type} span={lastIsAlone && i === methods.length - 1 ? 24 : 12}>
            {renderCard(m.type, m.icon, m.label)}
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default PaymentMethods;
