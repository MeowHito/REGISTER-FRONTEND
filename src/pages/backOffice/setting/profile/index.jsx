import { Button, Checkbox, Col, notification, Row, Spin, Switch } from "antd";
import {
  CarOutlined,
  ContactsOutlined,
  EnvironmentOutlined,
  FileProtectOutlined,
  IdcardOutlined,
  LockOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";
import CommonForm from "components/commonForm";
import React, { useEffect, useRef, useState } from "react";
import useUploadFileHook from "hooks/useUploadFileHook";
import { genderOption } from "constants/options/genderOption";
import { bloodGroupOption } from "constants/options/bloodGroupOption";
import ProvinceSelector from "components/provinceSelector";
import backofficeServices from "services/backoffice.services";
import { useDispatch } from "react-redux";
import { PROFILE_LOADING } from "store/reducers/profileSlice";
import { AlertError, AlertConfirm } from "components/alert";
import SectionCard from "components/sectionCard";
import StickyActionBar from "components/stickyActionBar";
import { errorToMessage } from "hooks/functions/errorToMessage";
import { onUploadFile } from "hooks/onUploadFile";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import masterService from "services/master.services";
import { handleQueryStatus } from "utils";
import SignatureCanvas from "react-signature-canvas";
import { dataURLtoFile, getImageFileToUpload } from "utils/fileUtils";
import ImageUpload from "components/imageUpload";
import FloatingLabel from "components/floatingLabel";
import { validateIDCard } from "utils/validate";
import useMe from "hooks/useMe";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toStartOfDayISO } from "utils/format";

