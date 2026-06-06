import { useEffect, useMemo, useState } from "react";
import CommonForm from "components/commonForm";
import masterService from "services/master.services";
import _ from "lodash";

const norm = (v) => (v == null ? null : String(v).trim());

const useZipcodeAutoComplete = (form, basePath = [], fieldNames = {}) => {
  const {
    province = "province",
    amphoe = "amphoe",
    district = "district",
    zipcode = "zipcode",
  } = fieldNames;

  const { data: rawData, isFetching } = masterService.useQueryGetAllProvince();

  const makePath = (field) => [...basePath, field];

  const zipInForm = CommonForm.useWatch(makePath(zipcode), form);
  const provinceInForm = CommonForm.useWatch(makePath(province), form);
  const amphoeInForm = CommonForm.useWatch(makePath(amphoe), form);
  const districtInForm = CommonForm.useWatch(makePath(district), form);

  const selectedZipcode = norm(zipInForm);
  const selectedProvince = norm(provinceInForm);
  const selectedAmphoe = norm(amphoeInForm);
  const selectedDistrict = norm(districtInForm);

  const [provinceOption, setProvinceOption] = useState([]);
  const [amphoeOption, setAmphoeOption] = useState([]);
  const [districtOption, setDistrictOption] = useState([]);
  const [zipCodeOption, setZipCodeOption] = useState([]);

  const setFormValue = (field, value) => {
    const path = makePath(field);
    const current = form?.getFieldValue?.(path);
    if (!_.isEqual(current, value)) {
      form?.setFieldValue?.(path, value);
    }
  };

  useEffect(() => {
    if (!rawData?.length) return;

    const zipcodes = _
      .chain(rawData)
      .map((r) => norm(r.zipcode))
      .filter((z) => z)
      .uniq()
      .map((z) => ({ label: z, value: z }))
      .sort((a, b) => Number(a.value) - Number(b.value))
      .value();

    setZipCodeOption(zipcodes);
  }, [rawData]);

  const matchedByZip = useMemo(() => {
    if (!rawData?.length || !selectedZipcode) return [];
    return rawData.filter((r) => norm(r.zipcode) === selectedZipcode);
  }, [rawData, selectedZipcode]);

  useEffect(() => {
    if (!rawData?.length) return;

    if (!selectedZipcode) {
      const provincesAll = _
        .chain(rawData)
        .map((r) => norm(r.province))
        .filter(Boolean)
        .uniq()
        .map((p) => ({ label: p, value: p }))
        .value();

      setProvinceOption(provincesAll);
      setAmphoeOption([]);
      setDistrictOption([]);

      if (provinceInForm != null) setFormValue(province, null);
      if (amphoeInForm != null) setFormValue(amphoe, null);
      if (districtInForm != null) setFormValue(district, null);
      return;
    }

    if (matchedByZip.length === 0) {
      setProvinceOption([]);
      setAmphoeOption([]);
      setDistrictOption([]);
      if (provinceInForm != null) setFormValue(province, null);
      if (amphoeInForm != null) setFormValue(amphoe, null);
      if (districtInForm != null) setFormValue(district, null);
      return;
    }

    const provinces = _
      .chain(matchedByZip)
      .map((r) => norm(r.province))
      .filter(Boolean)
      .uniq()
      .map((p) => ({ label: p, value: p }))
      .value();

    setProvinceOption(provinces);

    const provinceValid =
      selectedProvince && provinces.some((p) => p.value === selectedProvince);

    const provinceToUse = provinceValid ? selectedProvince : provinces[0]?.value || null;

    if (!provinceValid) setFormValue(province, provinceToUse);

    const amphoes = _
      .chain(matchedByZip)
      .filter((r) => norm(r.province) === provinceToUse)
      .map((r) => norm(r.amphoe))
      .filter(Boolean)
      .uniq()
      .map((a) => ({ label: a, value: a }))
      .value();

    setAmphoeOption(amphoes);

    const amphoeValid =
      selectedAmphoe && amphoes.some((a) => a.value === selectedAmphoe);

    const amphoeToUse = amphoeValid ? selectedAmphoe : amphoes[0]?.value || null;

    if (!amphoeValid) setFormValue(amphoe, amphoeToUse);

    const districts = _
      .chain(matchedByZip)
      .filter(
        (r) =>
          norm(r.province) === provinceToUse &&
          norm(r.amphoe) === amphoeToUse
      )
      .map((r) => norm(r.district))
      .filter(Boolean)
      .uniq()
      .map((d) => ({ label: d, value: d }))
      .value();

    setDistrictOption(districts);

    const districtValid =
      selectedDistrict && districts.some((d) => d.value === selectedDistrict);

    const districtToUse = districtValid ? selectedDistrict : districts[0]?.value || null;

    if (!districtValid) setFormValue(district, districtToUse);
  }, [
    rawData,
    selectedZipcode,
    selectedProvince,
    selectedAmphoe,
    selectedDistrict,
    matchedByZip,
    zipInForm,
    provinceInForm,
    amphoeInForm,
    districtInForm,
  ]);

  return {
    isLoading: isFetching,

    provinceOption,
    amphoeOption,
    districtOption,
    zipCodeOption,

    selectedProvince,
    selectedAmphoe,
    selectedDistrict,
    selectedZipcode,

    makePath,

    setSelectedZipcode: (v) => setFormValue(zipcode, norm(v)),
    setSelectedProvince: (v) => setFormValue(province, norm(v)),
    setSelectedAmphoe: (v) => setFormValue(amphoe, norm(v)),
    setSelectedDistrict: (v) => setFormValue(district, norm(v)),
  };
};

export default useZipcodeAutoComplete;

