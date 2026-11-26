import React from "react";
import { Input } from "antd";
import { CheckOutlined, GiftOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import useBilingual from "./useBilingual";

/**
 * "Anything else?" step — the optional packages the organizer attached to this
 * event (accommodation, photos, shuttle…).
 *
 * Two shapes, decided per add-on by the organizer's `perApplicant` flag:
 * Each package is a tick box first; ticking it opens its details:
 *  - per order      → a quantity stepper (2 hotel rooms for a group of four)
 *  - per applicant  → one tick box per runner
 *
 * Selections live in the parent's `selections` state, keyed by add-on id:
 *   { [addOnId]: { checked, qty, applicants: { [index]: true }, note } }
 */

const money = (n) => (Number(n) || 0).toLocaleString();

/** Strip the tiptap HTML down to a short preview line. */
const plainText = (html) => {
  if (!html) return "";
  const text = String(html).replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return text;
};

const AddOnCard = ({ addOn, selection, applicants, lang, onChange, showErrors }) => {
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
  // Ticking the box is what opens the package; older drafts saved before the
  // tick existed count as ticked when something was already picked.
  const isChecked = !!selection?.checked || pickedCount > 0;

  const remaining = addOn.availableQuota; // null = unlimited
  const soldOut = addOn.isSoldOut || (remaining != null && remaining <= 0);

  // A per-order add-on is capped by both the organizer's per-order limit and
  // whatever stock is left; a per-applicant one by the number of runners.
  const maxQty = perApplicant
    ? applicants.length
    : Math.min(addOn.maxPerOrder ?? Infinity, remaining ?? Infinity);

  const setQty = (next) => {
    const clamped = Math.max(1, Math.min(next, maxQty === Infinity ? 99 : maxQty));
    onChange({ ...selection, checked: true, qty: clamped });
  };

  const toggleApplicant = (index) => {
    const next = { ...pickedApplicants, [index]: !pickedApplicants[index] };
    if (!next[index]) delete next[index];
    // Never let per-runner ticks exceed what's left in stock.
    if (remaining != null && Object.values(next).filter(Boolean).length > remaining) return;
    onChange({ ...selection, checked: true, applicants: next });
  };

  const toggleChecked = () => {
    if (soldOut) return;
    if (isChecked) {
      // Unticking drops everything picked inside, so nothing is charged.
      onChange({ checked: false, qty: 0, applicants: {}, note: "" });
      return;
    }
    onChange({
      checked: true,
      // Start a per-order package at one unit; a per-runner one pre-picks the
      // only runner when there is just one, otherwise the buyer chooses.
      qty: perApplicant ? 0 : 1,
      applicants: perApplicant && applicants.length === 1 ? { 0: true } : {},
      note: selection?.note || "",
    });
  };

  const lineTotal = pickedCount * (Number(addOn.price) || 0);
  const preview = plainText(description);

  return (
    <div
      id={`addon-${addOn.id}`}
      className={`scroll-mt-24 border rounded-xl overflow-hidden transition-all ${
        soldOut
          ? "border-[#bfc7d2] bg-[#f1f4f6] opacity-80"
          : isChecked
            ? "border-[#fe9400] border-2 bg-[#fffaf3]"
            : "border-[#bfc7d2] bg-white"
      }`}
    >
      <button
        type="button"
        onClick={toggleChecked}
        disabled={soldOut}
        aria-pressed={isChecked}
        className="w-full p-4 flex items-start gap-3 text-left disabled:cursor-not-allowed"
      >
        <span
          className={`mt-0.5 w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
            isChecked ? "bg-[#fe9400] border-[#fe9400] text-white" : "bg-white border-[#bfc7d2]"
          }`}
        >
          {isChecked ? <CheckOutlined className="text-[13px]" /> : null}
        </span>
        <span className="w-10 h-10 shrink-0 rounded-lg bg-[#fff3e0] flex items-center justify-center">
          <GiftOutlined className="text-[#fe9400] text-lg" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-bold text-[#181c1e] leading-snug">{name}</span>
          {preview && !isChecked ? (
            <span className="block text-[13px] text-[#3f4850] mt-0.5 line-clamp-2">{preview}</span>
          ) : null}
          {soldOut ? (
            <span className="block text-sm font-bold text-[#ba1a1a] mt-1">{bi("back.reg.addOn.soldOut")}</span>
          ) : remaining != null ? (
            <span className="block text-[13px] text-[#3f4850] mt-0.5">
              {bi("back.reg.addOn.remaining", { count: remaining })}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[#006193] font-bold">
            +{money(addOn.price)} {t("general.unitBaht")}
          </span>
          <span className="block text-[13px] text-[#3f4850]">
            {perApplicant ? bi("back.reg.addOn.perPerson") : bi("back.reg.addOn.perUnit")}
          </span>
        </span>
      </button>

      {isChecked && !soldOut ? (
        <div className="px-4 pb-4 space-y-4">
          {preview ? (
            <p className="text-sm text-[#3f4850] whitespace-pre-line bg-white border border-[#e5e9eb] rounded-lg p-3">
              {preview}
            </p>
          ) : null}

          {!perApplicant ? (
            <div className="flex items-center justify-between gap-3 bg-white border border-[#e5e9eb] rounded-lg p-3">
              <span className="text-sm font-bold text-[#3f4850]">{bi("back.reg.addOn.chooseQty")}</span>
              <div className="flex items-center gap-3 bg-[#ebeef0] rounded-full p-1 border border-[#bfc7d2] shrink-0">
                <button
                  type="button"
                  onClick={() => setQty(qty - 1)}
                  disabled={qty <= 1}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#006193] hover:bg-[#e0e3e5] disabled:text-[#bfc7d2] text-xl font-bold"
                >
                  −
                </button>
                <span className="w-5 text-center font-bold">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(qty + 1)}
                  disabled={maxQty !== Infinity && qty >= maxQty}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-[#006193] text-white shadow hover:opacity-90 disabled:bg-[#bfc7d2] text-xl font-bold"
                >
                  +
                </button>
              </div>
            </div>
          ) : (
            <div id={`addon-applicants-${addOn.id}`} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                <label className="text-sm font-bold text-[#3f4850] whitespace-nowrap">
                  {bi("back.reg.addOn.chooseApplicants")}
                </label>
                <span className="text-[13px] font-bold text-[#fe9400] shrink-0">
                  {bi("back.reg.addOn.pickedOf", { picked: pickedCount, total: applicants.length })}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {applicants.map((a, i) => {
                  const on = !!pickedApplicants[i];
                  const fullName = `${a?.firstName || ""} ${a?.lastName || ""}`.trim();
                  const label = `${t("back.reg.common.applicantNumber")} ${i + 1}${fullName ? `: ${fullName}` : ""}`;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleApplicant(i)}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg text-left transition-all ${
                        on ? "border-[#fe9400] bg-white" : "border-[#e5e9eb] bg-white hover:border-[#fe9400]"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center ${
                          on ? "bg-[#fe9400] border-[#fe9400] text-white" : "border-[#bfc7d2]"
                        }`}
                      >
                        {on ? <CheckOutlined className="text-[11px]" /> : null}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-[#181c1e] truncate">{label}</span>
                        {a?.eventTypeName ? (
                          <span className="block text-[12px] text-[#6f7880] truncate">{a.eventTypeName}</span>
                        ) : null}
                      </span>
                      <span className="text-[13px] font-bold text-[#006193] shrink-0">+{money(addOn.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {noteLabel ? (
            <div id={`addon-note-wrap-${addOn.id}`} className="space-y-2">
              <label className="block text-sm font-bold text-[#3f4850]">
                {noteLabel}
                {addOn.noteRequired ? <span className="text-[#ba1a1a]"> *</span> : null}
              </label>
              <Input.TextArea
                id={`addon-note-${addOn.id}`}
                rows={2}
                maxLength={500}
                value={selection?.note || ""}
                onChange={(e) => onChange({ ...selection, checked: true, note: e.target.value })}
                status={showErrors && addOn.noteRequired && !selection?.note?.trim() ? "error" : undefined}
                className={`!rounded-lg !text-base ${showErrors && addOn.noteRequired && !selection?.note?.trim() ? "" : "!border-[#bfc7d2]"}`}
                placeholder={noteLabel}
              />
            </div>
          ) : null}

          <div className="pt-3 border-t border-[#f0d9b5] flex justify-between text-sm">
            <span className="text-[#3f4850]">
              {money(addOn.price)} × {pickedCount}
            </span>
            <span className="font-bold text-[#006193]">
              {money(lineTotal)} {t("general.unitBaht")}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const AddOnPicker = ({ addOns, applicants, selections, onChange, lang, showErrors = false }) => {
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
      <p className="text-sm text-[#3f4850]">{bi("back.reg.addOn.intro")} {bi("back.reg.addOn.tickHint")}</p>

      {groups.map((group) => (
        <div key={group.key || "_"} className="space-y-3">
          {group.key ? (
            <h4 className="text-[13px] font-bold uppercase tracking-wide text-[#006193] border-l-2 border-[#fe9400] pl-2">
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
              showErrors={showErrors}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default AddOnPicker;