function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = CommonForm.useForm();
  const dispatch = useDispatch();
  const qc = useQueryClient();

  const { data: me, status: meStatus, fetchStatus: meFetchStatus } = useMe({ retry: 0 });
  const roleUser = me?.role?.roleType;

  const [nationalityOption, setNationalityOption] = useState([]);
  const [userAdminOption, setUserAdminOption] = useState([]);
  const [fieldsChange, setFieldsChange] = useState({});
  const [dirty, setDirty] = useState(false);
  const signatureRef = useRef();
  const birthDate = CommonForm.useWatch("birthDate", form);

  const profileImgHooks = useUploadFileHook();
  const signatureImgHooks = useUploadFileHook();
  const prefix = "userData";

  const { fileList: profileFileList, setFileList: setProfileFileList } = profileImgHooks;
  const { fileList: signatureFileList, setFileList: setSignatureFileList } = signatureImgHooks;



  const { data: roleData, isFetching: isLoadingUserAdmin, ...otherRole } =
    backofficeServices.useQueryGetUserActiveByRoleType({ role: "admin" });

  const {
    data: nationalities,
    isFetching: isLoadingNationality,
    ...otherNationalities
  } = masterService.useQueryGetNationality();

  const { mutate: updateUserProfile, isPending } = backofficeServices.useMutationUpdateUser(
    async () => {
      dispatch(PROFILE_LOADING(true));
      setProfileFileList((oldList) => (oldList || []).filter((f) => f.isPreview));
      setSignatureFileList((oldList) => (oldList || []).filter((f) => f.isPreview));
      setFieldsChange({});
      setDirty(false);
      notification.success({
        message: t("back.shell.savedTitle"),
        description: t("back.shell.savedDesc"),
        placement: "topRight",
      });
      document.activeElement?.blur?.();
      await qc.invalidateQueries({ queryKey: ["me"] });
      setTimeout(() => globalThis.scrollTo({ top: 0, behavior: "smooth" }), 0);
    },
    (err) => {
      AlertError({ text: errorToMessage(err) });
    }
  );

  // A picked (not yet uploaded) image counts as an unsaved change.
  useEffect(() => {
    const hasNewFile = [...(profileFileList || []), ...(signatureFileList || [])].some((f) => f && !f.isPreview);
    if (hasNewFile) setDirty(true);
  }, [profileFileList, signatureFileList]);

  useEffect(() => {
    if (meStatus === "error") {
      navigate("/login", { replace: true });
    }
  }, [meStatus, navigate]);

  useEffect(() => {
    handleQueryStatus(
      { status: meStatus, fetchStatus: meFetchStatus },
      () => {
        if (!me) return;
        const data = {
          ...me,
          birthDate: me?.birthDate ? dayjs(me.birthDate) : null,
          tranferApprover: false,
          takeSignature: false,
        };
        setFieldsChange(prev => {
          const same = JSON.stringify(prev) === JSON.stringify(data);
          return same ? prev : data;
        });
        form.setFieldsValue(data);
      },
      () => {
        navigate("/login", { replace: true });
      }
    );
  }, [meStatus, meFetchStatus, me]);

  useEffect(() => {
    handleQueryStatus(otherRole, () => {
      const options =
        (roleData || []).map((n) => ({
          value: n.id,
          label: `${n?.firstName || ""} ${n?.lastName || ""}`.trim(),
        })) || [];
      setUserAdminOption(options);
    });
  }, [otherRole.fetchStatus, otherRole.status, roleData]);

  useEffect(() => {
    handleQueryStatus(otherNationalities, () => {
      const options =
        (nationalities || []).map((n) => ({
          value: n.alpha_3_code,
          label: n.nationality,
        })) || [];
      setNationalityOption(options);
    });
  }, [otherNationalities.fetchStatus, otherNationalities.status, nationalities]);

  const onFinish = (values) => {
    const doSave = async () => {
      const fileName = await getImageFileToUpload({
        fileList: profileFileList,
        prefix,
        oldKey: me?.pictureUrl,
      });

      let fileSignature = null;
      if (fieldsChange.takeSignature && signatureRef.current && !signatureRef.current.isEmpty()) {
        const signatureData = signatureRef.current?.toDataURL();
        const signatureFile = signatureData ? dataURLtoFile(signatureData, `signature.jpg`) : null;
        fileSignature = await onUploadFile({ prefix, fileList: [{ originFileObj: signatureFile }] });
      } else {
        fileSignature = await getImageFileToUpload({
          fileList: signatureFileList,
          prefix,
          oldKey: me?.signatureUrl,
        });
      }

      const payload = {
        ...me,
        ...values,
        birthDate: toStartOfDayISO(values?.birthDate),
        pictureUrl: fileName,
        prefixPath: prefix,
        signatureUrl: fileSignature,
        isApprover: !(values?.tranferApprover || values?.approverId === null || !me?.isApprover),
      };
      updateUserProfile(payload);
    };

    const isFirstIdNo = !me?.idNo && values.idNo;
    if (isFirstIdNo) {
      AlertConfirm({
        title: t("back.setting.profile.idNoConfirmTitle"),
        text: t("back.setting.profile.idNoConfirmText"),
        onOk: () => {
          AlertConfirm({ onOk: doSave });
        },
      });
    } else {
      AlertConfirm({ onOk: doSave });
    }
  };

  const calculateAge = (date) => {
    const d = dayjs(date);
    if (!d.isValid()) return "";
    const now = dayjs();
    return `${now.year() - d.year()}`;
  };

  const spinning = meFetchStatus === "fetching";

  // Some inputs (the birth-date selects) re-emit their value on mount; only a
  // value that really differs from what was loaded counts as an edit.
  const handleValuesChange = (changed) => {
    const edited = Object.entries(changed).some(([key, value]) => {
      const loaded = fieldsChange?.[key];
      if (dayjs.isDayjs(value) || dayjs.isDayjs(loaded)) {
        if (!value || !loaded) return !!value !== !!loaded;
        return !dayjs(value).isSame(dayjs(loaded), "day");
      }
      return JSON.stringify(value ?? null) !== JSON.stringify(loaded ?? null);
    });
    if (edited) setDirty(true);
  };

  const resetForm = () => {
    form.resetFields();
    form.setFieldsValue({
      ...me,
      birthDate: me?.birthDate ? dayjs(me.birthDate) : null,
      tranferApprover: false,
      takeSignature: false,
    });
    setProfileFileList((oldList) => (oldList || []).filter((f) => f.isPreview));
    setDirty(false);
  };

  const gutter = { xs: 8, md: 16 };

  return (
    <Spin spinning={spinning}>
      <CommonForm
        form={form}
        name="user-profile"
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={handleValuesChange}
        autoComplete="off"
      >
        <div className="grid gap-6">
          <SectionCard
            icon={<IdcardOutlined />}
            tone="blue"
            title={t("back.setting.profile.sectionBasic")}
            description={t("back.setting.profile.sectionBasicDesc")}
          >
            <div className="bo-inset p-4 md:p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="shrink-0">
                <ImageUpload
                  prefix={prefix}
                  filename={me?.pictureUrl}
                  hooks={profileImgHooks}
                  uploadText={t("general.uploadImg")}
                />
              </div>
              <div>
                <p className="m-0 text-sm font-semibold text-[#1d1d1f]">{t("back.setting.profile.profileImg")}</p>
                <p className="m-0 mt-1 text-xs text-[#6e6e73]">{t("back.setting.profile.profileImgHint")}</p>
              </div>
            </div>

            <Row gutter={gutter}>
              <Col xs={24} md={8}>
                <CommonForm.Item name="firstName" rules={[{ required: true, message: t("required.firstName") }]}>
                  <FloatingLabel size="large" label={t("back.setting.profile.firstName")} required />
                </CommonForm.Item>
              </Col>
              <Col xs={24} md={8}>
                <CommonForm.Item name="lastName" rules={[{ required: true, message: t("required.lastName") }]}>
                  <FloatingLabel size="large" label={t("back.setting.profile.lastName")} required />
                </CommonForm.Item>
              </Col>
              <Col xs={24} md={8}>
                <CommonForm.Item name="gender" rules={[{ required: true, message: t("required.gender") }]}>
                  <FloatingLabel
                    type="radio"
                    size="large"
                    optionType="default"
                    options={genderOption}
                    label={t("back.setting.profile.gender")}
                    required
                  />
                </CommonForm.Item>
              </Col>
            </Row>

            <Row gutter={gutter}>
              <Col xs={24} md={8}>
                <CommonForm.Item name="firstNameEn" rules={[{ pattern: /^[A-Za-z\s]+$/, message: t("validation.en") }]}>
                  <FloatingLabel pattern="^[A-Za-z\s]+$" size="large" label={t("back.setting.profile.firstNameEn")} />
                </CommonForm.Item>
              </Col>
              <Col xs={24} md={8}>
                <CommonForm.Item name="lastNameEn" rules={[{ pattern: /^[A-Za-z\s]+$/, message: t("validation.en") }]}>
                  <FloatingLabel pattern="^[A-Za-z\s]+$" size="large" label={t("back.setting.profile.lastNameEn")} />
                </CommonForm.Item>
              </Col>
              <Col xs={24} md={8}>
                <CommonForm.Item name="nationality">
                  <FloatingLabel
                    type="select"
                    showSearch
                    disabled={isLoadingNationality}
                    label={t("back.setting.profile.nationality")}
                    size="large"
                    options={nationalityOption}
                  />
                </CommonForm.Item>
              </Col>
            </Row>

            <Row gutter={gutter}>
              <Col xs={24} md={16}>
                <CommonForm.Item
                  name="idNo"
                  extra={me?.idNo ? <span className="text-xs text-[#6e6e73]"><LockOutlined /> {t("back.setting.profile.idNoLockedHint")}</span> : null}
                  rules={[
                    { required: true, message: t("required.idNo") },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        const isCitizen = /^[0-9]{13}$/.test(value);
                        const isPassport = /^[A-Z0-9]{5,20}$/i.test(value);
                        if (isCitizen && !validateIDCard(value)) {
                          return Promise.reject(t("validation.idNo"));
                        }
                        if (!isCitizen && !isPassport) {
                          return Promise.reject(t("validation.idNoAndPassport"));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <FloatingLabel type="en" maxLength={20} size="large" label={t("back.setting.profile.idNo")} required disabled={!!me?.idNo} />
                </CommonForm.Item>
              </Col>
              <Col xs={24} md={8}>
                <CommonForm.Item name="email">
                  <FloatingLabel label={t("general.email")} type="text" size="large" disabled />
                </CommonForm.Item>
              </Col>
            </Row>

            <Row gutter={gutter}>
              <Col xs={24} md={16}>
                <CommonForm.Item
                  name="birthDate"
                  rules={[{ required: true, message: t("required.birthDate") }]}
                  validateTrigger={["onBlur", "onSubmit"]}
                >
                  <FloatingLabel
                    type="dateselect"
                    showSearch
                    size="large"
                    label={t("back.setting.profile.birthDate")}
                    required
                    className="grid grid-cols-3 gap-2"
                  />
                </CommonForm.Item>
              </Col>
              <Col xs={24} md={8}>
                <div className="bo-inset h-[42px] px-3 flex items-center justify-between mb-6">
                  <span className="text-sm font-semibold text-[#0071e3]">
                    {calculateAge(birthDate) ? t("back.setting.profile.ageYears", { age: calculateAge(birthDate) }) : "-"}
                  </span>
                  <span className="text-xs text-[#6e6e73]">{t("back.setting.profile.age")}</span>
                </div>
              </Col>
            </Row>

            {roleUser === "organizer" && (
              <Row gutter={gutter}>
                <Col xs={24} md={16}>
                  <CommonForm.Item name="companyName" rules={[{ required: true, message: t("required.companyName") }]}>
                    <FloatingLabel size="large" label={t("back.setting.profile.companyName")} required />
                  </CommonForm.Item>
                </Col>
              </Row>
            )}
          </SectionCard>

          <SectionCard
            icon={<MedicineBoxOutlined />}
            tone="orange"
            title={t("back.setting.profile.sectionHealth")}
            description={t("back.setting.profile.sectionHealthDesc")}
          >
            <Row gutter={gutter}>
              <Col xs={24} md={12}>
                <CommonForm.Item name="bloodType">
                  <FloatingLabel type="select" size="large" label={t("back.setting.profile.bloodGroup")} options={bloodGroupOption} />
                </CommonForm.Item>
              </Col>
              <Col xs={24} md={12}>
                <CommonForm.Item name="phone" rules={[{ pattern: /^[0-9]{7,15}$/, message: t("validation.phone") }]}>
                  <FloatingLabel type="phone" maxLength={15} size="large" label={t("general.tel")} />
                </CommonForm.Item>
              </Col>
              <Col xs={24}>
                <CommonForm.Item name="healthIssues">
                  <FloatingLabel size="large" label={t("back.setting.profile.healthIssues")} />
                </CommonForm.Item>
              </Col>
            </Row>
          </SectionCard>

          <SectionCard
            icon={<ContactsOutlined />}
            tone="indigo"
            title={t("back.setting.profile.titleEmergencyContact")}
            description={t("back.setting.profile.sectionEmergencyDesc")}
          >
            <Row gutter={gutter}>
              <Col xs={24} md={8}>
                <CommonForm.Item name="emergencyContact">
                  <FloatingLabel size="large" label={t("back.setting.profile.emergencyContact")} />
                </CommonForm.Item>
              </Col>
              <Col xs={24} md={8}>
                <CommonForm.Item name="emergencyRelation">
                  <FloatingLabel size="large" label={t("back.setting.profile.emergencyRelation")} />
                </CommonForm.Item>
              </Col>
              <Col xs={24} md={8}>
                <CommonForm.Item name="emergencyPhone" rules={[{ pattern: /^[0-9]{7,15}$/, message: t("validation.phone") }]}>
                  <FloatingLabel type="phone" maxLength={15} size="large" label={t("back.setting.profile.emergencyContactTel")} />
                </CommonForm.Item>
              </Col>
            </Row>
          </SectionCard>

          <SectionCard
            icon={<EnvironmentOutlined />}
            tone="green"
            title={t("back.setting.profile.titleAddress")}
            description={t("back.setting.profile.sectionAddressDesc")}
          >
            <CommonForm.Item name="address">
              <FloatingLabel size="large" label={t("back.setting.profile.address")} />
            </CommonForm.Item>
            <ProvinceSelector
              form={form}
              rowGutter={gutter}
              fieldNames={{ zipcode: "zipcode", province: "province", amphoe: "amphoe", district: "district" }}
              compact
              labels={{
                zipcode: t("back.setting.profile.zipcode"),
                province: t("back.setting.profile.province"),
                amphoe: t("back.setting.profile.amphoe"),
                district: t("back.setting.profile.district"),
              }}
              valueMode={{ province: "nameTh", amphoe: "nameTh", district: "nameTh" }}
            />
          </SectionCard>

          <SectionCard
            icon={<CarOutlined />}
            tone="teal"
            title={t("back.setting.profile.titleShippingAddress")}
            description={t("back.setting.profile.sectionShippingDesc")}
          >
            <CommonForm.Item name="shippingAddress">
              <FloatingLabel size="large" label={t("back.setting.profile.shippingAddress")} />
            </CommonForm.Item>
            <ProvinceSelector
              form={form}
              rowGutter={gutter}
              fieldNames={{
                zipcode: "shippingZipcode",
                province: "shippingProvince",
                amphoe: "shippingAmphoe",
                district: "shippingDistrict",
              }}
              compact
              labels={{
                zipcode: t("back.setting.profile.shippingZipcode"),
                province: t("back.setting.profile.shippingProvince"),
                amphoe: t("back.setting.profile.shippingAmphoe"),
                district: t("back.setting.profile.shippingDistrict"),
              }}
              valueMode={{ province: "nameTh", amphoe: "nameTh", district: "nameTh" }}
            />
          </SectionCard>

          {roleUser === "admin" && fieldsChange.isApprover && (
            <SectionCard
              icon={<FileProtectOutlined />}
              tone="gray"
              title={t("back.setting.profile.titleDocument")}
              description={t("back.setting.profile.sectionDocumentDesc")}
            >
              <Row gutter={gutter}>
                <Col xs={24} md={8}>
                  <CommonForm.Item
                    name="tranferApprover"
                    valuePropName="checked"
                    onChange={(e) => setFieldsChange({ ...fieldsChange, tranferApprover: e.target.checked })}
                  >
                    <Checkbox className="!w-full !flex !items-center" size="large">
                      {t("back.setting.profile.tranferApprover")}
                    </Checkbox>
                  </CommonForm.Item>
                </Col>

                {fieldsChange.tranferApprover && (
                  <Col xs={24} md={8}>
                    <CommonForm.Item name="approverId" rules={[{ required: true, message: t("required.approver") }]}>
                      <FloatingLabel
                        type="select"
                        showSearch
                        disabled={isLoadingUserAdmin}
                        label={t("back.setting.profile.selectUserAdmin")}
                        size="large"
                        options={userAdminOption}
                        filterOption={(input, option) =>
                          (option?.label || "").toLowerCase().includes(input.toLowerCase())
                        }
                        required
                      />
                    </CommonForm.Item>
                  </Col>
                )}
              </Row>

              {!fieldsChange.tranferApprover && (
                <CommonForm.Item>
                  <Switch
                    checked={fieldsChange.takeSignature}
                    checkedChildren={t("back.setting.profile.takeSignature")}
                    unCheckedChildren={t("general.uploadSignature")}
                    onChange={(checked) => {
                      setFieldsChange({ ...fieldsChange, takeSignature: checked });
                      setDirty(true);
                    }}
                  />
                </CommonForm.Item>
              )}

              <Row gutter={gutter}>
                {!fieldsChange.tranferApprover && !fieldsChange.takeSignature && (
                  <Col xs={24} md={8}>
                    <CommonForm.Item>
                      <ImageUpload
                        prefix={prefix}
                        filename={me?.signatureUrl}
                        hooks={signatureImgHooks}
                        uploadText={t("general.uploadSignature")}
                        isEditable={fieldsChange.isApprover}
                      />
                    </CommonForm.Item>
                  </Col>
                )}

                {!fieldsChange.tranferApprover && fieldsChange.takeSignature && (
                  <>
                    <Col xs={24} md={12}>
                      <CommonForm.Item name="signatureUrl">
                        <SignatureCanvas
                          ref={signatureRef}
                          penColor="blue"
                          onEnd={() => setDirty(true)}
                          canvasProps={{
                            style: {
                              width: "100%",
                              height: 200,
                              border: "1px solid #d2d2d7",
                              borderRadius: "12px",
                              background: "#fbfbfd",
                            },
                          }}
                        />
                      </CommonForm.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Button onClick={() => signatureRef.current?.clear()}>{t("general.clear")}</Button>
                    </Col>
                  </>
                )}
              </Row>
            </SectionCard>
          )}
        </div>

        <StickyActionBar
          dirty={dirty}
          onCancel={dirty ? resetForm : undefined}
          saving={isPending}
          saveHtmlType="submit"
          saveText={t("general.buttonSave")}
        />
      </CommonForm>
    </Spin>
  );
}

export default Profile;
