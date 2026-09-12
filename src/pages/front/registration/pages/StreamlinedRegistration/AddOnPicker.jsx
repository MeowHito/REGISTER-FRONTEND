import React from "react";
import { Input } from "antd";
import { CheckCircleOutlined, GiftOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import useBilingual from "./useBilingual";

/**
 * "Anything else?" step — the optional packages the organizer attached to this
 * event (accommodation, photos, shuttle…).
 *
 * Two shapes, decided per add-on by the organizer's `perApplicant` flag:
 *  - per order      → a quantity stepper (2 hotel rooms for a group of four)
 *  - per applicant  → one tick box per runner
 *
 * Selections live in the parent's `selections` state, keyed by add-on id:
 *   { [addOnId]: { qty, applicants: { [index]: true }, note } }
 */

const money = (n) => (Number(n) || 0).toLocaleString();

/** Strip the tiptap HTML down to a short preview line. */
const plainText = (html) => {
  if (!html) return "";
  const text = String(html).replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return text;
};

const AddOnCard = ({ addOn, selection, applicants, lang, onChange }) => {
  const { t } = useTranslation();
  const bi = useBilingual();

  const isEn = lang === "en";
  const name = (isEn && addOn.nameEn) || addOn.name;
  const description = (isEn && addOn.descriptionEn) || addOn.description;
  const noteLabel = (isEn && addOn.noteLabelEn) || addOn.noteLabel;

  const perApplicant = !!addOn.perApplicant;
  const qty = selection?.qty || 0;
  const pickedApplicants = selection?.applicants || {};
  const pickedCount = perApplicant ? Object.values(pickedApplicants).filter(Boolean).length : qty;
  const isPicked = pickedCount > 0;

  const remaining = addOn.availableQuota; // null = unlimited
  const soldOut = addOn.isSoldOut || (remaining != null && remaining <= 0);

  // A per-order add-on is capped by both the organizer's per-order limit and
  // whatever stock is left; a per-applicant one by the number of runners.
  const maxQty = perApplicant
    ? applicants.length
    : Math.min(addOn.maxPerOrder ?? Infinity, remaining ?? Infinity);

  const setQty = (next) => {
    const clamped = Math.max(0, Math.min(next, maxQty === Infinity ? 99 : maxQty));
    onChange({ ...selection, qty: clamped });
  };

  const toggleApplicant = (index) => {
    const next = { ...pickedApplicants, [index]: !pickedApplicants[index] };
    if (!next[index]) delete next[index];
    // Never let per-runner ticks exceed what's left in stock.
    if (remaining != null && Object.values(next).filter(Boolean).length > remaining) return;
    onChange({ ...selection, applicants: next });
  };

  const lineTotal = pickedCount * (Number(addOn.price) || 0);

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all ${
        soldOut
          ? "border-[#bfc7d2] bg-[#f1f4f6] opacity-80"
          : isPicked
            ? "border-[#006193] border-2 bg-white"
            : "border-[#bfc7d2] bg-white"
      }`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#181c1e] flex items-center gap-2">
              <GiftOutlined className="text-[#fe9400]" />
              {name}
            </h3>
            {description ? (
              <p className="text-sm text-[#3f4850] mt-1 whitespace-pre-line">{plainText(description)}</p>
            ) : null}

            <div className="flex items-center gap-2 flex-wrap mt-2">
              <span className="text-[#006193] font-bold text-lg">
                {money(addOn.price)} {t("general.unitBaht")}
              </span>
              <span className="text-xs text-[#3f4850]">
                {perApplicant ? bi("back.reg.addOn.perPerson") : bi("back.reg.addOn.perUnit")}
              </span>
            </div>

            {soldOut ? (
              <p className="text-sm font-bold text-[#ba1a1a] mt-1">{bi("back.reg.addOn.soldOut")}</p>
            ) : remaining != null ? (
              <p className="text-xs text-[#3f4850] mt-1">
                {bi("back.reg.addOn.remaining", { count: remaining })}
              </p>
            ) : null}
          </div>

          {!soldOut && !perApplicant ? (
            <div className="flex items-center gap-3 bg-[#ebeef0] rounded-full p-1 border border-[#bfc7d2] shrink-0">
              <button
                type="button"
                onClick={() => setQty(qty - 1)}
                disabled={qty === 0}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#006193] hover:bg-[#e0e3e5] disabled:text-[#bfc7d2] text-xl font-bold"
              >
                −
              </button>
              <span className="w-5 text-center font-bold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                disabled={maxQty !== Infinity && qty >= maxQty}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-[#006193] text-white shadow hover:opacity-90 disabled:bg-[#bfc7d2] text-xl font-bold"
              >
                +
              </button>
            </div>
          ) : null}
        </div>

        {!soldOut && perApplicant ? (
          <div className="mt-4 space-y-2">
            <label className="block text-sm font-bold text-[#3f4850]">
              {bi("back.reg.addOn.chooseApplicants")}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {applicants.map((a, i) => {
                const on = !!pickedApplicants[i];
                const label = `${a?.firstName || ""} ${a?.lastName || ""}`.trim()
                  || `${t("back.reg.common.applicantNumber")} ${i + 1}`;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleApplicant(i)}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg text-left transition-all ${
                      on ? "border-[#006193] bg-[#cce5ff]" : "border-[#bfc7d2] bg-white hover:border-[#006193]"
                    }`}
                  >
                    <span className="flex-1 text-sm font-bold text-[#181c1e] truncate">{label}</span>
                    {on ? <CheckCircleOutlined className="text-[#006193]" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {!soldOut && isPicked && noteLabel ? (
          <div className="mt-4 space-y-2">
            <label className="block text-sm font-bold text-[#3f4850]">
              {noteLabel}
              {addOn.noteRequired ? <span className="text-[#ba1a1a]"> *</span> : null}
            </label>
            <Input.TextArea
              rows={2}
              maxLength={500}
              value={selection?.note || ""}
              onChange={(e) => onChange({ ...selection, note: e.target.value })}
              className="!rounded-lg !border-[#bfc7d2] !text-base"
              placeholder={noteLabel}
            />
          </div>
        ) : null}

        {isPicked ? (
          <div className="mt-3 pt-3 border-t border-[#e5e9eb] flex justify-between text-sm">
            <span className="text-[#3f4850]">
              {money(addOn.price)} × {pickedCount}
            </span>
            <span className="font-bold text-[#006193]">
              {money(lineTotal)} {t("general.unitBaht")}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const AddOnPicker = ({ addOns, applicants, selections, onChange, lang }) => {
  const bi = useBilingual();

  // Group by the organizer's optional category heading ("ที่พัก", "รูปถ่าย"…).
  const groups = [];
  addOns.forEach((a) => {
    const key = a.category?.trim() || "";
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, items: [] };
      groups.push(group);
    }
    group.items.push(a);
  });

  return (
    <div className="space-y-5">
      <p className="text-sm text-[#3f4850]">{bi("back.reg.addOn.intro")}</p>

      {groups.map((group) => (
        <div key={group.key || "_"} className="space-y-3">
          {group.key ? (
            <h4 className="text-xs font-bold uppercase tracking-wide text-[#006193] border-l-2 border-[#fe9400] pl-2">
              {group.key}
            </h4>
          ) : null}
          {group.items.map((addOn) => (
            <AddOnCard
              key={addOn.id}
              addOn={addOn}
              applicants={applicants}
              lang={lang}
              selection={selections[addOn.id]}
              onChange={(next) => onChange(addOn.id, next)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default AddOnPicker;
