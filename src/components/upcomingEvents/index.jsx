import { Empty, Skeleton } from "antd";
import { ArrowRightOutlined, CalendarOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { NOT_FOUND_IMG } from "assets";
import { SYS_DISPLAY_DATE_FORMAT } from "constants/helper";
import { EMPTY_DESCRIPTION } from "constants/emptyDescription";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import generalService from "services/general.services";
import { usePublicImageUrl } from "utils/fileUtils";

const PREVIEW_SIZE = 10;

function UpcomingEventCard({ id, link, logoUrl, province, name, eventDate, eventStatus }) {
  const { t, i18n } = useTranslation();
  const { data: logoPreviewUrl, isFetching } = usePublicImageUrl({ key: logoUrl, prefix: "event", isPublic: true });
  const currentLanguage = i18n.language?.toLowerCase();

  const provinceLabel = province
    ? currentLanguage === "th"
      ? province.stateLocal
      : province.stateEn
    : "";

  const statusText =
    eventStatus === "soon"
      ? t("general.soon")
      : eventStatus === "openRegistration"
        ? t("general.openRegistration")
        : eventStatus === "closedRegistration"
          ? t("general.closedRegistration")
          : "";

  const statusColor =
    eventStatus === "soon"
      ? "text-brand"
      : eventStatus === "openRegistration"
        ? "text-success"
        : "text-red-400";

  return (
    <Link
      to={`/eventDetail/${link || id}`}
      className="group snap-start shrink-0 w-[260px] sm:w-[300px] md:w-[340px] bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        {isFetching ? (
          <Skeleton.Image active className="!w-full !h-full" />
        ) : (
          <img
            src={logoPreviewUrl || NOT_FOUND_IMG}
            alt={name}
            onError={(e) => { e.currentTarget.src = NOT_FOUND_IMG; }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        {provinceLabel && (
          <span className="absolute top-3 left-3 bg-brand text-white text-[11px] font-semibold tracking-wide uppercase px-3 py-1 rounded-full shadow-sm">
            {provinceLabel}
          </span>
        )}
      </div>

      <div className="p-4 md:p-5 flex flex-col flex-1">
        <h3 className="text-sm md:text-base font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.6em]">
          {name}
        </h3>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100 mt-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs md:text-sm">
            <CalendarOutlined className="text-brand" />
            <span>{dayjs(eventDate).format(SYS_DISPLAY_DATE_FORMAT)}</span>
          </div>
          {statusText && (
            <span className={`text-[11px] md:text-xs font-semibold whitespace-nowrap ${statusColor}`}>
              {statusText}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function UpcomingEvents() {
  const { t } = useTranslation();
  const scrollRef = useRef(null);

  const paging = useMemo(
    () => ({ size: PREVIEW_SIZE, page: 0, search: [] }),
    []
  );

  const { data: events, isFetching, refetch } = generalService.useQueryGetAllEvents({
    paging,
    queryKey: ["getUpcomingEvents", paging],
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  const items = events?.content || [];

  const scrollBy = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.8, 300);
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="bg-white py-10 md:py-16">
      <div className="container md:max-w-screen-xl mx-auto px-4">
        {/* Section header */}
        <div className="flex items-end justify-between gap-4 mb-6 md:mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              {t("front.home.upcomingEvents")}
            </h2>
            <div className="h-1 w-16 md:w-20 bg-brand rounded-full mt-2" />
            <p className="hidden md:block text-gray-500 mt-3 text-base">
              {t("front.home.upcomingEventsDesc")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop scroll controls */}
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                aria-label="scroll left"
                onClick={() => scrollBy("left")}
                className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 hover:border-brand hover:text-brand transition-colors flex items-center justify-center active:scale-95"
              >
                <LeftOutlined />
              </button>
              <button
                type="button"
                aria-label="scroll right"
                onClick={() => scrollBy("right")}
                className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 hover:border-brand hover:text-brand transition-colors flex items-center justify-center active:scale-95"
              >
                <RightOutlined />
              </button>
            </div>
            <Link
              to="/event"
              className="text-brand font-semibold text-sm md:text-base flex items-center gap-1 hover:underline whitespace-nowrap"
            >
              {t("front.home.viewAllEvents")}
              <ArrowRightOutlined />
            </Link>
          </div>
        </div>

        {/* Cards */}
        {isFetching && items.length === 0 ? (
          <div className="flex gap-5 overflow-hidden">
            {[...Array(3)].map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="shrink-0 w-[260px] sm:w-[300px] md:w-[340px] bg-white rounded-2xl border border-gray-100 p-4"
              >
                <Skeleton.Image active className="!w-full !h-40 !rounded-xl" />
                <Skeleton active paragraph={{ rows: 2 }} className="mt-3" />
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
          >
            {items.map((data, index) => (
              <UpcomingEventCard key={`upcoming-${data.id || index}`} {...data} />
            ))}
            {/* Trailing CTA card */}
            <Link
              to="/event"
              className="snap-start shrink-0 w-[160px] md:w-[200px] rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-brand hover:text-brand transition-colors flex flex-col items-center justify-center gap-2 font-semibold"
            >
              <ArrowRightOutlined className="text-xl" />
              <span className="text-sm text-center px-3">{t("front.home.viewAllEvents")}</span>
            </Link>
          </div>
        ) : (
          <div className="w-full flex justify-center p-8">
            <Empty description={EMPTY_DESCRIPTION} />
          </div>
        )}
      </div>
    </section>
  );
}
