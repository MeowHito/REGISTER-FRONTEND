import React from "react";
import { Checkbox, Input, Rate, Select, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import CommonForm from "components/commonForm";
import { dummyRequest } from "hooks/dummyRequest";
import { getPublicUrl } from "utils/fileUtils";
import { inputCls, selectCls, fieldItemCls } from "./theme";
import useBilingual from "./useBilingual";
import { questionsFor } from "./questionnaire";

/** Questions grouped under their sponsor section (sections first, plain questions last). */
const groupBySection = (event, questions) => {
  const sections = [...(event?.questionSections || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const groups = sections
    .map((s) => ({ section: s, questions: questions.filter((q) => q.sectionId === s.id) }))
    .filter((g) => g.questions.length > 0);
  const plain = questions.filter((q) => !q.sectionId || !sections.some((s) => s.id === q.sectionId));
  if (plain.length) groups.push({ section: null, questions: plain });
  return groups;
};

const Label = ({ children, required }) => (
  <label className="block text-sm font-bold text-[#3f4850] mb-1">
    {children}{required ? <span className="text-[#ba1a1a] ml-0.5">*</span> : null}
  </label>
);

const SectionLogo = ({ section }) => {
  const [url, setUrl] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    if (section?.logoUrl) {
      getPublicUrl({ key: section.logoUrl, prefix: section.prefixPath || "event", isPublic: true })
        .then((u) => alive && setUrl(u))
        .catch(() => {});
    }
    return () => { alive = false; };
  }, [section?.logoUrl, section?.prefixPath]);
  if (!url) return null;
  return <img src={url} alt={section.title} className="h-12 max-w-[160px] object-contain" />;
};

const Question = ({ field, index, lang, bi, t }) => {
  const title = lang === "en" ? field.titleEn || field.title : field.title;
  const base = ["applicants", index, "selectionAnswers", field.id];
  const requiredRule = field.required ? [{ required: true, message: bi("required.selectionField", { title }) }] : [];
  const optLabel = (o) => (lang === "en" ? o.valueEn || o.value : o.value);
  const options = [...(field.options || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const fixed = options.filter((o) => o.inputType !== "FREE_TEXT");
  const freeText = options.find((o) => o.inputType === "FREE_TEXT");

  if (field.type === "TEXT") {
    return (
      <div>
        <Label required={field.required}>{title}</Label>
        <CommonForm.Item name={base} className={fieldItemCls} rules={requiredRule}>
          <Input.TextArea rows={2} className="!rounded-lg !border-[#bfc7d2] !text-base" allowClear />
        </CommonForm.Item>
      </div>
    );
  }
  if (field.type === "RATING") {
    return (
      <div>
        <Label required={field.required}>{title}</Label>
        <CommonForm.Item name={base} className={fieldItemCls} rules={requiredRule}>
          <Rate allowClear={!field.required} className="!text-2xl" />
        </CommonForm.Item>
        <p className="text-[11px] text-[#3f4850]">{bi("back.reg.form.ratingHint")}</p>
      </div>
    );
  }
  if (field.type === "IMAGE") {
    return (
      <div>
        <Label required={field.required}>{title}</Label>
        <CommonForm.Item name={base} className={fieldItemCls} rules={requiredRule}
          valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}>
          <Upload customRequest={dummyRequest} listType="picture-card" maxCount={1} accept="image/png, image/jpeg, image/webp">
            <div><UploadOutlined className="mb-1" /><p className="m-0 text-xs">{t("general.uploadImg")}</p></div>
          </Upload>
        </CommonForm.Item>
      </div>
    );
  }
  if (field.type === "MULTIPLE") {
    return (
      <div>
        <Label required={field.required}>{title}</Label>
        <CommonForm.Item name={[...base, "selected"]} className={fieldItemCls} rules={requiredRule}>
          <Checkbox.Group className="!flex !flex-col gap-2">
            {options.map((o) => (
              <div key={o.id}>
                <Checkbox value={o.id}>{o.inputType === "FREE_TEXT" ? (optLabel(o) || bi("back.event.form.other")) : optLabel(o)}</Checkbox>
                {o.inputType === "FREE_TEXT" && (
                  <CommonForm.Item noStyle shouldUpdate={(p, c) =>
                    JSON.stringify(p?.applicants?.[index]?.selectionAnswers?.[field.id]?.selected)
                    !== JSON.stringify(c?.applicants?.[index]?.selectionAnswers?.[field.id]?.selected)}>
                    {({ getFieldValue }) => {
                      const sel = getFieldValue([...base, "selected"]) || [];
                      if (!sel.includes(o.id)) return null;
                      return (
                        <CommonForm.Item name={[...base, "freeTextValues", o.id]} className={`${fieldItemCls} ml-6 mt-1`}
                          rules={field.required ? [{ required: true, message: bi("required.freeTextAnswer") }] : []}>
                          <Input className={inputCls} placeholder={optLabel(o) || bi("back.event.form.enterText")} allowClear />
                        </CommonForm.Item>
                      );
                    }}
                  </CommonForm.Item>
                )}
              </div>
            ))}
          </Checkbox.Group>
        </CommonForm.Item>
      </div>
    );
  }
  // SINGLE
  const selectOptions = [
    ...fixed.map((o) => ({ value: o.id, label: optLabel(o) })),
    ...(freeText ? [{ value: freeText.id, label: optLabel(freeText) || bi("back.event.form.other") }] : []),
  ];
  return (
    <div>
      <Label required={field.required}>{title}</Label>
      <CommonForm.Item name={freeText ? [...base, "selected"] : base} className={fieldItemCls} rules={requiredRule}>
        <Select className={selectCls} options={selectOptions} allowClear placeholder={bi("back.event.form.selectOption", { title })}
          getPopupContainer={(n) => n.parentNode} />
      </CommonForm.Item>
      {freeText && (
        <CommonForm.Item noStyle shouldUpdate={(p, c) =>
          p?.applicants?.[index]?.selectionAnswers?.[field.id]?.selected !== c?.applicants?.[index]?.selectionAnswers?.[field.id]?.selected}>
          {({ getFieldValue }) => {
            if (getFieldValue([...base, "selected"]) !== freeText.id) return null;
            return (
              <CommonForm.Item name={[...base, "freeText"]} className={`${fieldItemCls} mt-2`}
                rules={field.required ? [{ required: true, message: bi("required.freeTextAnswer") }] : []}>
                <Input className={inputCls} placeholder={bi("back.event.form.enterText")} allowClear />
              </CommonForm.Item>
            );
          }}
        </CommonForm.Item>
      )}
    </div>
  );
};

/** Per-applicant card with every extra question, grouped under sponsor sections. */
const QuestionnaireStep = ({ index, ticketLabel, event, eventTypeId, lang }) => {
  const { t } = useTranslation();
  const bi = useBilingual();
  const questions = questionsFor(event, eventTypeId);
  if (!questions.length) return null;
  const groups = groupBySection(event, questions);

  return (
    <div className="rounded-xl border border-[#bfc7d2] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#e5e9eb] bg-[#f1f4f6]">
        <span className="font-bold text-[#181c1e]">{t("back.reg.common.applicantInfo")} #{index + 1}</span>
        {ticketLabel ? <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#cce5ff] text-[#006193]">{ticketLabel}</span> : null}
      </div>
      <div className="p-5 space-y-6">
        {groups.map(({ section, questions: qs }, gi) => (
          <div key={section?.id || `plain-${gi}`} className={section ? "rounded-xl border border-[#e5e9eb] p-4 space-y-4" : "space-y-4"}>
            {section && (
              <div className="flex items-center gap-3 border-b border-[#e5e9eb] pb-3">
                <SectionLogo section={section} />
                <div>
                  <div className="font-bold text-[#181c1e]">{lang === "en" ? section.titleEn || section.title : section.title}</div>
                  {section.description ? <div className="text-xs text-[#3f4850]">{section.description}</div> : null}
                </div>
              </div>
            )}
            {qs.map((q) => <Question key={q.id} field={q} index={index} lang={lang} bi={bi} t={t} />)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionnaireStep;
