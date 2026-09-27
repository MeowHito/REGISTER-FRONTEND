import React, { useEffect, useState } from "react";
import { Button } from "antd";
import { ArrowRightOutlined, CalendarFilled, EnvironmentFilled, LeftOutlined, RightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { SYS_DISPLAY_DATE_FORMAT } from "constants/helper";

/**
 * Dark/gold banner for admin-picked Major races, nearest first. Several Majors can be flipped
 * through with the arrows / dots; nothing renders when there is none.
 */
const MajorBanner = ({ events = [], isAdmin, onUnsetMajor, unsetLoading }) => {
  const { t, i18n } = useTranslation();
  const [index, setIndex] = useState(0);
  const count = events.length;

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (!count) return null;
  const event = events[Math.min(index, count - 1)];
  const lang = i18n.language?.toLowerCase();
  const go = (step) => setIndex((i) => (i + step + count) % count);

  return (
    <article className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-950 via-slate-900 to-black text-white p-5 sm:p-6 md:p-7 shadow-lg border border-slate-800">
      <div className="absolute -right-12 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6">
        <div className="space-y-3 min-w-0 md:max-w-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-amber-400 text-slate-950 font-bold px-2.5 py-0.5 rounded-md text-xs tracking-wider uppercase">
              {t("front.event.majorBadge")}
            </span>
            {event.eventType && (
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-slate-200 border border-white/20 text-xs px-2.5 py-0.5 rounded-md font-medium">
                {event.eventType}
              </span>
            )}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-amber-400 tracking-tight leading-tight m-0 break-words">
            {event.eventName}
          </h2>
          <div className="flex flex-wrap items-center text-slate-300 text-xs sm:text-sm gap-x-4 gap-y-1.5 pt-1">
            <span className="flex items-center gap-1.5">
              <CalendarFilled className="text-amber-400" />
              {dayjs(event.eventDate).locale(lang).format(SYS_DISPLAY_DATE_FORMAT)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5 min-w-0">
                <EnvironmentFilled className="text-amber-400" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-stretch md:items-end gap-3 shrink-0">
          {(event.link || event.sourceUrl) && (
            <a
              href={event.link || event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 !bg-amber-400 hover:!bg-amber-300 !text-slate-950 font-bold text-sm rounded-xl transition shadow-md hover:shadow-lg"
            >
              {t("front.event.viewDetail")}
              <ArrowRightOutlined className="text-xs" />
            </a>
          )}
          {isAdmin && (
            <Button
              size="small"
              ghost
              loading={unsetLoading}
              onClick={() => onUnsetMajor?.(event)}
              className="!border-white/30 !text-slate-300 hover:!text-white"
            >
              {t("back.eventCalendarList.unsetMajor")}
            </Button>
          )}
        </div>
      </div>

      {count > 1 && (
        <div className="relative z-10 mt-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {events.map((e, i) => (
              <button
                type="button"
                key={e.eventId}
                aria-label={e.eventName}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full border-0 cursor-pointer transition-all ${
                  i === index ? "w-6 bg-amber-400" : "w-1.5 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={t("front.event.prevMajor")}
              onClick={() => go(-1)}
              className="w-8 h-8 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-slate-200 flex items-center justify-center cursor-pointer"
            >
              <LeftOutlined className="text-xs" />
            </button>
            <button
              type="button"
              aria-label={t("front.event.nextMajor")}
              onClick={() => go(1)}
              className="w-8 h-8 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-slate-200 flex items-center justify-center cursor-pointer"
            >
              <RightOutlined className="text-xs" />
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

export default MajorBanner;
