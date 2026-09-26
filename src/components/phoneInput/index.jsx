import React from "react";
import { Input, Select } from "antd";
import { useTranslation } from "react-i18next";
import CommonForm from "components/commonForm";
import FloatingLabel from "components/floatingLabel";
import {
  DEFAULT_PHONE_COUNTRY_CODE, fromSelectValue, phoneCountryOptions, phonePattern, toSelectValue,
} from "constants/phoneCountryCodes";

/**
 * A phone number with its dialling code, as two form fields: `<base>.<codeName>` (stored as
 * "+66") and `<base>.<numberName>`. The number rule follows the chosen code: Thai numbers stay
 * 0XXXXXXXXX, foreign ones are 6-15 digits.
 *
 * `variant="plain"` renders the registration-page look (antd Input/Select + classes);
 * `variant="floating"` uses the back-office FloatingLabel inputs.
 */
const PhoneInput = ({
  form,
  base = [],
  codeName = "phoneCountryCode",
  numberName = "phone",
  label,
  required = false,
  requiredMessage,
  invalidMessage,
  readOnly = false,
  variant = "plain",
  inputClassName = "",
  selectClassName = "",
  placeholder = "08x-xxx-xxxx",
  itemClassName = "",
  size,
}) => {
  const { t, i18n } = useTranslation();
  const codePath = [...base, codeName];
  const numberPath = [...base, numberName];
  const codeValue = CommonForm.useWatch(codePath, form) || DEFAULT_PHONE_COUNTRY_CODE;
  const options = phoneCountryOptions(i18n.language);

  const rules = [
    ...(required ? [{ required: true, message: requiredMessage || t("required.phone") }] : []),
    { pattern: phonePattern(codeValue), message: invalidMessage || t("validation.phone") },
  ];

  const filterOption = (input, option) =>
    String(option?.filterLabel || "").toLowerCase().includes(input.toLowerCase());

  if (variant === "floating") {
    return (
      <div className="flex gap-2 items-start">
        <div className="w-[130px] shrink-0">
          <CommonForm.Item
            name={codePath}
            className={itemClassName}
            getValueProps={(v) => ({ value: toSelectValue(v) })}
            normalize={(v) => fromSelectValue(v)}
          >
            <FloatingLabel
              type="select"
              size={size}
              label={t("general.countryCode")}
              options={options}
              disabled={readOnly}
              showSearch
              allowClear={false}
              filterOption={filterOption}
              optionLabelProp="label"
            />
          </CommonForm.Item>
        </div>
        <div className="flex-1 min-w-0">
          <CommonForm.Item name={numberPath} className={itemClassName} rules={rules}
            dependencies={[codePath]}>
            <FloatingLabel size={size} label={label} required={required} readOnly={readOnly} maxLength={15} />
          </CommonForm.Item>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-start">
      <CommonForm.Item
        name={codePath}
        className={`${itemClassName} w-[128px] shrink-0`}
        getValueProps={(v) => ({ value: toSelectValue(v) })}
        normalize={(v) => fromSelectValue(v)}
      >
        <Select
          className={selectClassName}
          options={options}
          disabled={readOnly}
          showSearch
          filterOption={filterOption}
          optionLabelProp="label"
          getPopupContainer={(n) => n.parentNode}
          popupMatchSelectWidth={260}
        />
      </CommonForm.Item>
      <CommonForm.Item name={numberPath} className={`${itemClassName} flex-1 min-w-0`} rules={rules}
        dependencies={[codePath]}>
        <Input className={inputClassName} placeholder={placeholder} allowClear readOnly={readOnly} maxLength={15}
          inputMode="tel" />
      </CommonForm.Item>
    </div>
  );
};

export default PhoneInput;
