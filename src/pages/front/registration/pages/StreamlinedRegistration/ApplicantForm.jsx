import React from "react";
import { Input, Select, Modal } from "antd";
import {
  UserOutlined, UsergroupAddOutlined, DeleteOutlined, ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import CommonForm from "components/commonForm";
import ImageUpload from "components/imageUpload";
import { bloodGroupOption } from "constants/options/bloodGroupOption";
import BoxRadio from "./BoxRadio";
import DobSelect from "./DobSelect";
import PhoneInput from "components/phoneInput";
import { DEFAULT_PHONE_COUNTRY_CODE } from "constants/phoneCountryCodes";
import { inputCls, selectCls, fieldItemCls, ticketBadgeCls } from "./theme";
import { FIELD_CONFIG_DEFAULTS, isRequired, isShown } from "./fieldConfig";

const PERSONAL_KEYS = [
  "firstName", "lastName", "firstNameEn", "lastNameEn", "gender", "birthDate",
  "email", "phone", "phoneCountryCode", "nationality", "idType", "idNo", "healthIssues", "bloodType",
  "emergencyContact", "emergencyRelation", "emergencyPhone", "emergencyPhoneCountryCode", "pictureUrl",
  "province", "teamClub",
];

const THAI_ID = /^\d{13}$/;
const PASSPORT = /^[A-Za-z0-9]{6,20}$/;
/** Which document an existing idNo is, so the toggle matches a prefilled profile. */
const guessIdType = (idNo) => (idNo && !THAI_ID.test(String(idNo).trim()) ? "passport" : "idCard");

const Label = ({ children, required }) => (
  <label className="block text-sm font-bold text-[#3f4850] mb-1">
    {children}
    {required ? <span className="text-[#ba1a1a] ml-0.5">*</span> : null}
  </label>
);

const RegTypeButton = ({ active, onClick, icon, title }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-xl transition-all text-center",
      active
        ? "border-[#006193] bg-[#cce5ff] text-[#006193]"
        : "border-[#bfc7d2] bg-white text-[#3f4850] hover:border-[#006193]",
    ].join(" ")}
  >
    <span className="text-3xl leading-none">{icon}</span>
    <span className="text-sm font-bold">{title}</span>
  </button>
);

