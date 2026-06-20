import React from "react";
import { Input, Select } from "antd";
import { UserOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import CommonForm from "components/commonForm";
import ImageUpload from "components/imageUpload";
import { bloodGroupOption } from "constants/options/bloodGroupOption";
import BoxRadio from "./BoxRadio";
import DobSelect from "./DobSelect";
import { inputCls, selectCls } from "./theme";

const PERSONAL_KEYS = [
  "firstName", "lastName", "firstNameEn", "lastNameEn", "gender", "birthDate",
  "email", "phone", "nationality", "idNo", "healthIssues", "bloodType",
  "emergencyContact", "emergencyRelation", "emergencyPhone", "pictureUrl",
  "province", "teamClub",
];

const Label = ({ children, required }) => (
  <label className="block text-sm font-bold text-[#3f4850] mb-1">
    {children}
    {required ? <span className="text-[#ba1a1a] ml-0.5">*</span> : null}
  </label>
);

const RegTypeButton = ({ active, onClick, icon, title, subtitle }) => (
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
    <span className="text-[10px] opacity-70 uppercase tracking-wider">{subtitle}</span>
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
}) => {
  const { t } = useTranslation();
  const prefix = "userData";

  const type = CommonForm.useWatch(["applicants", index, "type"], form);
  const pictureUrl = CommonForm.useWatch(["applicants", index, "pictureUrl"], form);

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
      nationality: me?.nationality,
      idNo: me?.idNo,
      healthIssues: me?.healthIssues,
      bloodType: me?.bloodType,
      emergencyContact: me?.emergencyContact,
      emergencyRelation: me?.emergencyRelation,
      emergencyPhone: me?.emergencyPhone,
      pictureUrl: me?.pictureUrl,
      province: me?.province,
    });

  const chooseFriend = () => setPersonal({ type: "friend" });

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
        <CommonForm.Item name={["applicants", index, "type"]} hidden noStyle>
          <Input type="hidden" />
        </CommonForm.Item>

        {/* who is this for? */}
        <div>
          <Label>Registration Type (เลือกผู้สมัคร)</Label>
          <div className="grid grid-cols-2 gap-3">
            <RegTypeButton active={type === "self"} onClick={chooseSelf}
              icon={<UserOutlined />} title="สมัครให้ตัวเอง" subtitle="Register for myself" />
            <RegTypeButton active={type === "friend"} onClick={chooseFriend}
              icon={<UsergroupAddOutlined />} title="สำหรับเพื่อน/ผู้อื่น" subtitle="For someone else" />
          </div>
        </div>

        {type ? (
          <div className="space-y-4">
            {/* photo */}
            <div>
              <Label>รูปโปรไฟล์ / Personal Profile</Label>
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
            </div>

            <div>
              <Label required>ชื่อ (ไทย) / First Name (Thai)</Label>
              <CommonForm.Item name={["applicants", index, "firstName"]} className="!mb-0"
                rules={[{ required: true, message: t("required.firstName") }]}>
                <Input className={inputCls} placeholder="ชื่อ" allowClear />
              </CommonForm.Item>
            </div>
            <div>
              <Label required>นามสกุล (ไทย) / Last Name (Thai)</Label>
              <CommonForm.Item name={["applicants", index, "lastName"]} className="!mb-0"
                rules={[{ required: true, message: t("required.lastName") }]}>
                <Input className={inputCls} placeholder="นามสกุล" allowClear />
              </CommonForm.Item>
            </div>
            <div>
              <Label required>ชื่อ (อังกฤษ) / First Name (English)</Label>
              <CommonForm.Item name={["applicants", index, "firstNameEn"]} className="!mb-0"
                rules={[
                  { required: true, message: t("required.firstNameEn") },
                  { pattern: /^[A-Za-z\s]+$/, message: t("validation.en") },
                ]}>
                <Input className={inputCls} placeholder="First Name" allowClear />
              </CommonForm.Item>
            </div>
            <div>
              <Label required>นามสกุล (อังกฤษ) / Last Name (English)</Label>
              <CommonForm.Item name={["applicants", index, "lastNameEn"]} className="!mb-0"
                rules={[
                  { required: true, message: t("required.lastNameEn") },
                  { pattern: /^[A-Za-z\s]+$/, message: t("validation.en") },
                ]}>
                <Input className={inputCls} placeholder="Last Name" allowClear />
              </CommonForm.Item>
            </div>

            <div>
              <Label required>เพศ / Gender</Label>
              <CommonForm.Item name={["applicants", index, "gender"]} className="!mb-0"
                rules={[{ required: true, message: t("required.selectGender") }]}>
                <BoxRadio columns={2} options={[
                  { value: "male", label: "ชาย (Male)", icon: "♂" },
                  { value: "female", label: "หญิง (Female)", icon: "♀" },
                ]} />
              </CommonForm.Item>
            </div>

            <div>
              <Label required>วัน/เดือน/ปีเกิด / Date of Birth</Label>
              <CommonForm.Item name={["applicants", index, "birthDate"]} className="!mb-0"
                rules={[{ required: true, message: t("required.selectBirthDate") }]}>
                <DobSelect />
              </CommonForm.Item>
            </div>

            <div>
              <Label required>เลขบัตรประชาชน/พาสปอร์ต / ID Card or Passport</Label>
              <CommonForm.Item name={["applicants", index, "idNo"]} className="!mb-0"
                rules={[
                  { required: true, message: t("required.idNo") },
                  {
                    validator: (_r, value) => {
                      if (!value) return Promise.resolve();
                      const v = String(value).trim();
                      // Thai national ID = 13 digits; passport = 6–20 letters/digits.
                      const isThaiId = /^\d{13}$/.test(v);
                      const isPassport = /^[A-Za-z0-9]{6,20}$/.test(v);
                      if (isThaiId || isPassport) return Promise.resolve();
                      return Promise.reject(new Error(t("validation.idNoAndPassport")));
                    },
                  },
                ]}>
                <Input className={inputCls} placeholder="Enter ID number" maxLength={20} allowClear />
              </CommonForm.Item>
              <p className="text-[11px] text-[#3f4850] mt-1">ชาวต่างชาติกรุณากรอกเลขพาสปอร์ต</p>
            </div>

            <div>
              <Label required>อีเมล / Email Address</Label>
              <CommonForm.Item name={["applicants", index, "email"]} className="!mb-0"
                rules={[
                  { required: true, message: t("required.email") },
                  { type: "email", message: t("validation.email") },
                ]}>
                <Input className={inputCls} placeholder="runner@example.com" allowClear />
              </CommonForm.Item>
            </div>
            <div>
              <Label required>โทรศัพท์ / Phone Number</Label>
              <CommonForm.Item name={["applicants", index, "phone"]} className="!mb-0"
                rules={[
                  { required: true, message: t("required.phone") },
                  { pattern: /^0\d{9}$/, message: t("validation.phone") },
                ]}>
                <Input className={inputCls} placeholder="08x-xxx-xxxx" allowClear />
              </CommonForm.Item>
            </div>

            <div>
              <Label required>จังหวัด / Province</Label>
              <CommonForm.Item name={["applicants", index, "province"]} className="!mb-0"
                rules={[{ required: true, message: t("required.province") }]}>
                <Select className={selectCls} placeholder="เลือกจังหวัด / Select Province"
                  options={provinceOption} disabled={isLoadingProvince} showSearch allowClear
                  getPopupContainer={(n) => n.parentNode}
                  filterOption={(input, option) => {
                    const str = option.filterLabel || (typeof option.label === "string" ? option.label : "");
                    return str.toLowerCase().includes(input.toLowerCase());
                  }} />
              </CommonForm.Item>
            </div>
            <div>
              <Label required>สัญชาติ / Nationality</Label>
              <CommonForm.Item name={["applicants", index, "nationality"]} className="!mb-0"
                rules={[{ required: true, message: t("required.nationality") }]}>
                <Select className={selectCls} placeholder="Thai" options={nationalityOption}
                  disabled={isLoadingNationality} showSearch allowClear getPopupContainer={(n) => n.parentNode} />
              </CommonForm.Item>
            </div>

            <div>
              <Label required>หมู่เลือด / Blood Type</Label>
              <CommonForm.Item name={["applicants", index, "bloodType"]} className="!mb-0"
                rules={[{ required: true, message: t("required.bloodType") }]}>
                <Select className={selectCls} placeholder={t("back.reg.form.selectBloodType")}
                  options={bloodGroupOption} allowClear getPopupContainer={(n) => n.parentNode} />
              </CommonForm.Item>
            </div>
            <div>
              <Label>ปัญหาสุขภาพ / แพ้อาหาร / Health / Allergies</Label>
              <CommonForm.Item name={["applicants", index, "healthIssues"]} className="!mb-0">
                <Input className={inputCls} placeholder="กรอกข้อมูลสุขภาพ (ถ้ามี)" allowClear />
              </CommonForm.Item>
            </div>

            {/* emergency contact */}
            <div className="border-t border-[#bfc7d2] pt-4">
              <h4 className="font-bold text-[#181c1e] mb-3">ผู้ติดต่อฉุกเฉิน / Emergency Contact</h4>
              <div className="space-y-4">
                <div>
                  <Label required>ชื่อ-นามสกุล / Name</Label>
                  <CommonForm.Item name={["applicants", index, "emergencyContact"]} className="!mb-0"
                    rules={[{ required: true, message: t("required.emergencyContact") }]}>
                    <Input className={inputCls} placeholder="ชื่อ-นามสกุล" allowClear />
                  </CommonForm.Item>
                </div>
                <div>
                  <Label required>ความสัมพันธ์ / Relationship</Label>
                  <CommonForm.Item name={["applicants", index, "emergencyRelation"]} className="!mb-0"
                    rules={[{ required: true, message: t("required.emergencyRelation") }]}>
                    <Input className={inputCls} placeholder="เช่น บิดา, มารดา, เพื่อน" allowClear />
                  </CommonForm.Item>
                </div>
                <div>
                  <Label required>เบอร์โทรฉุกเฉิน / Emergency Phone</Label>
                  <CommonForm.Item name={["applicants", index, "emergencyPhone"]} className="!mb-0"
                    rules={[
                      { required: true, message: t("required.emergencyPhone") },
                      { pattern: /^0\d{9}$/, message: t("validation.phone") },
                    ]}>
                    <Input className={inputCls} placeholder="08x-xxx-xxxx" allowClear />
                  </CommonForm.Item>
                </div>
              </div>
            </div>

            <div>
              <Label>ชื่อชมรม/ทีม / Club or Team Name</Label>
              <CommonForm.Item name={["applicants", index, "teamClub"]} className="!mb-0">
                <Input className={inputCls} placeholder="กรอกชื่อชมรม/ทีม (ถ้ามี)" allowClear />
              </CommonForm.Item>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ApplicantForm;
