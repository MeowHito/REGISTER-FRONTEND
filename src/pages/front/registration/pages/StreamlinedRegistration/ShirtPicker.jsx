import React, { useEffect, useState } from "react";
import { Modal, Table, Input } from "antd";
import { SkinOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import CommonForm from "components/commonForm";
import BoxRadio from "./BoxRadio";

/** Per-applicant shirt style + size picker rendered as clickable boxes (design §3). */
const ShirtPicker = ({ index, ticketLabel, event, form }) => {
  const { t } = useTranslation();
  const shirtTypes = event?.shirtTypes || [];
  const [chartOpen, setChartOpen] = useState(false);

  const shirtTypeId = CommonForm.useWatch(["applicants", index, "shirtTypeId"], form);

  useEffect(() => {
    if (shirtTypes.length === 1 && !shirtTypeId) {
      const only = shirtTypes[0];
      const current = form.getFieldValue(["applicants", index]) || {};
      form.setFieldValue(["applicants", index], {
        ...current, shirtTypeId: only.id, shirtTypeName: only.name, noShirt: false,
      });
    }
  }, [shirtTypes.length, shirtTypeId]);

  if (shirtTypes.length === 0) {
    return (
      <div className="rounded-xl border border-[#bfc7d2] bg-white px-5 py-4 text-sm text-[#3f4850]">
        {t("back.reg.common.applicantInfo")} #{index + 1} — {t("front.eventDetail.noShirtInfo")}
      </div>
    );
  }

  const handleType = (id) => {
    const stype = shirtTypes.find((s) => s.id === id);
    const current = form.getFieldValue(["applicants", index]) || {};
    form.setFieldValue(["applicants", index], {
      ...current, shirtTypeId: id, shirtTypeName: stype?.name,
      shirtSizeId: undefined, shirtSizeName: undefined, shirtSizeLength: undefined, noShirt: false,
    });
  };

  const handleSize = (id) => {
    const size = shirtTypes.flatMap((s) => s.shirtSizes || []).find((s) => s.id === id);
    const current = form.getFieldValue(["applicants", index]) || {};
    form.setFieldValue(["applicants", index], {
      ...current, shirtSizeId: id, shirtSizeName: size?.name,
      shirtSizeLength: size?.lengthSize, shirtSizeChestSize: size?.chestSize, noShirt: false,
    });
  };

  const activeType = shirtTypes.find((s) => s.id === shirtTypeId);
  const sizeOptions = (activeType?.shirtSizes || []).map((s) => ({
    value: s.id,
    label: s.chestSize ? `${s.name} : ${t("front.eventDetail.chest")} ${s.chestSize}"` : s.name,
  }));

  return (
    <div className="rounded-xl border border-[#bfc7d2] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#e5e9eb] bg-[#f1f4f6]">
        <span className="font-bold text-[#181c1e]">
          {t("back.reg.common.applicantInfo")} #{index + 1}
        </span>
        {ticketLabel ? (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#cce5ff] text-[#006193]">
            {ticketLabel}
          </span>
        ) : null}
      </div>

      <div className="p-5 space-y-6">
        {shirtTypes.length > 1 ? (
          <div>
            <label className="block text-sm font-bold text-[#3f4850] mb-3">
              เลือกแบบเสื้อ (Shirt Style) <span className="text-[#ba1a1a]">*</span>
            </label>
            <CommonForm.Item name={["applicants", index, "shirtTypeId"]} className="!mb-0"
              rules={[{ required: true, message: t("required.shirtType") }]}>
              <BoxRadio columns={2}
                options={shirtTypes.map((s) => ({ value: s.id, label: s.name, icon: <SkinOutlined /> }))}
                onChange={handleType} />
            </CommonForm.Item>
          </div>
        ) : (
          // Single shirt type: keep the field registered so useWatch tracks the
          // auto-selected value and the size options render.
          <CommonForm.Item name={["applicants", index, "shirtTypeId"]} hidden noStyle>
            <Input type="hidden" />
          </CommonForm.Item>
        )}

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-bold text-[#3f4850]">
              เลือกไซส์ (Shirt Size) <span className="text-[#ba1a1a]">*</span>
            </label>
            {activeType?.shirtSizes?.length ? (
              <button type="button" onClick={() => setChartOpen(true)}
                className="text-[#006193] text-xs font-bold flex items-center gap-1 hover:underline">
                📏 Size Chart
              </button>
            ) : null}
          </div>
          <CommonForm.Item name={["applicants", index, "shirtSizeId"]} className="!mb-0"
            rules={[{ required: true, message: t("required.shirtSize") }]}>
            <BoxRadio columns={2} options={sizeOptions} onChange={handleSize} />
          </CommonForm.Item>
          {!activeType && (
            <p className="text-xs text-[#3f4850] mt-2">{t("back.reg.payment.selectShirtType")}</p>
          )}
        </div>
      </div>

      <Modal open={chartOpen} onCancel={() => setChartOpen(false)} footer={null}
        title={`${t("back.reg.payment.shirtSize")} — ${activeType?.name || ""}`}>
        <Table size="small" pagination={false} rowKey="id"
          dataSource={activeType?.shirtSizes || []}
          columns={[
            { title: t("front.eventDetail.size"), dataIndex: "name" },
            { title: `${t("front.eventDetail.chest")} (${t("front.eventDetail.inch")})`, dataIndex: "chestSize" },
            { title: `${t("front.eventDetail.length")} (${t("front.eventDetail.inch")})`, dataIndex: "lengthSize" },
          ]} />
      </Modal>
    </div>
  );
};

export default ShirtPicker;
