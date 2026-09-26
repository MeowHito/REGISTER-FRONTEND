import React, { useEffect, useState } from "react";
import { Modal, Table, Input } from "antd";
import { SkinOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import CommonForm from "components/commonForm";
import BoxRadio from "./BoxRadio";
import { shirtCategoriesFor } from "./shirts";

const CATEGORY_LABEL = {
  RACE: "เสื้อแข่งขัน (Race Shirt)",
  FINISHER: "เสื้อ Finisher (Finisher Shirt)",
  SPECIAL: "เสื้อพิเศษ (Special Shirt)",
};


/**
 * One category block: style boxes + size boxes. The race shirt writes to the applicant's
 * shirtTypeId/shirtSizeId (what the backend and every report already read); finisher and
 * special shirts write to applicant.extraShirts[category].
 */
const CategoryBlock = ({ index, category, styles, form, t }) => {
  const [chartOpen, setChartOpen] = useState(false);
  const isRace = category === "RACE";
  const typePath = isRace ? ["applicants", index, "shirtTypeId"] : ["applicants", index, "extraShirts", category, "shirtTypeId"];
  const sizePath = isRace ? ["applicants", index, "shirtSizeId"] : ["applicants", index, "extraShirts", category, "shirtSizeId"];
  const shirtTypeId = CommonForm.useWatch(typePath, form);

  const write = (patch) => {
    const current = form.getFieldValue(["applicants", index]) || {};
    if (isRace) {
      form.setFieldValue(["applicants", index], { ...current, ...patch, noShirt: false });
    } else {
      const extra = { ...(current.extraShirts || {}) };
      extra[category] = { ...(extra[category] || {}), ...patch, category };
      form.setFieldValue(["applicants", index], { ...current, extraShirts: extra });
    }
  };

  useEffect(() => {
    if (styles.length === 1 && !shirtTypeId) {
      write({ shirtTypeId: styles[0].id, shirtTypeName: styles[0].name });
    }
  }, [styles.length, shirtTypeId]);

  const handleType = (id) => {
    const stype = styles.find((s) => s.id === id);
    write({ shirtTypeId: id, shirtTypeName: stype?.name, shirtSizeId: undefined, shirtSizeName: undefined,
      shirtSizeLength: undefined, shirtSizeChestSize: undefined });
  };

  const handleSize = (id) => {
    const size = styles.flatMap((s) => s.shirtSizes || []).find((s) => s.id === id);
    write({ shirtSizeId: id, shirtSizeName: size?.name, shirtSizeLength: size?.lengthSize, shirtSizeChestSize: size?.chestSize });
  };

  const activeType = styles.find((s) => s.id === shirtTypeId);
  const sizes = [...(activeType?.shirtSizes || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const sizeOptions = sizes.map((s) => ({
    value: s.id,
    label: s.chestSize ? `${s.name} : ${t("front.eventDetail.chest")} ${s.chestSize}"` : s.name,
  }));

  return (
    <div className="space-y-4">
      <div className="text-sm font-bold text-[#006193] border-b border-[#e5e9eb] pb-1">{CATEGORY_LABEL[category]}</div>
      {styles.length > 1 ? (
        <div>
          <label className="block text-sm font-bold text-[#3f4850] mb-3">
            เลือกแบบเสื้อ (Shirt Style) <span className="text-[#ba1a1a]">*</span>
          </label>
          <CommonForm.Item name={typePath} className="!mb-0" rules={[{ required: true, message: t("required.shirtType") }]}>
            <BoxRadio columns={2}
              options={styles.map((s) => ({ value: s.id, label: s.name, icon: <SkinOutlined />, sub: s.description }))}
              onChange={handleType} />
          </CommonForm.Item>
        </div>
      ) : (
        <CommonForm.Item name={typePath} hidden noStyle>
          <Input type="hidden" />
        </CommonForm.Item>
      )}

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-bold text-[#3f4850]">
            เลือกไซส์ (Shirt Size) <span className="text-[#ba1a1a]">*</span>
          </label>
          {sizes.length ? (
            <button type="button" onClick={() => setChartOpen(true)}
              className="text-[#006193] text-xs font-bold flex items-center gap-1 hover:underline">
              📏 Size Chart
            </button>
          ) : null}
        </div>
        <CommonForm.Item name={sizePath} className="!mb-0" rules={[{ required: true, message: t("required.shirtSize") }]}>
          <BoxRadio columns={2} options={sizeOptions} onChange={handleSize} />
        </CommonForm.Item>
        {!activeType && <p className="text-xs text-[#3f4850] mt-2">{t("back.reg.payment.selectShirtType")}</p>}
      </div>

      <Modal open={chartOpen} onCancel={() => setChartOpen(false)} footer={null}
        title={`${t("back.reg.payment.shirtSize")} — ${activeType?.name || ""}`}>
        <Table size="small" pagination={false} rowKey="id" dataSource={sizes}
          columns={[
            { title: t("front.eventDetail.size"), dataIndex: "name" },
            { title: `${t("front.eventDetail.chest")} (${t("front.eventDetail.inch")})`, dataIndex: "chestSize" },
            { title: `${t("front.eventDetail.length")} (${t("front.eventDetail.inch")})`, dataIndex: "lengthSize" },
          ]} />
      </Modal>
    </div>
  );
};

/** Per-applicant shirt picker: one block per shirt category this distance offers. */
const ShirtPicker = ({ index, ticketLabel, event, form, eventTypeId }) => {
  const { t } = useTranslation();
  const groups = shirtCategoriesFor(event, eventTypeId);

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-[#bfc7d2] bg-white px-5 py-4 text-sm text-[#3f4850]">
        {t("back.reg.common.applicantInfo")} #{index + 1} — {t("front.eventDetail.noShirtInfo")}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#bfc7d2] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#e5e9eb] bg-[#f1f4f6]">
        <span className="font-bold text-[#181c1e]">{t("back.reg.common.applicantInfo")} #{index + 1}</span>
        {ticketLabel ? (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#cce5ff] text-[#006193]">{ticketLabel}</span>
        ) : null}
      </div>
      <div className="p-5 space-y-6">
        {groups.map(({ category, styles }) => (
          <CategoryBlock key={category} index={index} category={category} styles={styles} form={form} t={t} />
        ))}
      </div>
    </div>
  );
};

export default ShirtPicker;
