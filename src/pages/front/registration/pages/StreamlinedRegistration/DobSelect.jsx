import React, { useEffect, useMemo, useRef, useState } from "react";
import { Select } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

/**
 * Day / Month / Year selector that emits a dayjs value (always Gregorian/ค.ศ.),
 * matching the three-column date-of-birth control in the design.
 *
 * Internal state holds the three parts independently so a partial selection is
 * preserved while the user is still choosing — only once all three are picked do
 * we emit a date. A ref tracks the last value we emitted so external changes
 * (self-prefill, friend-reset) re-sync the dropdowns without clobbering an
 * in-progress selection.
 */
const DobSelect = ({ value, onChange }) => {
  const { t, i18n } = useTranslation();
  const isTh = i18n.language?.toLowerCase() === "th";
  const d = value && dayjs.isDayjs(value) ? value : value ? dayjs(value) : null;

  const [day, setDay] = useState(d ? d.date() : undefined);
  const [month, setMonth] = useState(d ? d.month() : undefined);
  const [year, setYear] = useState(d ? d.year() : undefined);
  const lastEmit = useRef(d ? d.format("YYYY-MM-DD") : null);

  useEffect(() => {
    const incoming = d ? d.format("YYYY-MM-DD") : null;
    if (incoming !== lastEmit.current) {
      setDay(d ? d.date() : undefined);
      setMonth(d ? d.month() : undefined);
      setYear(d ? d.year() : undefined);
      lastEmit.current = incoming;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commit = (dd, mm, yy) => {
    let out;
    if (dd == null || mm == null || yy == null) {
      out = undefined;
    } else {
      const base = dayjs().year(yy).month(mm).date(1);
      out = base.date(Math.min(dd, base.daysInMonth())).startOf("day");
    }
    lastEmit.current = out ? out.format("YYYY-MM-DD") : null;
    onChange?.(out);
  };

  const dayOptions = useMemo(
    () => Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: i + 1 })),
    []
  );
  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: dayjs().month(i).locale(isTh ? "th" : "en").format("MMMM"),
    })),
    [isTh]
  );
  const yearOptions = useMemo(() => {
    const thisYear = dayjs().year();
    // Always show/store the Gregorian year (ค.ศ.) as requested.
    return Array.from({ length: 100 }, (_, i) => {
      const y = thisYear - i;
      return { value: y, label: y };
    });
  }, []);

  const cls =
    "w-full [&_.ant-select-selector]:!h-12 [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-[#bfc7d2] [&_.ant-select-selector]:!items-center";

  return (
    <div className="grid grid-cols-3 gap-2">
      <Select className={cls} placeholder={t("time.day")} value={day} options={dayOptions}
        onChange={(v) => { setDay(v); commit(v, month, year); }}
        getPopupContainer={(n) => n.parentNode} />
      <Select className={cls} placeholder={t("time.month")} value={month} options={monthOptions}
        onChange={(v) => { setMonth(v); commit(day, v, year); }}
        getPopupContainer={(n) => n.parentNode} />
      <Select className={cls} showSearch placeholder={isTh ? "ปี (ค.ศ.)" : t("time.year")}
        value={year} options={yearOptions} optionFilterProp="label"
        onChange={(v) => { setYear(v); commit(day, month, v); }}
        getPopupContainer={(n) => n.parentNode} />
    </div>
  );
};

export default DobSelect;
