import React from 'react';
import { Card, Row, Col, Typography, Spin } from 'antd';
import { BankOutlined, CreditCardOutlined, QrcodeOutlined, WalletOutlined } from '@ant-design/icons';
import { TrueMoneyIcon, RabbitLinePayIconComponent, AlipayIconComponent, WechatIconComponent } from 'components/CustomIcons';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

// Methods the legacy SCB / 2C2P gateways serve, used until the backend reports mPAY.
const LEGACY_METHODS = ['qrcode', 'creditcard', 'ewallet', 'alipay', 'wechatpay'];

const PaymentMethods = ({ selectedPayment, handlePaymentSelection, options, optionsLoading, selectedBank, onSelectBank }) => {
  const { t } = useTranslation();

  const renderCard = (type, icon, label) => (
    <Card
      className={`payment-option-card ${selectedPayment === type ? 'selected' : ''}`}
      hoverable
      onClick={() => handlePaymentSelection(type)}
      // antd's 24px body padding left a two-column card on a 360px phone ~80px for its label
      styles={{ body: { padding: 0 } }}
      style={{
        border: selectedPayment === type ? "2px solid #4f46e5" : "1px solid #ddd",
        textAlign: "center",
        padding: "8px",
        height: "100px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "14px",
        transition: "all 0.3s",
        boxShadow: selectedPayment === type ? "0 0 0 3px rgba(79, 70, 229, 0.12)" : "none"
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        {icon}
        <Text style={{ fontFamily: "inherit", fontSize: '13px', lineHeight: 1.2, textAlign: 'center', color: selectedPayment === type ? "#000" : "#555" }}>
          {/* breaks only at spaces: "สแกนจ่าย/โอนเงิน / (QR Code)", never inside a word */}
          {String(label).split(" ").map((w, i) => (
            <React.Fragment key={i}>{i > 0 ? " " : null}<span className="inline-block">{w}</span></React.Fragment>
          ))}
        </Text>
      </div>
    </Card>
  );

  const iconColor = (type, idle = "#666") => (selectedPayment === type ? "#4f46e5" : idle);

  // Two per row on every screen; an odd last one stretches across the full width.
  const allMethods = [
    { type: 'qrcode', label: t("back.reg.payment.payWithQR"),
      icon: <QrcodeOutlined style={{ fontSize: '24px', color: selectedPayment === 'qrcode' ? "#4f46e5" : "#666" }} /> },
    { type: 'creditcard', label: t("back.reg.payment.payWithCard"),
      icon: <CreditCardOutlined style={{ fontSize: '24px', color: selectedPayment === 'creditcard' ? "#4f46e5" : "#999" }} /> },
    { type: 'ewallet', label: t("back.reg.payment.payWithEWallet"),
      icon: (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", maxWidth: "100%" }}>
          <RabbitLinePayIconComponent sizew={78} sizeh={26} />
          <TrueMoneyIcon sizew={48} sizeh={36} />
        </div>
      ) },
    { type: 'alipay', label: "Alipay", icon: <AlipayIconComponent sizew={78} sizeh={26} /> },
    { type: 'wechatpay', label: "WeChatPay", icon: <WechatIconComponent sizew={78} sizeh={26} /> },
    { type: 'mobilebanking', label: t("back.reg.payment.payWithMobileBanking"),
      icon: <BankOutlined style={{ fontSize: '24px', color: iconColor('mobilebanking') }} /> },
    { type: 'linepay', label: t("back.reg.payment.payWithLinePay"), icon: <RabbitLinePayIconComponent sizew={78} sizeh={26} /> },
    { type: 'shopeepay', label: t("back.reg.payment.payWithShopeePay"),
      icon: <WalletOutlined style={{ fontSize: '24px', color: iconColor('shopeepay') }} /> },
    { type: 'paotang', label: t("back.reg.payment.payWithPaotang"),
      icon: <WalletOutlined style={{ fontSize: '24px', color: iconColor('paotang') }} /> },
  ];
  const offered = options?.methods?.length ? options.methods : LEGACY_METHODS;
  // Keep the backend's order (QR first, then card, banking, wallets).
  const methods = offered.map((type) => allMethods.find((m) => m.type === type)).filter(Boolean);
  const lastIsAlone = methods.length % 2 === 1;
  const banks = options?.banks || [];

  return (
    <section id="payment-methods" className="scroll-mt-20 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.08)]">
      <Title level={5} style={{ fontFamily: "inherit", marginTop: 0 }}>{t("back.reg.payment.selectMethod")}</Title>
      {optionsLoading ? (
        <div className="flex justify-center py-6"><Spin /></div>
      ) : (
        <Row gutter={[12, 12]}>
          {methods.map((m, i) => (
            <Col key={m.type} span={lastIsAlone && i === methods.length - 1 ? 24 : 12}>
              {renderCard(m.type, m.icon, m.label)}
            </Col>
          ))}
        </Row>
      )}
      {selectedPayment === 'mobilebanking' && banks.length > 0 && (
        <div id="payment-banks" className="mt-4 scroll-mt-20">
          <Text strong style={{ fontFamily: "inherit" }}>{t("back.reg.payment.selectBank")}</Text>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
            {banks.map((b) => (
              <button
                key={b.code}
                type="button"
                onClick={() => onSelectBank?.(b.code)}
                className="h-11 rounded-xl text-sm font-semibold transition-all"
                style={{
                  border: selectedBank === b.code ? "2px solid #4f46e5" : "1px solid #ddd",
                  background: selectedBank === b.code ? "#eef2ff" : "#fff",
                  color: selectedBank === b.code ? "#000" : "#555",
                }}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default PaymentMethods;
