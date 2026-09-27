import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button, DatePicker, Input, Pagination, Select, Skeleton, Tooltip, App } from "antd";
import {
  PlusOutlined,
  CloudDownloadOutlined,
  StopOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import Cookies from "js-cookie";
import UseModalHook from "hooks/useModalHook";
import FrontLayout from "components/frontLayout";
import EventCalendarForm from "pages/backOffice/eventCalendar/eventCalendarForm";
import ImportSyncModal from "pages/backOffice/eventCalendar/importSyncModal";
import generalService from "services/general.services";
import backOfficeServices from "services/backoffice.services";
import useMe from "hooks/useMe";
import { AlertError } from "components/alert";
import { errorToMessage } from "hooks/functions/errorToMessage";
import thTH from "antd/es/date-picker/locale/th_TH";
import enUS from "antd/es/date-picker/locale/en_US";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { eventTypeOption } from "constants/options/eventTypeOption";
import useCountryStateHook from "hooks/useCountryStateHook";
import { SYS_ISO_DATE_FORMAT } from "constants/helper";
import MonthCalendar from "./MonthCalendar";
import MajorBanner from "./MajorBanner";
import EventListCard from "./EventListCard";
import { POPULAR_TYPES } from "./typeStyle";

const LIMIT = 20;

const EventCalendar = () => {
  const { t, i18n } = useTranslation();
  const { message } = App.useApp();
  const lang = i18n.language?.toLowerCase();
  const isThai = lang === "th";
  const listTopRef = useRef(null);

  // Calendar: a picked day selects its week; "month mode" lists the whole month shown in the grid.
  const [selectedDate, setSelectedDate] = useState(() => dayjs());
  const [viewMonth, setViewMonth] = useState(() => dayjs().startOf("month"));
  const [monthMode, setMonthMode] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [eventName, setEventName] = useState(null);
  const [provinceName, setProvinceName] = useState(null);
  const [eventType, setEventType] = useState(null);
  const [page, setPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { provinceOption, isLoadingProvince } = useCountryStateHook({ valueKey: "stateLocal" });
  const { open: openForm, handleOpen: handleOpenForm, handleClose: handleCloseForm } = UseModalHook();

  useEffect(() => {
    const cookieLang = Cookies.get("language")?.toLowerCase() ?? "th";
    i18n.changeLanguage(cookieLang);
  }, []);

  const range = monthMode
    ? [viewMonth.startOf("month"), viewMonth.endOf("month")]
    : [selectedDate.startOf("week"), selectedDate.endOf("week")];
  const dateFilter = {
    searchField: "eventDate",
    searchText: `${range[0].toISOString()},${range[1].toISOString()}`,
    searchType: "DATERANGE",
  };

  // The dates API works out the month from the instant it gets, so send mid-month to stay clear of time-zone edges.
  const { data: eventDates = [] } = generalService.useQueryGetEventDatesInMonth({
    date: viewMonth.date(15).startOf("day").toISOString(),
  });
  const eventDateSet = useMemo(
    () => new Set(eventDates.map((d) => dayjs(d).format(SYS_ISO_DATE_FORMAT))),
    [eventDates]
  );

  // page 0 makes getAllEvents return every match unpaged — a week/month of ACTION's own events is
  // short, so they are all listed on page 1 and only the calendar entries are paged.
  const internalPaging = {
    size: LIMIT,
    page: 0,
    search: [
      provinceName && { searchField: "province", searchText: provinceName },
      eventType && { searchField: "type", searchText: eventType },
      eventName && { searchField: "name", searchText: eventName },
      dateFilter,
    ].filter(Boolean),
  };
  const externalPaging = {
    size: LIMIT,
    page: page - 1,
    sortField: "eventDate",
    sortDirection: "ASC",
    search: [
      provinceName && { searchField: "location", searchText: provinceName },
      eventType && { searchField: "eventType", searchText: eventType },
      eventName && { searchField: "eventName", searchText: eventName },
      dateFilter,
    ].filter(Boolean),
  };

  const {
    data: eventData,
    isFetching: isLoadingEvents,
    refetch: refetchEventData,
  } = generalService.useQueryGetAllEvents({ paging: internalPaging });
  const {
    data: externalData,
    isFetching: isLoadingExternal,
    refetch: refetchExternalData,
  } = generalService.useQueryGetExternalEventCalendar({ paging: externalPaging });

  // Both list queries are manual (enabled: false); fetch whenever the filters change.
  const pagingKey = JSON.stringify([internalPaging, externalPaging]);
  useEffect(() => {
    refetchEventData();
    refetchExternalData();
  }, [pagingKey, refetchEventData, refetchExternalData]);

  const { data: majorEvents = [], refetch: refetchMajors } = generalService.useQueryGetMajorEventCalendar();

  const isLoading = isLoadingEvents || isLoadingExternal;
  const internalEvents = page === 1 ? eventData?.content ?? [] : [];
  const externalEvents = externalData?.content ?? [];
  const totalInternal = eventData?.totalElements ?? eventData?.content?.length ?? 0;
  const totalExternal = externalData?.totalElements ?? externalEvents.length;
  const totalCount = totalInternal + totalExternal;

  // ----- admin: pull from the external calendar site (same job as the back office button)
  const { data: me } = useMe({ retry: 0 });
  const isAdmin = me?.role?.roleType === "admin";
  const { data: importStatus, refetch: refetchImportStatus } =
    backOfficeServices.useQueryEventCalendarImportStatus({
      enabled: isAdmin,
      refetchInterval: (query) => (query.state.data?.running ? 4000 : false),
    });
  const syncRunning = !!importStatus?.running;
  const currentRun = importStatus?.currentRun;
  const syncRunningLabel = currentRun?.total
    ? t("back.eventCalendarList.syncProgress", {
        done: currentRun.listed ?? 0,
        total: currentRun.total,
        created: currentRun.created ?? 0,
      })
    : t("back.eventCalendarList.syncRunning");
  const wasSyncRunningRef = useRef(false);
  useEffect(() => {
    if (wasSyncRunningRef.current && !syncRunning) {
      message.success(t("back.eventCalendarList.syncDone"));
      refetchExternalData();
    }
    wasSyncRunningRef.current = syncRunning;
  }, [syncRunning, refetchExternalData, t, message]);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const { mutate: syncImport, isPending: isStartingSync } =
    backOfficeServices.useMutationSyncEventCalendarImport(
      (res) => {
        setSyncModalOpen(false);
        if (res?.success) {
          message.info(t("back.eventCalendarList.syncStarted"));
        } else {
          AlertError({ text: res?.message });
        }
        refetchImportStatus();
      },
      (err) => AlertError({ text: errorToMessage(err) })
    );
  const { mutate: stopImport, isPending: isStopping } =
    backOfficeServices.useMutationStopEventCalendarImport(
      (res) => {
        message.info(res?.message);
        refetchImportStatus();
      },
      (err) => AlertError({ text: errorToMessage(err) })
    );
  const lastRun = importStatus?.lastRun;
  const syncTooltip = syncRunning
    ? syncRunningLabel
    : lastRun?.finishedAt
      ? `${t("back.eventCalendarList.syncLast")} ${dayjs(lastRun.finishedAt).format("DD/MM/YYYY HH:mm")} · ${t(
          "back.eventCalendarList.syncSummary",
          { created: lastRun.created ?? 0, updated: lastRun.updated ?? 0, failed: lastRun.failed ?? 0 }
        )}${importStatus?.pendingCount > 0 ? ` · ${t("back.eventCalendarList.syncPending", { count: importStatus.pendingCount })}` : ""}`
      : t("back.eventCalendarList.syncNever");

  // ----- admin: mark / unmark Major
  const [majorLoadingId, setMajorLoadingId] = useState(null);
  const { mutate: setMajor } = backOfficeServices.useMutationBulkEventCalendarMajor(
    (res) => {
      setMajorLoadingId(null);
      if (res?.success) {
        message.success(res?.message);
      } else {
        AlertError({ text: res?.message });
      }
      refetchMajors();
      refetchExternalData();
    },
    (err) => {
      setMajorLoadingId(null);
      AlertError({ text: errorToMessage(err) });
    }
  );
  const toggleMajor = (event) => {
    setMajorLoadingId(event.eventId);
    setMajor({ ids: [event.eventId], isMajor: !event.isMajor });
  };

  // ----- filter handlers
  const resetPage = () => setPage(1);
  const selectDate = (d) => {
    setSelectedDate(d);
    setViewMonth(d.startOf("month"));
    setMonthMode(false);
    resetPage();
  };
  const changeViewMonth = (m) => {
    setViewMonth(m.startOf("month"));
    if (monthMode) resetPage();
  };
  const handleSearch = () => {
    setEventName(keyword.trim() || null);
    resetPage();
  };

  const weekLabel = () => {
    const [start, end] = range;
    const sameMonth = start.isSame(end, "month");
    const startFmt = sameMonth ? "DD" : isThai ? "DD MMM" : "MMM DD";
    return `${start.locale(lang).format(startFmt)} – ${end.locale(lang).format(isThai ? "DD MMM YYYY" : "MMM DD, YYYY")}`;
  };
  const listTitle = monthMode
    ? t("front.event.monthTitle", { month: viewMonth.locale(lang).format("MMMM YYYY") })
    : t("front.event.weekTitle", { range: weekLabel() });

  const selectCls = "w-full [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!bg-slate-50";

  return (
    <FrontLayout title={"event"} fullWidth>
      <div className="max-w-7xl mx-auto pt-4 md:pt-8">
        {/* Search & filters */}
        <section className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-200/90 mb-5 md:mb-6">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-3">
            <div className="col-span-2 md:col-span-4">
              <Input
                size="large"
                allowClear
                prefix={<SearchOutlined className="text-slate-400 mr-1" />}
                placeholder={t("front.event.searchPlaceholder")}
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  if (!e.target.value && eventName) {
                    setEventName(null);
                    resetPage();
                  }
                }}
                onPressEnter={handleSearch}
                className="!rounded-xl !bg-slate-50"
              />
            </div>
            <div className="col-span-1 md:col-span-3">
              <Select
                size="large"
                allowClear
                showSearch
                prefix={<EnvironmentOutlined className="text-slate-400" />}
                placeholder={t("front.event.allProvinces")}
                className={selectCls}
                value={provinceName}
                options={provinceOption}
                disabled={isLoadingProvince}
                onChange={(value) => {
                  setProvinceName(value ?? null);
                  resetPage();
                }}
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <Select
                size="large"
                allowClear
                prefix={<ThunderboltOutlined className="text-slate-400" />}
                placeholder={t("front.event.allTypes")}
                className={selectCls}
                value={eventType}
                options={eventTypeOption}
                onChange={(value) => {
                  setEventType(value ?? null);
                  resetPage();
                }}
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <DatePicker
                key={lang}
                picker="month"
                size="large"
                prefix={<CalendarOutlined className="text-slate-400" />}
                suffixIcon={null}
                placeholder={t("front.event.selectMonth")}
                locale={isThai ? thTH : enUS}
                format={(v) => v.locale(lang).format("MMMM YYYY")}
                className="w-full !rounded-xl !bg-slate-50"
                value={monthMode ? viewMonth : null}
                onChange={(date) => {
                  if (date) {
                    setViewMonth(date.startOf("month"));
                    setMonthMode(true);
                  } else {
                    setMonthMode(false);
                  }
                  resetPage();
                }}
              />
            </div>
            <div className="col-span-1 md:col-span-1">
              <Button type="primary" size="large" block className="!rounded-xl !shadow-sm" onClick={handleSearch}>
                {t("general.search")}
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-medium text-slate-700">
                {isAdmin && syncRunning ? syncRunningLabel : t("front.event.autoUpdate")}
              </span>
              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 whitespace-nowrap">
                {t("front.event.itemCount", { count: totalCount })}
              </span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {isAdmin && importStatus?.enabled !== false && (
                <Tooltip title={syncTooltip}>
                  <Button
                    size="small"
                    className="!shadow-none !rounded-lg"
                    icon={<CloudDownloadOutlined />}
                    onClick={() => setSyncModalOpen(true)}
                    loading={isStartingSync || syncRunning}
                    disabled={syncRunning}
                  >
                    {t("back.eventCalendarList.syncNow")}
                  </Button>
                </Tooltip>
              )}
              {isAdmin && syncRunning && (
                <Button
                  size="small"
                  danger
                  className="!shadow-none !rounded-lg"
                  icon={<StopOutlined />}
                  onClick={() => stopImport()}
                  loading={isStopping || importStatus?.stopping}
                >
                  {importStatus?.stopping ? t("back.eventCalendarList.syncStopping") : t("back.eventCalendarList.syncStop")}
                </Button>
              )}
              <Button
                size="small"
                type="primary"
                className="!shadow-sm !rounded-lg font-semibold"
                icon={<PlusOutlined />}
                onClick={handleOpenForm}
                loading={isSubmitting}
              >
                {t("back.eventCalendarList.submission")}
              </Button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* Calendar sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-5 lg:sticky lg:top-24">
            <MonthCalendar
              viewMonth={viewMonth}
              onViewMonthChange={changeViewMonth}
              selectedDate={selectedDate}
              onSelectDate={selectDate}
              eventDateSet={eventDateSet}
              monthMode={monthMode}
            />
            <div className="hidden lg:block bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {t("front.event.popularTypes")}
              </h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {POPULAR_TYPES.map(({ value, emoji }) => {
                  const active = eventType === value;
                  return (
                    <button
                      type="button"
                      key={value}
                      onClick={() => {
                        setEventType(active ? null : value);
                        resetPage();
                      }}
                      className={`px-2.5 py-1.5 rounded-lg font-medium border cursor-pointer transition ${
                        active
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                      }`}
                    >
                      {emoji} {value}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Feed */}
          <section className="lg:col-span-8 space-y-4 md:space-y-5 min-w-0">
            <MajorBanner
              events={majorEvents}
              isAdmin={isAdmin}
              onUnsetMajor={toggleMajor}
              unsetLoading={!!majorLoadingId && majorEvents.some((e) => e.eventId === majorLoadingId)}
            />

            <div
              ref={listTopRef}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 scroll-mt-24"
            >
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-slate-800 m-0 truncate">{listTitle}</h1>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  {t("front.event.countBadge", { count: totalCount })}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setMonthMode(false);
                    resetPage();
                  }}
                  className={`px-2.5 py-1 rounded border-0 cursor-pointer ${
                    !monthMode ? "bg-white text-blue-600 font-semibold shadow-sm" : "bg-transparent text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                >
                  {t("front.event.viewWeek")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMonthMode(true);
                    resetPage();
                  }}
                  className={`px-2.5 py-1 rounded border-0 cursor-pointer ${
                    monthMode ? "bg-white text-blue-600 font-semibold shadow-sm" : "bg-transparent text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                >
                  {t("front.event.viewMonth")}
                </button>
              </div>
            </div>

            <div className="space-y-3.5">
              {isLoading ? (
                [...Array(3)].map((_, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200/90">
                    <Skeleton active avatar={{ shape: "square", size: 64 }} paragraph={{ rows: 2 }} />
                  </div>
                ))
              ) : !internalEvents.length && !externalEvents.length ? (
                <div className="bg-white rounded-2xl p-10 border border-dashed border-slate-300 text-center text-slate-500">
                  {monthMode ? t("front.event.noEventMonth") : t("back.eventCalendarList.noEvent")}
                </div>
              ) : (
                <>
                  {internalEvents.map((event) => (
                    <EventListCard key={`event-${event.id}`} event={event} internal />
                  ))}
                  {externalEvents.map((event) => (
                    <EventListCard
                      key={`calendar-${event.eventId}`}
                      event={event}
                      isAdmin={isAdmin}
                      onToggleMajor={toggleMajor}
                      majorLoading={majorLoadingId === event.eventId}
                    />
                  ))}
                </>
              )}
            </div>

            {totalExternal > LIMIT && (
              <div className="flex justify-center">
                <Pagination
                  current={page}
                  pageSize={LIMIT}
                  total={totalExternal}
                  showSizeChanger={false}
                  onChange={(p) => {
                    setPage(p);
                    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                />
              </div>
            )}

            {/* Submit-your-race CTA */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white p-5 sm:p-7 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-blue-100 m-0 mb-1">{t("front.event.ctaEyebrow")}</p>
                  <h3 className="text-lg sm:text-xl font-bold m-0 text-white">{t("front.event.ctaTitle")}</h3>
                  <p className="text-sm text-blue-100 m-0 mt-1">{t("front.event.ctaText")}</p>
                </div>
                <Button
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={handleOpenForm}
                  className="!rounded-xl !font-bold !text-blue-700 !border-0 !shadow-md shrink-0 self-start md:self-auto"
                >
                  {t("front.event.ctaButton")}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ImportSyncModal
        open={syncModalOpen}
        onCancel={() => setSyncModalOpen(false)}
        onConfirm={(options) => syncImport(options)}
        loading={isStartingSync}
        defaultMonths={importStatus?.horizonMonths}
      />
      <EventCalendarForm
        mode="create"
        open={openForm}
        onOk={handleCloseForm}
        onCancel={handleCloseForm}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        isPublic={true}
      />
    </FrontLayout>
  );
};

export default EventCalendar;