/** Athlete information card — asks "register for whom?" then reveals the form. */
const ApplicantForm = ({
  index,
  ticketLabel,
  me,
  form,
  provinceOption,
  isLoadingProvince,
  nationalityOption,
  isLoadingNationality,
  canRemove,
  onRemove,
  fieldConfig = FIELD_CONFIG_DEFAULTS,
  isTeamMember = false,
}) => {
  const { t } = useTranslation();
  const prefix = "userData";
  const show = (key) => isShown(fieldConfig, key);
  const req = (key) => isRequired(fieldConfig, key);
  const requiredRule = (key, msgKey) => (req(key) ? [{ required: true, message: t(msgKey) }] : []);

  const confirmRemove = () => {
    Modal.confirm({
      title: t("back.reg.common.removeApplicantTitle"),
      icon: <ExclamationCircleOutlined />,
      content: t("back.reg.common.removeApplicantConfirm"),
      okText: t("general.delete"),
      okButtonProps: { danger: true },
      cancelText: t("general.cancel"),
      onOk: () => onRemove?.(index),
    });
  };

  const type = CommonForm.useWatch(["applicants", index, "type"], form);
  const idType = CommonForm.useWatch(["applicants", index, "idType"], form) || "idCard";
  // `pictureUrl` is set imperatively (no Form.Item wraps it) and this page has no
  // Form.List, so it isn't a "registered" field. Default useWatch reads only
  // registered values and would always see undefined here — `preserve: true`
  // makes it read the full store so the uploaded image actually re-renders.
  const pictureUrl = CommonForm.useWatch(["applicants", index, "pictureUrl"], { form, preserve: true });

  const setPersonal = (patch) => {
    const current = form.getFieldValue(["applicants", index]) || {};
    const cleared = {};
    PERSONAL_KEYS.forEach((k) => (cleared[k] = undefined));
    form.setFieldValue(["applicants", index], { ...current, ...cleared, ...patch });
  };

  const chooseSelf = () =>
    setPersonal({
      type: "self",
      firstName: me?.firstName,
      lastName: me?.lastName,
      firstNameEn: me?.firstNameEn,
      lastNameEn: me?.lastNameEn,
      gender: me?.gender ? me.gender.toLowerCase() : undefined,
      birthDate: me?.birthDate ? dayjs(me.birthDate) : undefined,
      email: me?.email,
      phone: me?.phone,
      phoneCountryCode: me?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
      nationality: me?.nationality,
      idType: guessIdType(me?.idNo),
      idNo: me?.idNo,
      healthIssues: me?.healthIssues,
      bloodType: me?.bloodType,
      emergencyContact: me?.emergencyContact,
      emergencyRelation: me?.emergencyRelation,
      emergencyPhone: me?.emergencyPhone,
      emergencyPhoneCountryCode: me?.emergencyPhoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
      pictureUrl: me?.pictureUrl,
      province: me?.province,
    });

  const chooseFriend = () => setPersonal({
    type: "friend",
    idType: "idCard",
    phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
    emergencyPhoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
  });

  // Switching document type clears the number so a 13-digit rule never judges a passport.
  const changeIdType = (next) => {
    const current = form.getFieldValue(["applicants", index]) || {};
    form.setFieldValue(["applicants", index], { ...current, idType: next || "idCard", idNo: undefined });
  };
  const isPassport = idType === "passport";

  const photoBlock = show("pictureUrl") ? (
    <div>
      <Label required={req("pictureUrl")}>{t("front.reg.photo")}</Label>
      <div className="flex flex-col items-center justify-center py-5 bg-[#f1f4f6] border-2 border-dashed border-[#bfc7d2] rounded-xl">
        <ImageUpload
          key={`img-${index}`}
          label={null}
          prefix={prefix}
          filename={!Array.isArray(pictureUrl) ? pictureUrl : null}
          options={{
            fileList: Array.isArray(pictureUrl) ? pictureUrl : [],
            onChange: (newFileList) =>
              form.setFieldValue(["applicants", index, "pictureUrl"], newFileList),
          }}
          uploadText={t("general.uploadImg")}
        />
      </div>
      {req("pictureUrl") && (
        <CommonForm.Item name={["applicants", index, "pictureUrl"]} className={fieldItemCls}
          rules={[{ validator: (_r, v) => (v && (typeof v === "string" || (Array.isArray(v) && v.length)))
            ? Promise.resolve() : Promise.reject(new Error(t("required.picture"))) }]}>
          <Input type="hidden" />
        </CommonForm.Item>
      )}
    </div>
  ) : null;

  return (
    <div className="rounded-xl border border-[#bfc7d2] bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#e5e9eb] bg-[#f1f4f6]">
        <span className="font-bold text-[#181c1e]">
          {t("back.reg.common.applicantInfo")} #{index + 1}
        </span>
        <div className="flex items-center gap-2 min-w-0">
          {ticketLabel ? (
            <span className={ticketBadgeCls}>{ticketLabel}</span>
          ) : null}
          {canRemove ? (
            <button type="button" onClick={confirmRemove}
              title={t("general.delete")}
              className="flex items-center justify-center w-8 h-8 rounded-full text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors shrink-0">
              <DeleteOutlined />
            </button>
          ) : null}
        </div>
      </div>

      <div className="p-4 space-y-6">
        <CommonForm.Item name={["applicants", index, "type"]} hidden noStyle>
          <Input type="hidden" />
        </CommonForm.Item>
        <CommonForm.Item name={["applicants", index, "idType"]} hidden noStyle>
          <Input type="hidden" />
        </CommonForm.Item>

        {/* photo first, then who is this for? */}
        {photoBlock}

        <div>
          <Label>{t("front.reg.regType")}</Label>
          <div className="grid grid-cols-2 gap-3">
            <RegTypeButton active={type === "self"} onClick={chooseSelf}
              icon={<UserOutlined />} title={t("front.reg.forSelf")} />
            <RegTypeButton active={type === "friend"} onClick={chooseFriend}
              icon={<UsergroupAddOutlined />} title={t("front.reg.forOther")} />
          </div>
        </div>

        {type ? (
          <div className="space-y-4">
            <div>
              <Label required>{t("front.reg.firstNameTh")}</Label>
              <CommonForm.Item name={["applicants", index, "firstName"]} className={fieldItemCls}
                rules={[{ required: true, message: t("required.firstName") }]}>
                <Input className={inputCls} placeholder={t("front.reg.enterFirstName")} allowClear />
              </CommonForm.Item>
            </div>
            <div>
              <Label required>{t("front.reg.lastNameTh")}</Label>
              <CommonForm.Item name={["applicants", index, "lastName"]} className={fieldItemCls}
                rules={[{ required: true, message: t("required.lastName") }]}>
                <Input className={inputCls} placeholder={t("front.reg.enterLastName")} allowClear />
              </CommonForm.Item>
            </div>
            {show("firstNameEn") && (
            <div>
              <Label required={req("firstNameEn")}>{t("front.reg.firstNameEn")}</Label>
              <CommonForm.Item name={["applicants", index, "firstNameEn"]} className={fieldItemCls}
                rules={[
                  ...requiredRule("firstNameEn", "required.firstNameEn"),
                  { pattern: /^[A-Za-z\s]+$/, message: t("validation.en") },
                ]}>
                <Input className={inputCls} placeholder={t("front.reg.enterFirstNameEn")} allowClear />
              </CommonForm.Item>
            </div>
            )}
            {show("lastNameEn") && (
            <div>
              <Label required={req("lastNameEn")}>{t("front.reg.lastNameEn")}</Label>
              <CommonForm.Item name={["applicants", index, "lastNameEn"]} className={fieldItemCls}
                rules={[
                  ...requiredRule("lastNameEn", "required.lastNameEn"),
                  { pattern: /^[A-Za-z\s]+$/, message: t("validation.en") },
                ]}>
                <Input className={inputCls} placeholder={t("front.reg.enterLastNameEn")} allowClear />
              </CommonForm.Item>
            </div>
            )}

            <div>
              <Label required>{t("back.reg.form.gender")}</Label>
              <CommonForm.Item name={["applicants", index, "gender"]} className={fieldItemCls}
                rules={[{ required: true, message: t("required.selectGender") }]}>
                <BoxRadio columns={2} options={[
                  { value: "male", label: t("back.reg.form.male"), icon: "♂",
                    activeCls: "border-[#1677ff] !border-2 bg-[#e6f4ff] text-[#1677ff]" },
                  { value: "female", label: t("back.reg.form.female"), icon: "♀",
                    activeCls: "border-[#eb2f96] !border-2 bg-[#fff0f6] text-[#eb2f96]" },
                ]} />
              </CommonForm.Item>
            </div>

            <div>
              <Label required>{t("back.reg.form.birthDate")}</Label>
              <CommonForm.Item name={["applicants", index, "birthDate"]} className={fieldItemCls}
                rules={[{ required: true, message: t("required.selectBirthDate") }]}>
                <DobSelect />
              </CommonForm.Item>
            </div>

            {show("idNo") && (
            <div className="space-y-2">
              <div>
                <Label required={req("idNo")}>{t("front.reg.idType")}</Label>
                <BoxRadio columns={2} size="sm" value={idType} onChange={changeIdType} options={[
                  { value: "idCard", label: t("front.reg.idCard") },
                  { value: "passport", label: t("front.reg.passport") },
                ]} />
              </div>
              <div>
                <Label required={req("idNo")}>{isPassport ? t("front.reg.passportNo") : t("front.reg.idCardNo")}</Label>
                <CommonForm.Item name={["applicants", index, "idNo"]} className={fieldItemCls}
                  dependencies={[["applicants", index, "idType"]]}
                  rules={[
                    ...requiredRule("idNo", isPassport ? "required.passport" : "required.idNo"),
                    {
                      validator: (_r, value) => {
                        if (!value) return Promise.resolve();
                        const v = String(value).trim();
                        if (isPassport) {
                          return PASSPORT.test(v) ? Promise.resolve() : Promise.reject(new Error(t("validation.passport")));
                        }
                        return THAI_ID.test(v) ? Promise.resolve() : Promise.reject(new Error(t("validation.idNoDigits")));
                      },
                    },
                  ]}>
                  <Input className={inputCls} allowClear
                    key={idType}
                    inputMode={isPassport ? "text" : "numeric"}
                    maxLength={isPassport ? 20 : 13}
                    placeholder={isPassport ? t("front.reg.enterPassport") : t("front.reg.enterIdCard")} />
                </CommonForm.Item>
              </div>
            </div>
            )}

            <div>
              <Label required>{t("back.reg.form.email")}</Label>
              <CommonForm.Item name={["applicants", index, "email"]} className={fieldItemCls}
                rules={[
                  { required: true, message: t("required.email") },
                  { type: "email", message: t("validation.email") },
                ]}>
                <Input className={inputCls} placeholder="runner@example.com" allowClear />
              </CommonForm.Item>
            </div>
            {show("phone") && (
            <div>
              <Label required={req("phone")}>{t("back.reg.form.phone")}</Label>
              <PhoneInput form={form} base={["applicants", index]} codeName="phoneCountryCode" numberName="phone"
                required={req("phone")} requiredMessage={t("required.phone")} invalidMessage={t("validation.phone")}
                inputClassName={inputCls} selectClassName={selectCls} itemClassName={fieldItemCls} />
            </div>
            )}

            {show("province") && (
            <div>
              <Label required={req("province")}>{t("back.reg.form.province")}</Label>
              <CommonForm.Item name={["applicants", index, "province"]} className={fieldItemCls}
                rules={requiredRule("province", "required.province")}>
                <Select className={selectCls} placeholder={t("back.reg.form.selectProvince")}
                  options={provinceOption} disabled={isLoadingProvince} showSearch allowClear
                  getPopupContainer={(n) => n.parentNode}
                  filterOption={(input, option) => {
                    const str = option.filterLabel || (typeof option.label === "string" ? option.label : "");
                    return str.toLowerCase().includes(input.toLowerCase());
                  }} />
              </CommonForm.Item>
            </div>
            )}
            {show("nationality") && (
            <div>
              <Label required={req("nationality")}>{t("back.reg.form.nationality")}</Label>
              <CommonForm.Item name={["applicants", index, "nationality"]} className={fieldItemCls}
                rules={requiredRule("nationality", "required.nationality")}>
                <Select className={selectCls} placeholder={t("back.reg.form.selectNationality")} options={nationalityOption}
                  disabled={isLoadingNationality} showSearch allowClear getPopupContainer={(n) => n.parentNode} />
              </CommonForm.Item>
            </div>
            )}

            {show("bloodType") && (
            <div>
              <Label required={req("bloodType")}>{t("back.reg.form.bloodType")}</Label>
              <CommonForm.Item name={["applicants", index, "bloodType"]} className={fieldItemCls}
                rules={requiredRule("bloodType", "required.bloodType")}>
                <Select className={selectCls} placeholder={t("back.reg.form.selectBloodType")}
                  options={bloodGroupOption} allowClear getPopupContainer={(n) => n.parentNode} />
              </CommonForm.Item>
            </div>
            )}
            {show("healthIssues") && (
            <div>
              <Label required={req("healthIssues")}>{t("back.reg.form.healthIssues")}</Label>
              <CommonForm.Item name={["applicants", index, "healthIssues"]} className={fieldItemCls}
                rules={requiredRule("healthIssues", "required.healthIssues")}>
                <Input className={inputCls} placeholder={t("front.reg.healthPlaceholder")} allowClear />
              </CommonForm.Item>
            </div>
            )}

            {/* emergency contact */}
            {(show("emergencyContact") || show("emergencyRelation") || show("emergencyPhone")) && (
            <div className="border-t border-[#bfc7d2] pt-4">
              <h4 className="font-bold text-[#181c1e] mb-3">{t("front.reg.emergencyTitle")}</h4>
              <div className="space-y-4">
                {show("emergencyContact") && (
                <div>
                  <Label required={req("emergencyContact")}>{t("front.reg.emergencyName")}</Label>
                  <CommonForm.Item name={["applicants", index, "emergencyContact"]} className={fieldItemCls}
                    rules={requiredRule("emergencyContact", "required.emergencyContact")}>
                    <Input className={inputCls} placeholder={t("front.reg.emergencyName")} allowClear />
                  </CommonForm.Item>
                </div>
                )}
                {show("emergencyRelation") && (
                <div>
                  <Label required={req("emergencyRelation")}>{t("front.reg.emergencyRelation")}</Label>
                  <CommonForm.Item name={["applicants", index, "emergencyRelation"]} className={fieldItemCls}
                    rules={requiredRule("emergencyRelation", "required.emergencyRelation")}>
                    <Input className={inputCls} placeholder={t("front.reg.emergencyRelationPlaceholder")} allowClear />
                  </CommonForm.Item>
                </div>
                )}
                {show("emergencyPhone") && (
                <div>
                  <Label required={req("emergencyPhone")}>{t("front.reg.emergencyPhone")}</Label>
                  <PhoneInput form={form} base={["applicants", index]} codeName="emergencyPhoneCountryCode" numberName="emergencyPhone"
                    required={req("emergencyPhone")} requiredMessage={t("required.emergencyPhone")} invalidMessage={t("validation.phone")}
                    inputClassName={inputCls} selectClassName={selectCls} itemClassName={fieldItemCls} />
                </div>
                )}
              </div>
            </div>
            )}

            {show("teamClub") && !isTeamMember && (
            <div>
              <Label required={req("teamClub")}>{t("front.reg.teamClub")}</Label>
              <CommonForm.Item name={["applicants", index, "teamClub"]} className={fieldItemCls}
                rules={requiredRule("teamClub", "required.teamClub")}>
                <Input className={inputCls} placeholder={t("front.reg.teamClubPlaceholder")} allowClear />
              </CommonForm.Item>
            </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ApplicantForm;
