import React, { useState, forwardRef, useId, useRef } from "react";
import { Input, DatePicker, Select, InputNumber, Switch, Radio, ColorPicker, Tooltip, AutoComplete } from "antd";
import dayjs from "dayjs";
import "./floatingLabel.css";
import { useTranslation } from "react-i18next";
import { SYS_DATE_FORMAT, SYS_DATE_TIME_FORMAT } from "constants/helper";
import Tiptap from "components/tiptap";
import DateSelect from "components/dateSelect";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const FloatingLabel = forwardRef((props, ref) => {
  const inputId = useId();
  const labelRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const { t, i18n } = useTranslation();
  const [focus, setFocus] = useState(false);
  const {
    label,
    value,
    placeholder,
    type,
    required,
    onChange,
    onSelect,
    onBlur,
    onFocus,
    readOnly,
    allowClear,
    options = [],
    maxLength = 255,
    style,
    ...rest
  } = props;

  const isThai = i18n.language?.toLowerCase() === "th";

  const isDatePicker = type === "date";
  const isSelect = type === "select";
  const isTextArea = type === "textarea";
  const isNumber = type === "number";
  const isSwitch = type === "switch";
  const isRange = type === "range";
  const isTiptap = type === "tiptap";
  const isRadio = type === "radio";
  const isDateSelect = type === "dateselect";
  const isColor = type === "color";
  const isAutoComplete = type === "autocomplete";

  const isOccupied =
    isRadio ||
    isDateSelect ||
    focus ||
    ((value === 0 || value === false || !!value) &&
      (isDatePicker
        ? dayjs.isDayjs(value)
        : Array.isArray(value)
          ? value.length > 0
          : true)) || isTiptap;

  const labelClass = isOccupied ? "label as-label" : "label as-placeholder";
  const requiredMark = required ? <span className="text-red-500">*</span> : null;

  const handleFocus = (e) => {
    setFocus(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setFocus(false);
    onBlur?.(e);
  };

  const checkTruncation = () => {
    if (labelRef.current) {
      const { scrollWidth, clientWidth } = labelRef.current;
      setIsTruncated(scrollWidth > clientWidth);
    }
  };

  return (
    <Tooltip
      title={isTruncated ? (!isSwitch && (isOccupied ? label : placeholder || label)) : ""}
      trigger="hover"
      placement="topLeft"
    >
      <div className="float-label" onMouseEnter={checkTruncation}>
        {isDateSelect ? (
          <DateSelect
            id={inputId}
            key={isThai ? 'th' : 'en'}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={readOnly}
            {...rest}
          />
        ) : isDatePicker ? (
          <DatePicker
            id={inputId}
            key={isThai ? 'th' : 'en'}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            readOnly={readOnly}
            style={{ width: "100%", height: "40px" }}
            placeholder={label && !focus ? "" : placeholder}
            format={rest.showTime ? SYS_DATE_TIME_FORMAT : SYS_DATE_FORMAT}
            {...rest}
          />
        ) : isRange ? (
          <RangePicker
            id={inputId}
            key={isThai ? 'th' : 'en'}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            readOnly={readOnly}
            style={{ width: "100%", height: "40px" }}
            placeholder={label && !focus ? ["", ""] : [placeholder, placeholder]}
            {...rest}
          />
        ) : isSelect ? (
          <Select
            id={inputId}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            allowClear={allowClear}
            options={options?.map(({ label, ...rest }) => {
              if (typeof label === "string") {
                return { ...rest, label: t(label, { defaultValue: label }) }
              } else {
                return { ...rest, label }
              }
            })}
            placeholder={label && placeholder ? null : placeholder}
            className="w-full float-input"
            {...rest}
          />
        ) : isRadio ? (
          <Radio.Group
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="float-input radio-align-center"
            {...rest}
          >
            {options?.map(({ label, value }) => (
              <Radio.Button key={value} value={value}>
                {t(label, { defaultValue: label })}
              </Radio.Button>
            ))}
          </Radio.Group>
        ) : isTextArea ? (
          <TextArea
            id={inputId}
            ref={ref}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            readOnly={readOnly}
            className="float-input"
            placeholder={label && placeholder ? null : placeholder}
            {...rest}
          />
        ) : isNumber ? (
          <InputNumber
            id={inputId}
            ref={ref}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            readOnly={readOnly}
            className="float-input"
            placeholder={label && placeholder ? null : placeholder}
            style={{ width: "100%" }}
            {...rest}
          />
        ) : isSwitch ? (
          <div className="flex items-center gap-2 pt-2">
            <Switch
              checked={!!value}
              onChange={onChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={readOnly}
              {...rest}
            />
            <label className="text-sm text-gray-700">
              {requiredMark} {label}
            </label>
          </div>
        ) : type === "password" ? (
          <Input.Password
            id={inputId}
            ref={ref}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            readOnly={readOnly}
            className="float-input"
            placeholder={label && placeholder ? null : placeholder}
            {...rest}
          />
        ) : isTiptap ? (
          <div onFocus={handleFocus} onBlur={handleBlur}>
            <Tiptap value={value} onChange={onChange} {...rest} />
          </div>
        ) : isColor ? (
          <ColorPicker
            id={inputId}
            ref={ref}
            value={value}
            onChange={(color) => {
              onChange(color?.toHexString())
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            readOnly={readOnly}
            className="float-color"
            placeholder={label && placeholder ? null : placeholder}
            {...rest}
          />
        ) : isAutoComplete ? (
          <AutoComplete
            id={inputId}
            value={value}
            options={options?.map((o) => ({
              ...o,
              label: typeof o.label === "string" ? t(o.label, { defaultValue: o.label }) : o.label,
            }))}
            onChange={(val) => onChange?.(val)}
            onSelect={(val) => {
              onSelect?.(val);
              onChange?.(val);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            allowClear={allowClear}
            {...rest}
          >
            <Input
              className="float-input"
              placeholder={label && placeholder ? null : placeholder}
              readOnly={readOnly}
            />
          </AutoComplete>
        ) : (
          <Input
            id={inputId}
            ref={ref}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            readOnly={readOnly}
            allowClear={allowClear}
            className="float-input"
            style={style}
            type={type}
            maxLength={maxLength}
            placeholder={label && placeholder ? null : placeholder}
            {...rest}
          />
        )}
        {!isSwitch && (
          <label
            htmlFor={inputId}
            className={labelClass}
            ref={labelRef}
          >
            {requiredMark} {isOccupied ? label : placeholder || label}
          </label>
        )}
      </div>
    </Tooltip>
  );
});

FloatingLabel.displayName = "FloatingLabel";

export default FloatingLabel;