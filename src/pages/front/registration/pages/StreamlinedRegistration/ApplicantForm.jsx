import Pill from "components/pill";
import React from "react";
import { Input, Select, Modal } from "antd";
import {
  UserOutlined, UsergroupAddOutlined, DeleteOutlined, ExclamationCircleOutlined, CameraOutlined, CheckCircleFilled,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import CommonForm from "components/commonForm";
import ImageUpload from "components/imageUpload";
import { bloodGroupOption } from "constants/options/bloodGroupOption";
import BoxRadio from "./BoxRadio";
import DobSelect from "./DobSelect";
import PhoneFriendlySelect from "./PhoneFriendlySelect";
import PhoneInput from "components/phoneInput";
import { DEFAULT_PHONE_COUNTRY_CODE } from "constants/phoneCountryCodes";
import { inputCls, selectCls, fieldItemCls } from "./theme";
import { FIELD_CONFIG_DEFAULTS, isRequired, isShown } from "./fieldConfig";
import { DEFAULT_NATIONALITY } from "./nationality";
import { findAgeGroup, raceAge } from "./utils";
import { useAvatarUrl } from "hooks/useMeDisplay";

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

/** "Age 34 · in the 30–39 group", shown in a soft green box once the birth date is complete. */
const AgeGroupNote = ({ event, eventType, birthDate, gender }) => {
  const { t } = useTranslation();
  const age = raceAge(birthDate, event, eventType);
  if (age == null || Number.isNaN(age)) return null;
  const groups = eventType?.ageGroups || [];
  const group = findAgeGroup(eventType, birthDate, gender, event);
  let groupText = null;
  if (group) {
    const { minAge, maxAge } = group;
    groupText = minAge != null && maxAge != null
      ? t("front.reg.groupRange", { min: minAge, max: maxAge })
      : minAge != null ? t("front.reg.groupMin", { min: minAge }) : t("front.reg.groupMax", { max: maxAge });
  }
  return (
    <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-3.5 py-2.5 text-[#166534]">
      <CheckCircleFilled className="mt-[3px] text-[#22c55e] text-base shrink-0" />
      <div className="text-[14px] leading-snug">
        <span className="font-bold">{t("front.reg.ageIs", { age })}</span>
        {groups.length > 0 && (
          <span className="block mt-0.5">
            {group
              ? t("front.reg.inAgeGroup", { group: groupText })
              : gender ? t("front.reg.noAgeGroup") : t("front.reg.pickGenderForGroup")}
          </span>
        )}
      </div>
    </div>
  );
};

/** Athlete information card — asks "register for whom?" then reveals the form. */
const ApplicantForm = ({
  index,
  ticketLabel,
  me,
  // Personal details from the runner's previous "for myself" entry; fills what `me` lacks.
  lastSelfEntry,
  event,
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
  // The runner's own profile photo stands in for the person icon on "register for myself".
  const myAvatarUrl = useAvatarUrl(me);
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

  // Profile first; whatever it lacks comes from the runner's last "for myself" registration.
  const known = (k) => {
    const v = me?.[k];
    if (v != null && v !== "") return v;
    const w = lastSelfEntry?.[k];
    return w != null && w !== "" ? w : undefined;
  };

  const chooseSelf = () => {
    const gender = known("gender");
    const birthDate = known("birthDate");
    const idNo = known("idNo");
    setPersonal({
      type: "self",
      firstName: known("firstName"),
      lastName: known("lastName"),
      firstNameEn: known("firstNameEn"),
      lastNameEn: known("lastNameEn"),
      gender: gender ? String(gender).toLowerCase() : undefined,
      birthDate: birthDate ? dayjs(birthDate) : undefined,
      email: me?.email,
      phone: known("phone"),
      phoneCountryCode: known("phoneCountryCode") || DEFAULT_PHONE_COUNTRY_CODE,
      nationality: known("nationality") || DEFAULT_NATIONALITY,
      idType: guessIdType(idNo),
      idNo,
      healthIssues: known("healthIssues"),
      bloodType: known("bloodType"),
      emergencyContact: known("emergencyContact"),
      emergencyRelation: known("emergencyRelation"),
      emergencyPhone: known("emergencyPhone"),
      emergencyPhoneCountryCode: known("emergencyPhoneCountryCode") || DEFAULT_PHONE_COUNTRY_CODE,
      pictureUrl: me?.pictureUrl,
      province: known("province"),
    });
  };

  const chooseFriend = () => setPersonal({
    type: "friend",
    nationality: DEFAULT_NATIONALITY,
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

  const birthDate = CommonForm.useWatch(["applicants", index, "birthDate"], form);
  const gender = CommonForm.useWatch(["applicants", index, "gender"], form);
  const eventTypeId = CommonForm.useWatch(["applicants", index, "eventTypeId"], { form, preserve: true });
  const eventType = (event?.eventTypes || []).find((et) => et.id === eventTypeId);

  // Registering themself with a profile photo already on file: that photo is used, no upload step.
  const usesProfilePhoto = type === "self" && !!me?.pictureUrl;
  const photoBlock = show("pictureUrl") && !usesProfilePhoto ? (
    <div>
      <Label required={req("pictureUrl")}>{t("front.reg.photo")}</Label>
      {/* A small round avatar instead of a big drop area. */}
      <div className="reg-avatar-upload flex items-center gap-3">
        <ImageUpload
          key={`img-${index}`}
          label={null}
          prefix={prefix}
          filename={!Array.isArray(pictureUrl) ? pictureUrl : null}
          listType="picture-circle"
          options={{
            fileList: Array.isArray(pictureUrl) ? pictureUrl : [],
            onChange: (newFileList) =>
              form.setFieldValue(["applicants", index, "pictureUrl"], newFileList),
          }}
          uploadContent={(
            <span className="flex flex-col items-center gap-0.5 text-[#006193]">
              <CameraOutlined className="text-xl" />
              <span className="text-[13px] font-semibold leading-tight">{t("general.uploadImg")}</span>
            </span>
          )}
        />
        <div className="min-w-0 text-[13px] leading-snug text-[#3f4850]">
          <p className="font-semibold text-[#181c1e]">{t("front.reg.tapToUpload")}</p>
          <p>{t("front.reg.photoHint")}</p>
        </div>
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
    <div id={`applicant-${index}`} className="rounded-xl border border-[#bfc7d2] bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#e5e9eb] bg-[#f1f4f6]">
        <span className="font-bold text-[#181c1e] shrink-0 whitespace-nowrap">
          {t("back.reg.common.applicantInfo")} #{index + 1}
        </span>
        <div className="flex items-center gap-2 min-w-0">
          {ticketLabel ? (
            <Pill tone="solid" title={ticketLabel} className="max-w-[60vw]">{ticketLabel}</Pill>
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
              icon={myAvatarUrl
                ? <img src={myAvatarUrl} alt="" className="block w-10 h-10 rounded-full object-cover ring-2 ring-white shadow" />
                : <UserOutlined />}
              title={t("front.reg.forSelf")} />
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
              <AgeGroupNote event={event} eventType={eventType} birthDate={birthDate} gender={gender} />
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
                  disabled={isLoadingNationality} showSearch allowClear getPopupContainer={(n) => n.parentNode}
                  filterOption={(input, option) =>
                    (option?.filterLabel || option?.label || "").toLowerCase().includes(input.trim().toLowerCase())
                  } />
              </CommonForm.Item>
            </div>
            )}

            {show("bloodType") && (
            <div>
              <Label required={req("bloodType")}>{t("back.reg.form.bloodType")}</Label>
              <CommonForm.Item name={["applicants", index, "bloodType"]} className={fieldItemCls}
                rules={requiredRule("bloodType", "required.bloodType")}>
                <PhoneFriendlySelect placeholder={t("back.reg.form.selectBloodType")}
                  options={bloodGroupOption} allowClear />
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
