import React from "react";
import { Link } from "react-router-dom";
import { Button, Tooltip } from "antd";
import { EnvironmentFilled, RightOutlined, StarFilled, StarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { TypeIcon } from "components/eventCard/typeIcons";
import { typeTagClass } from "./typeStyle";

const STATUS_STYLE = {
  openRegistration: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  soon: { cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  closedRegistration: { cls: "bg-slate-50 text-slate-500 border-slate-200", dot: "bg-slate-400" },
};

/**
 * One race row on /eventCalendar. `event` is either an ACTION event (internal: link to
 * /eventDetail) or an approved calendar entry (external: opens its own link in a new tab).
 * Admins get a star to mark a calendar entry as Major.
 */
const EventListCard = ({ event, internal, isAdmin, onToggleMajor, majorLoading }) => {
  const { t, i18n } = useTranslation();
  if (!event) return null;

  const lang = i18n.language?.toLowerCase();
  const date = dayjs(event.eventDate);
  const name = internal ? event.name : event.eventName;
  const type = internal ? event.type : event.eventType;
  const provinceLabel = event.province ? (lang === "th" ? event.province.stateLocal : event.province.stateEn) : "";
  const location = internal ? event.location || provinceLabel : event.location;
  const status = internal ? STATUS_STYLE[event.eventStatus] : null;

  const cta = (
    <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-50 group-hover:bg-blue-50 text-blue-600 font-semibold text-xs rounded-xl border border-slate-200 group-hover:border-blue-200 transition whitespace-nowrap">
      {t("front.event.viewAndRegister")}
      <RightOutlined className="text-[10px]" />
    </span>
  );

  const body = (
    <div className="flex flex-row items-center gap-3 sm:gap-4">
      <div className="w-[76px] sm:w-28 bg-blue-50/80 border border-blue-100 rounded-xl p-2.5 sm:p-3 text-center shrink-0 flex flex-col justify-center items-center self-start sm:self-center">
        <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 leading-none">{date.format("DD")}</span>
        <span className="text-[11px] sm:text-xs font-semibold text-blue-800 mt-1">{date.locale(lang).format("MMM YYYY")}</span>
      </div>

      <div className="flex-grow min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          {event.isMajor && (
            <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-400 text-slate-950 rounded-md tracking-wider">
              MAJOR
            </span>
          )}
          {type && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-md border ${typeTagClass(type)}`}>
              <TypeIcon type={type} className="w-3 h-3 shrink-0" />
              {type}
            </span>
          )}
          {status && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border ${status.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {t(`general.${event.eventStatus}`)}
            </span>
          )}
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-2 m-0">
          {name}
        </h3>
        {location && (
          <p className="text-xs text-slate-600 flex items-start gap-1.5 m-0">
            <EnvironmentFilled className="text-slate-400 mt-0.5" />
            <span className="min-w-0">
              <strong>{t("front.event.location")}:</strong> {location}
            </span>
          </p>
        )}
        {!internal && event.source && (
          <p className="text-[11px] text-slate-400 m-0">
            {t("back.eventCalendarList.sourceCredit")}: {event.source}
          </p>
        )}
      </div>

      <div className="hidden sm:block shrink-0">{cta}</div>
    </div>
  );

  const cardCls =
    "group block bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-200 transition";

  return (
    <div className="relative">
      {internal ? (
        <Link to={`/eventDetail/${event.link || event.id}`} className={cardCls}>
          {body}
          <div className="sm:hidden mt-3 pt-3 border-t border-slate-100 flex justify-end">{cta}</div>
        </Link>
      ) : (
        <a href={event.link || event.sourceUrl} target="_blank" rel="noopener noreferrer" className={cardCls}>
          {body}
          <div className="sm:hidden mt-3 pt-3 border-t border-slate-100 flex justify-end">{cta}</div>
        </a>
      )}
      {isAdmin && !internal && (
        <Tooltip title={event.isMajor ? t("back.eventCalendarList.unsetMajor") : t("back.eventCalendarList.setMajor")}>
          <Button
            size="small"
            shape="circle"
            className="!absolute top-2 right-2 !shadow-none"
            loading={majorLoading}
            icon={event.isMajor ? <StarFilled className="!text-amber-500" /> : <StarOutlined className="!text-slate-400" />}
            onClick={() => onToggleMajor?.(event)}
          />
        </Tooltip>
      )}
    </div>
  );
};

export default EventListCard;
