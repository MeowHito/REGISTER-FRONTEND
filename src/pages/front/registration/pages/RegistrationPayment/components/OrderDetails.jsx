import React from 'react';
import { Card } from 'antd';
import { useTranslation } from 'react-i18next';

const OrderDetails = ({ orderNo, currentStatus }) => {
  const { t } = useTranslation();

  return (
    <Card style={{ marginBottom: "20px", background: "#FAFAFA", borderRadius: "12px" }}>
      <div className="text-base font-semibold text-gray-800 mb-2">{t("back.reg.payment.orderDetail")}</div>
      <div className="flex flex-col gap-1 text-sm text-gray-700">
        <div className="flex flex-row gap-2">
          <div className="w-20">{t("back.reg.payment.orderNo")}:</div>
          <div className="font-semibold">{orderNo}</div>
        </div>
        <div className="flex flex-row gap-2">
          <div className="w-20">{t("back.reg.payment.status")}:</div>
          <div className={`font-semibold ${currentStatus === "SUCCESS" ? "text-success" : "!text-red-500"}`}>
            {t(`back.reg.payment.${currentStatus}`, { defaultValue: t("back.reg.payment.loading") })}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default OrderDetails;
