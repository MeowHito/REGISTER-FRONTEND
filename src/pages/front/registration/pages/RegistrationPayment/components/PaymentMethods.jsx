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
        padding: "10px",
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
        <Text style={{ fontFamily: "inherit", fontSize: '14px', color: selectedPayment === type ? "#000" : "#555" }}>
          {label}
        </Text>
      </div>
    </Card>
  );

  return (
    <>
      <Title level={5} style={{ fontFamily: "inherit" }}>{t("back.reg.payment.selectMethod")}</Title>
      <Row gutter={[16, 16]}>
        <Col span={12} xs={24} sm={12} md={12} lg={12}>
          {renderCard('qrcode', <QrcodeOutlined style={{ fontSize: '24px', color: selectedPayment === 'qrcode' ? "#FFB946" : "#666" }} />, t("back.reg.payment.payWithQR"))}
        </Col>
        <Col span={12} xs={24} sm={12} md={12} lg={12}>
          {renderCard('creditcard', <CreditCardOutlined style={{ fontSize: '24px', color: selectedPayment === 'creditcard' ? "#FFB946" : "#999" }} />, t("back.reg.payment.payWithCard"))}
        </Col>
        <Col span={12} xs={24} sm={12} md={12} lg={12}>
          {renderCard('ewallet',
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <RabbitLinePayIconComponent sizew={104} sizeh={34} />
              <TrueMoneyIcon sizew={64} sizeh={48} />
            </div>,
            t("back.reg.payment.payWithEWallet")
          )}
        </Col>
        <Col span={12} xs={24} sm={12} md={12} lg={12}>
          {renderCard('alipay', <AlipayIconComponent sizew={104} sizeh={34} />, "Alipay")}
        </Col>
        <Col span={12} xs={24} sm={12} md={12} lg={12}>
          {renderCard('wechatpay', <WechatIconComponent sizew={104} sizeh={34} />, "WeChatPay")}
        </Col>
      </Row>
    </>
  );
};

export default PaymentMethods;
