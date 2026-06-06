import { Button, Checkbox, Col, Row, Spin, Switch } from "antd";
import CommonForm from "components/commonForm";
import React, { useEffect, useRef, useState } from "react";
import useUploadFileHook from "hooks/useUploadFileHook";
import { genderOption } from "constants/options/genderOption";
import { bloodGroupOption } from "constants/options/bloodGroupOption";
import ProvinceSelector from "components/provinceSelector";
import backofficeServices from "services/backoffice.services";
import { useDispatch } from "react-redux";
import { PROFILE_LOADING } from "store/reducers/profileSlice";
import { AlertSuccess, AlertError, AlertConfirm } from "components/alert";
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
      AlertSuccess({});
      document.activeElement?.blur?.();
      await qc.invalidateQueries({ queryKey: ["me"] });
      setTimeout(() => globalThis.scrollTo({ top: 0, behavior: "smooth" }), 0);
    },
    (err) => {
      AlertError({ text: errorToMessage(err) });
    }
  );

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

  return (
    <div className="md:max-w-screen-lg mx-auto pt-3">
      <Spin spinning={spinning}>
        <CommonForm form={form} name="user-profile" layout="vertical" onFinish={onFinish} autoComplete="off">
          <div className="grid gap-2">
            <Row gutter={{ xs: 2, md: 8 }}>
              <Col>
                <CommonForm.Item>
                  <ImageUpload
                    label={t("back.setting.profile.profileImg")}
                    prefix={prefix}
                    filename={me?.pictureUrl}
                    hooks={profileImgHooks}
                    uploadText={t("general.uploadImg")}
                  />
                </CommonForm.Item>
              </Col>
            </Row>

            <div className="grid gap-0 md:gap-2">
              <Row gutter={{ xs: 2, md: 8 }}>
                <Col xs={24} md={8}>
                  <CommonForm.Item
                    name="firstName"
                    rules={[{ required: true, message: t("required.firstName") }]}
                  >
                    <FloatingLabel size="large" label={t("back.setting.profile.firstName")} required />
                  </CommonForm.Item>
                </Col>
                <Col xs={24} md={8}>
                  <CommonForm.Item
                    name="lastName"
                    rules={[{ required: true, message: t("required.lastName") }]}
                  >
                    <FloatingLabel size="large" label={t("back.setting.profile.lastName")} required />
                  </CommonForm.Item>
                </Col>
                <Col xs={24} md={8}>
                  <CommonForm.Item
                    name="gender"
                    rules={[{ required: true, message: t("required.gender") }]}
                  >
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

              <Row gutter={{ xs: 2, md: 8 }}>
                <Col xs={24} md={8}>
                  <CommonForm.Item
                    name="firstNameEn"
                    rules={[{ pattern: /^[A-Za-z\s]+$/, message: t("validation.en") }]}
                  >
                    <FloatingLabel
                      pattern="^[A-Za-z\s]+$"
                      size="large"
                      label={t("back.setting.profile.firstNameEn")}
                    />
                  </CommonForm.Item>
                </Col>
                <Col xs={24} md={8}>
                  <CommonForm.Item
                    name="lastNameEn"
                    rules={[{ pattern: /^[A-Za-z\s]+$/, message: t("validation.en") }]}
                  >
                    <FloatingLabel
                      pattern="^[A-Za-z\s]+$"
                      size="large"
                      label={t("back.setting.profile.lastNameEn")}
                    />
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

              <Row gutter={{ xs: 2, md: 8 }}>
                <Col xs={24} md={8}>
                  <CommonForm.Item
                    name="idNo"
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
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600">{t("back.setting.profile.age")}</label>
                    <span className="text-base">{calculateAge(birthDate) || "-"}</span>
                  </div>
                </Col>
              </Row>
            </div>

            <div className="grid gap-0 md:gap-2">
              <Row gutter={{ xs: 2, md: 8 }}>
                <Col xs={24} md={8}>
                  <CommonForm.Item name="bloodType">
                    <FloatingLabel
                      type="select"
                      size="large"
                      label={t("back.setting.profile.bloodGroup")}
                      options={bloodGroupOption}
                    />
                  </CommonForm.Item>
                </Col>
                <Col xs={24} md={8}>
                  <CommonForm.Item name="healthIssues">
                    <FloatingLabel size="large" label={t("back.setting.profile.healthIssues")} />
                  </CommonForm.Item>
                </Col>
                <Col xs={24} md={8}>
                  <CommonForm.Item name="email">
                    <FloatingLabel label={t("general.email")} type="text" disabled />
                  </CommonForm.Item>
                </Col>
              </Row>

              <Row gutter={{ xs: 2, md: 8 }}>
                <Col xs={24} md={8}>
                  <CommonForm.Item
                    name="phone"
                    rules={[{ pattern: /^[0-9]{7,15}$/, message: t("validation.phone") }]}
                  >
                    <FloatingLabel type="phone" maxLength={15} size="large" label={t("general.tel")} />
                  </CommonForm.Item>
                </Col>

                {roleUser === "organizer" && (
                  <Col xs={24} md={8}>
                    <CommonForm.Item
                      name="companyName"
                      rules={[{ required: true, message: t("required.companyName") }]}
                    >
                      <FloatingLabel size="large" label={t("back.setting.profile.companyName")} required />
                    </CommonForm.Item>
                  </Col>
                )}
              </Row>
            </div>

            <div className="text-xl font-semibold mb-3">
              {t("back.setting.profile.titleEmergencyContact")}
            </div>

            <Row gutter={{ xs: 2, md: 8 }}>
              <Col xs={24} md={16}>
                <CommonForm.Item name="emergencyContact">
                  <FloatingLabel size="large" label={t("back.setting.profile.emergencyContact")} />
                </CommonForm.Item>
              </Col>
              <Col xs={24} md={8}>
                <CommonForm.Item
                  name="emergencyPhone"
                  rules={[{ pattern: /^[0-9]{7,15}$/, message: t("validation.phone") }]}
                >
                  <FloatingLabel type="phone" maxLength={15} size="large" label={t("back.setting.profile.emergencyContactTel")} />
                </CommonForm.Item>
              </Col>
            </Row>

            <div className="text-xl font-semibold mb-3">
              {t("back.setting.profile.titleAddress")}
            </div>

            <div className="grid gap-0 md:gap-2">
              <Row gutter={{ xs: 2, md: 8 }}>
                <Col xs={24}>
                  <CommonForm.Item name="address">
                    <FloatingLabel size="large" label={t("back.setting.profile.address")} />
                  </CommonForm.Item>
                </Col>
              </Row>

              <ProvinceSelector
                form={form}
                rowGutter={{ xs: 2, md: 8 }}
                fieldNames={{
                  zipcode: "zipcode",
                  province: "province",
                  amphoe: "amphoe",
                  district: "district",
                }}
                compact
                labels={{
                  zipcode: t("back.setting.profile.zipcode"),
                  province: t("back.setting.profile.province"),
                  amphoe: t("back.setting.profile.amphoe"),
                  district: t("back.setting.profile.district"),
                }}
                valueMode={{ province: "nameTh", amphoe: "nameTh", district: "nameTh" }}
              />
            </div>

            <div className="text-xl font-semibold mb-3">
              {t("back.setting.profile.titleShippingAddress")}
            </div>

            <div className="grid gap-0 md:gap-2">
              <Row gutter={{ xs: 2, md: 8 }}>
                <Col xs={24}>
                  <CommonForm.Item name="shippingAddress">
                    <FloatingLabel size="large" label={t("back.setting.profile.shippingAddress")} />
                  </CommonForm.Item>
                </Col>
              </Row>

              <ProvinceSelector
                form={form}
                rowGutter={{ xs: 2, md: 8 }}
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
            </div>

            {roleUser === "admin" && fieldsChange.isApprover && (
              <>
                <div className="text-xl font-semibold mb-3">
                  {t("back.setting.profile.titleDocument")}
                </div>

                <Row gutter={{ xs: 2, md: 8 }}>
                  <Col xs={24} md={8}>
                    <CommonForm.Item
                      name="tranferApprover"
                      valuePropName="checked"
                      onChange={(e) =>
                        setFieldsChange({ ...fieldsChange, tranferApprover: e.target.checked })
                      }
                    >
                      <Checkbox className="!w-full !flex !items-center" size="large">
                        {t("back.setting.profile.tranferApprover")}
                      </Checkbox>
                    </CommonForm.Item>
                  </Col>

                  {fieldsChange.tranferApprover && (
                    <Col xs={24} md={8}>
                      <CommonForm.Item
                        name="approverId"
                        rules={[{ required: true, message: t("required.approver") }]}
                      >
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
                      size="large"
                      checked={fieldsChange.takeSignature}
                      checkedChildren={t("back.setting.profile.takeSignature")}
                      unCheckedChildren={t("general.uploadSignature")}
                      onChange={(checked) =>
                        setFieldsChange({ ...fieldsChange, takeSignature: checked })
                      }
                    />
                  </CommonForm.Item>
                )}

                <Row gutter={{ xs: 2, md: 8 }}>
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
                      <Col xs={24} md={8}>
                        <CommonForm.Item name="signatureUrl">
                          <SignatureCanvas
                            ref={signatureRef}
                            penColor="blue"
                            canvasProps={{
                              style: {
                                width: "100%",
                                height: 200,
                                border: "1px solid #999999",
                                borderRadius: "5px",
                              },
                            }}
                          />
                        </CommonForm.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Button variant="contained" onClick={() => signatureRef.current?.clear()}>
                          {t("general.clear")}
                        </Button>
                      </Col>
                    </>
                  )}
                </Row>
              </>
            )}

            <CommonForm.Item>
              <Button size="large" type="primary" htmlType="submit" loading={isPending}>
                {t("general.buttonSave")}
              </Button>
            </CommonForm.Item>
          </div>
        </CommonForm>
      </Spin>
    </div>
  );
}

export default Profile;
