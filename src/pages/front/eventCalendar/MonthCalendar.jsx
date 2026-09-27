import React, { useMemo } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { SYS_ISO_DATE_FORMAT } from "constants/helper";

/**
 * Month grid for /eventCalendar. Picking a day selects its whole week (Sun–Sat); `eventDateSet`
 * holds the YYYY-MM-DD days that get a dot.
 */
const MonthCalendar = ({ viewMonth, onViewMonthChange, selectedDate, onSelectDate, eventDateSet, monthMode }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => dayjs().day(i).locale(lang).format("dd")),
    [lang]
  );

  const days = useMemo(() => {
    const first = viewMonth.startOf("month").startOf("week");
    const last = viewMonth.endOf("month").endOf("week");
    const list = [];
    for (let d = first; !d.isAfter(last, "day"); d = d.add(1, "day")) list.push(d);
    return list;
  }, [viewMonth]);

  const weekStart = selectedDate.startOf("week");
  const weekEnd = selectedDate.endOf("week");
  const today = dayjs();

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/90 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold text-slate-900 text-base truncate">{t("front.event.calendarTitle")}</span>
          <span className="px-2 py-0.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full whitespace-nowrap">
            {viewMonth.locale(lang).format("MMM YYYY")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={t("front.event.prevMonth")}
            onClick={() => onViewMonthChange(viewMonth.subtract(1, "month"))}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer"
          >
            <LeftOutlined className="text-xs" />
          </button>
          <button
            type="button"
            aria-label={t("front.event.nextMonth")}
            onClick={() => onViewMonthChange(viewMonth.add(1, "month"))}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition cursor-pointer"
          >
            <RightOutlined className="text-xs" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-400 mb-2">
        {weekDays.map((d, i) => (
          <span
            key={d}
            className={i === 0 ? "text-rose-500 font-semibold" : i === 6 ? "text-blue-600 font-semibold" : ""}
          >
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
        {days.map((d) => {
          const inMonth = d.month() === viewMonth.month();
          const isSelected = !monthMode && d.isSame(selectedDate, "day");
          const inWeek = !monthMode && !isSelected && !d.isBefore(weekStart, "day") && !d.isAfter(weekEnd, "day");
          const hasEvent = eventDateSet.has(d.format(SYS_ISO_DATE_FORMAT));
          const isToday = d.isSame(today, "day");

          let cls = "text-slate-700 hover:bg-slate-100";
          if (!inMonth) cls = "text-slate-300 hover:bg-slate-50";
          if (inWeek) cls = "bg-blue-50 text-blue-800 font-semibold hover:bg-blue-100";
          if (isSelected) cls = "bg-blue-600 text-white font-bold shadow-sm ring-2 ring-blue-300 ring-offset-1";

          return (
            <button
              type="button"
              key={d.format(SYS_ISO_DATE_FORMAT)}
              onClick={() => onSelectDate(d)}
              className={`relative py-2 rounded-lg transition cursor-pointer border-0 ${cls} ${
                isToday && !isSelected ? "underline underline-offset-4 decoration-blue-400" : ""
              }`}
            >
              {d.date()}
              {hasEvent && (
                <span
                  className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                    isSelected ? "bg-white" : inMonth ? "bg-blue-500" : "bg-slate-300"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
          {t("front.event.hasEvent")}
        </span>
        <button
          type="button"
          onClick={() => onSelectDate(dayjs())}
          className="font-medium text-blue-600 hover:underline bg-transparent border-0 cursor-pointer p-0"
        >
          {t("front.event.backToToday")}
        </button>
      </div>
    </div>
  );
};

export default MonthCalendar;
