import React, { useEffect, useCallback, useMemo } from "react";
import { Col, Row, Tag } from "antd";
import {
  EnvironmentOutlined,
  CheckCircleFilled,
  LoadingOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import FloatingLabel from "components/floatingLabel";
import CommonForm from "components/commonForm";
import masterService from "services/master.services";
import { useTranslation } from "react-i18next";
import _ from "lodash";
import "./provinceSelector.css";

const ProvinceSelector = ({
  form,
  basePath = [],
  nameBasePath,
  fieldNames = {},
  labels = {},
  rowGutter = [16, 16],
  disabled = false,
  showCard = false,
  compact = false,
  valueMode = {},
  required = false,
}) => {
  const { t, i18n } = useTranslation();
  const nameKey = i18n.language === "th" ? "nameTh" : "nameEn";

  const fields = {
    zipcode:  fieldNames.zipcode  || "zipcode",
    province: fieldNames.province || "province",
    amphoe:   fieldNames.amphoe   || "amphoe",
    district: fieldNames.district || "district",
  };

  const fieldLabels = {
    zipcode:  labels.zipcode  || t("back.setting.user.form.zipcode"),
    province: labels.province || t("back.setting.user.form.province"),
    amphoe:   labels.amphoe   || t("back.setting.user.form.amphoe"),
    district: labels.district || t("back.setting.user.form.district"),
  };

  const vMode = {
    province: valueMode?.province || "code",
    amphoe:   valueMode?.amphoe   || "code",
    district: valueMode?.district || "code",
  };

  const makePath = useCallback(
    (field) => [...basePath, field],
    [basePath]
  );

  const resolvedNameBase = nameBasePath != null ? nameBasePath : basePath;
  const makeNamePath = useCallback(
    (field) => [...resolvedNameBase, field],
    [resolvedNameBase]
  );

  const selectedProvince = CommonForm.useWatch(makePath(fields.province), form);
  const selectedAmphoe   = CommonForm.useWatch(makePath(fields.amphoe), form);
  const selectedDistrict = CommonForm.useWatch(makePath(fields.district), form);
  const selectedZipcode  = CommonForm.useWatch(makePath(fields.zipcode), form);

  const setField = useCallback(
    (field, value) => {
      const path = makePath(field);
      const current = form?.getFieldValue?.(path);
      if (!_.isEqual(current, value)) {
        form?.setFieldValue?.(path, value);
      }
    },
    [form, makePath]
  );

  const pickVal = useCallback(
    (record, fieldKey) => {
      const mode = vMode[fieldKey];
      if (mode === "nameTh") return record.nameTh;
      if (mode === "nameEn") return record.nameEn;
      return record.code;
    },
    [vMode]
  );

  const pickLookupVal = useCallback(
    (row, fieldKey, geoList) => {
      const mode = vMode[fieldKey];
      if (fieldKey === "province") {
        if (mode === "code")   return row.provinceCode;
        if (mode === "nameTh") return row.provinceName;
        return geoList?.find((r) => r.code === row.provinceCode)?.nameEn ?? row.provinceName;
      }
      if (fieldKey === "amphoe") {
        if (mode === "code")   return row.districtCode;
        if (mode === "nameTh") return row.districtName;
        return geoList?.find((r) => r.code === row.districtCode)?.nameEn ?? row.districtName;
      }
      if (fieldKey === "district") {
        if (mode === "code")   return row.subdistrictCode;
        if (mode === "nameTh") return row.subdistrictName;
        return geoList?.find((r) => r.code === row.subdistrictCode)?.nameEn ?? row.subdistrictName;
      }
    },
    [vMode]
  );

  const districtParam = useMemo(() => {
    if (!selectedProvince) return {};
    return vMode.province === "code"
      ? { provinceCode: selectedProvince }
      : { provinceName: selectedProvince };
  }, [selectedProvince, vMode.province]);

  const subdistrictParam = useMemo(() => {
    if (!selectedAmphoe) return {};
    return vMode.amphoe === "code"
      ? { districtCode: selectedAmphoe }
      : { districtName: selectedAmphoe };
  }, [selectedAmphoe, vMode.amphoe]);

  const { data: provinces = [], isFetching: loadingProvinces } =
    masterService.useQueryGetProvinces();

  const { data: districts = [], isFetching: loadingDistricts } =
    masterService.useQueryGetDistricts(districtParam);

  const { data: subdistricts = [], isFetching: loadingSubdistricts } =
    masterService.useQueryGetSubdistricts(subdistrictParam);

  const { data: postalLookup = [], isFetching: loadingPostal } =
    masterService.useQueryGeoLookupByPostal({ postalCode: selectedZipcode });

  const isLoading = loadingProvinces || loadingDistricts || loadingSubdistricts || loadingPostal;

  const filledCount = [selectedZipcode, selectedProvince, selectedAmphoe, selectedDistrict]
    .filter(Boolean).length;
  const isComplete = filledCount === 4;
  const isPartial = filledCount > 0 && filledCount < 4;
  const isRequired = required || isPartial;

  const provinceOptions = useMemo(
    () => provinces.map((p) => ({ label: p[nameKey], value: pickVal(p, "province") })),
    [provinces, pickVal, nameKey]
  );

  const amphoeOptions = useMemo(() => {
    if (selectedZipcode && String(selectedZipcode).length === 5 && postalLookup.length) {
      const allowed = new Set(
        postalLookup
          .filter((r) => !selectedProvince || pickLookupVal(r, "province", provinces) === selectedProvince)
          .map((r) => pickLookupVal(r, "amphoe", districts))
      );
      return districts
        .filter((d) => allowed.has(pickVal(d, "amphoe")))
        .map((d) => ({ label: d[nameKey], value: pickVal(d, "amphoe") }));
    }
    return districts.map((d) => ({ label: d[nameKey], value: pickVal(d, "amphoe") }));
  }, [districts, postalLookup, selectedZipcode, selectedProvince, provinces, pickVal, pickLookupVal, nameKey]);

  const districtOptions = useMemo(() => {
    if (selectedZipcode && String(selectedZipcode).length === 5 && postalLookup.length) {
      const allowed = new Set(
        postalLookup
          .filter(
            (r) =>
              (!selectedProvince || pickLookupVal(r, "province", provinces) === selectedProvince) &&
              (!selectedAmphoe   || pickLookupVal(r, "amphoe",   districts)  === selectedAmphoe)
          )
          .map((r) => pickLookupVal(r, "district", subdistricts))
      );
      return subdistricts
        .filter((s) => allowed.has(pickVal(s, "district")))
        .map((s) => ({ label: s[nameKey], value: pickVal(s, "district") }));
    }
    return subdistricts.map((s) => ({ label: s[nameKey], value: pickVal(s, "district") }));
  }, [subdistricts, postalLookup, selectedZipcode, selectedProvince, selectedAmphoe, provinces, districts, pickVal, pickLookupVal, nameKey]);

  const handleZipcodeChange = useCallback(() => {
    setField(fields.province, null);
    setField(fields.amphoe,   null);
    setField(fields.district, null);
  }, [fields, setField]);

  const handleProvinceChange = useCallback(() => {
    setField(fields.amphoe,   null);
    setField(fields.district, null);
    setField(fields.zipcode,  null);
  }, [fields, setField]);

  const handleAmphoeChange = useCallback(() => {
    setField(fields.district, null);
    setField(fields.zipcode,  null);
  }, [fields, setField]);

  const handleDistrictChange = useCallback(
    (value) => {
      if (!value) return;
      const sub = subdistricts.find((s) => pickVal(s, "district") === value);
      if (sub?.postalCode) setField(fields.zipcode, sub.postalCode);
    },
    [subdistricts, pickVal, setField, fields]
  );

  const handleClearAll = useCallback(() => {
    Object.values(fields).forEach((f) => setField(f, null));
  }, [fields, setField]);

  useEffect(() => {
    if (!selectedZipcode || String(selectedZipcode).length !== 5) return;
    if (!postalLookup.length) return;

    let candidates = postalLookup;
    if (selectedProvince)
      candidates = candidates.filter((r) => pickLookupVal(r, "province", provinces) === selectedProvince);
    if (selectedAmphoe)
      candidates = candidates.filter((r) => pickLookupVal(r, "amphoe", districts) === selectedAmphoe);
    if (selectedDistrict)
      candidates = candidates.filter((r) => pickLookupVal(r, "district", subdistricts) === selectedDistrict);

    if (!selectedProvince) {
      const unique = _.uniq(candidates.map((r) => pickLookupVal(r, "province", provinces)));
      if (unique.length === 1) setField(fields.province, unique[0]);
    }
    if (!selectedAmphoe) {
      const unique = _.uniq(candidates.map((r) => pickLookupVal(r, "amphoe", districts)));
      if (unique.length === 1) setField(fields.amphoe, unique[0]);
    }
    if (!selectedDistrict) {
      const unique = _.uniq(candidates.map((r) => pickLookupVal(r, "district", subdistricts)));
      if (unique.length === 1) setField(fields.district, unique[0]);
    }
  }, [
    selectedZipcode, postalLookup,
    selectedProvince, selectedAmphoe, selectedDistrict,
    provinces, districts, subdistricts,
    setField, fields, pickLookupVal,
  ]);

  useEffect(() => {
    if (!selectedProvince && provinceOptions.length === 1)
      setField(fields.province, provinceOptions[0].value);
  }, [provinceOptions, selectedProvince, setField, fields]);

  useEffect(() => {
    if (!selectedAmphoe && amphoeOptions.length === 1)
      setField(fields.amphoe, amphoeOptions[0].value);
  }, [amphoeOptions, selectedAmphoe, setField, fields]);

  useEffect(() => {
    if (!selectedDistrict && districtOptions.length === 1)
      setField(fields.district, districtOptions[0].value);
  }, [districtOptions, selectedDistrict, setField, fields]);

  const getStepStatus = (filled, loading) => {
    if (loading) return "loading";
    if (filled) return "done";
    return "pending";
  };

  const cascadeSteps = [
    { key: "zipcode",  label: fieldLabels.zipcode,  filled: !!selectedZipcode,  loading: loadingPostal },
    { key: "province", label: fieldLabels.province, filled: !!selectedProvince, loading: loadingProvinces },
    { key: "amphoe",   label: fieldLabels.amphoe,   filled: !!selectedAmphoe,   loading: loadingDistricts },
    { key: "district", label: fieldLabels.district, filled: !!selectedDistrict, loading: loadingSubdistricts },
  ];

  const statusIcon = isLoading ? (
    <LoadingOutlined className="ps-header-icon ps-loading" />
  ) : isComplete ? (
    <CheckCircleFilled className="ps-header-icon ps-complete" />
  ) : (
    <EnvironmentOutlined className="ps-header-icon ps-default" />
  );

  const cascadeBar = (
    <div className="ps-cascade-bar">
      {cascadeSteps.map((step, idx) => {
        const status = getStepStatus(step.filled, step.loading);
        return (
          <React.Fragment key={step.key}>
            {idx > 0 && (
              <ArrowRightOutlined
                className={`ps-cascade-arrow ${cascadeSteps[idx - 1].filled ? "active" : ""}`}
              />
            )}
            <Tag
              className={`ps-cascade-tag ps-cascade-${status}`}
              icon={
                status === "loading"
                  ? <LoadingOutlined spin />
                  : status === "done"
                    ? <CheckCircleFilled />
                    : null
              }
            >
              {step.label}
            </Tag>
          </React.Fragment>
        );
      })}
    </div>
  );

  const optionCount = (count, loading) => {
    if (loading) return null;
    if (count === 0) return null;
    return <div className="ps-count">{count} {t("general.items", { defaultValue: "รายการ" })}</div>;
  };

  return (
    <div className={`ps-wrapper${compact ? " ps-compact" : ""}`}>
      {showCard && (
        <div className="ps-card-header">
          {statusIcon}
          <span className="ps-card-title">
            {t("component.provinceSelector.title")}
          </span>
          {isComplete && (
            <Tag color="success" className="ps-badge">
              {t("component.provinceSelector.complete")}
            </Tag>
          )}
        </div>
      )}

      {cascadeBar}

      <Row gutter={rowGutter} className="ps-fields">
        <Col xs={24} sm={12} md={6}>
          <div className={`ps-field-wrap ${selectedZipcode ? "ps-filled" : ""}`}>
            <div className="ps-step-num">1</div>
            <CommonForm.Item
              name={makeNamePath(fields.zipcode)}
              normalize={(v) => v?.replaceAll(/\D/g, "").slice(0, 5)}
              className="ps-field-item"
              labelCol={{ span: 0 }}
              wrapperCol={{ span: 24 }}
              rules={isRequired ? [{ required: true, message: t("general.required", { defaultValue: "กรุณากรอก" }) }] : []}
            >
              <FloatingLabel
                size="large"
                label={fieldLabels.zipcode}
                disabled={disabled}
                maxLength={5}
                allowClear
                onClear={handleClearAll}
                onChange={handleZipcodeChange}
                suffix={loadingPostal ? <LoadingOutlined spin /> : null}
              />
            </CommonForm.Item>
          </div>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <div className={`ps-field-wrap ${selectedProvince ? "ps-filled" : ""} ${!selectedProvince && !selectedZipcode ? "ps-waiting" : ""}`}>
            <div className="ps-step-num">2</div>
            <CommonForm.Item
              name={makeNamePath(fields.province)}
              className="ps-field-item"
              labelCol={{ span: 0 }}
              wrapperCol={{ span: 24 }}
              rules={isRequired ? [{ required: true, message: t("general.required", { defaultValue: "กรุณาเลือก" }) }] : []}
            >
              <FloatingLabel
                type="select"
                showSearch
                size="large"
                label={fieldLabels.province}
                disabled={disabled || loadingProvinces}
                options={provinceOptions}
                allowClear
                loading={loadingProvinces}
                onChange={handleProvinceChange}
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </CommonForm.Item>
            {!selectedProvince && optionCount(provinceOptions.length, loadingProvinces)}
          </div>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <div className={`ps-field-wrap ${selectedAmphoe ? "ps-filled" : ""} ${!selectedProvince ? "ps-locked" : ""}`}>
            <div className="ps-step-num">3</div>
            <CommonForm.Item
              name={makeNamePath(fields.amphoe)}
              className="ps-field-item"
              labelCol={{ span: 0 }}
              wrapperCol={{ span: 24 }}
              rules={isRequired ? [{ required: true, message: t("general.required", { defaultValue: "กรุณาเลือก" }) }] : []}
            >
              <FloatingLabel
                type="select"
                showSearch
                size="large"
                label={fieldLabels.amphoe}
                disabled={disabled || !selectedProvince || loadingDistricts}
                options={amphoeOptions}
                allowClear
                loading={loadingDistricts}
                onChange={handleAmphoeChange}
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </CommonForm.Item>
            {selectedProvince && !selectedAmphoe && optionCount(amphoeOptions.length, loadingDistricts)}
          </div>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <div className={`ps-field-wrap ${selectedDistrict ? "ps-filled" : ""} ${!selectedAmphoe ? "ps-locked" : ""}`}>
            <div className="ps-step-num">4</div>
            <CommonForm.Item
              name={makeNamePath(fields.district)}
              className="ps-field-item"
              labelCol={{ span: 0 }}
              wrapperCol={{ span: 24 }}
              rules={isRequired ? [{ required: true, message: t("general.required", { defaultValue: "กรุณาเลือก" }) }] : []}
            >
              <FloatingLabel
                type="select"
                showSearch
                size="large"
                label={fieldLabels.district}
                disabled={disabled || !selectedAmphoe || loadingSubdistricts}
                options={districtOptions}
                allowClear
                loading={loadingSubdistricts}
                onChange={handleDistrictChange}
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </CommonForm.Item>
            {selectedAmphoe && !selectedDistrict && optionCount(districtOptions.length, loadingSubdistricts)}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ProvinceSelector;
