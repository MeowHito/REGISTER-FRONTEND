import React, { useEffect, useState } from "react";
import { Select } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { toStartOfDay } from "utils/format";

const { Option } = Select;

const DateSelect = ({
  id,
  value,
  onChange,
  disabled,
  style,
  className,
  ...rest
}) => {
  const { t } = useTranslation();
  const currentYear = dayjs().year();

  const parseValue = (val) => {
    if (!val) return null;
    const d = dayjs(val);
    return d.isValid() ? d : null;
  };

  const initDate = parseValue(value);
  const [day, setDay] = useState(initDate?.date() || null);
  const [month, setMonth] = useState(initDate?.month() + 1 || null);
  const [year, setYear] = useState(initDate?.year() || null);

  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const monthKeys = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec"
  ];

  const months = monthKeys.map((key, index) => ({
    value: index + 1,
    label: t(`month.${key}`)
  }));
  const daysInMonth = month && year ? dayjs(`${year}-${String(month).padStart(2, '0')}-01`).daysInMonth() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    const dateObj = parseValue(value);
    if (dateObj) {
      setDay(dateObj.date());
      setMonth(dateObj.month() + 1);
      setYear(dateObj.year());
    } else {
      setDay(null);
      setMonth(null);
      setYear(null);
    }
  }, [value]);

  useEffect(() => {
    if (day != null && month != null && year != null) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const date = toStartOfDay(dateStr);
      if (date.isValid()) {
        onChange?.(date);
      } else {
        onChange?.(null);
      }
    } else {
      onChange?.(null);
    }
  }, [day, month, year]);

  const commonProps = {
    disabled,
    ...rest,
    style: { width: "100%" },
  };

  const containerClass = className ?? "grid grid-cols-3 gap-2";

  return (
    <div className={containerClass} style={style} >
      <Select
        {...commonProps}
        id={id ? `${id}_day` : undefined}
        placeholder={t("back.setting.profile.day")}
        value={day}
        onChange={setDay}
        disabled={disabled}
      >
        {days.map((d) => (
          <Option key={`date-${d}`} value={d}>
            {String(d).padStart(2, "0")}
          </Option>
        ))}
      </Select>

      <Select
        {...commonProps}
        id={id ? `${id}_month` : undefined}
        placeholder={t("back.setting.profile.month")}
        value={month}
        onChange={setMonth}
        disabled={disabled}
      >
        {months.map(({ value, label }) => (
          <Option key={`month-${value}`} value={value}>
            {label}
          </Option>
        ))}
      </Select>

      <Select
        {...commonProps}
        id={id ? `${id}_year` : undefined}
        placeholder={t("back.setting.profile.year")}
        value={year}
        onChange={setYear}
        disabled={disabled}
      >
        {years.map((y) => (
          <Option key={`year-${y}`} value={y}>
            {y}
          </Option>
        ))}
      </Select>
    </div>
  );
};

export default DateSelect;
