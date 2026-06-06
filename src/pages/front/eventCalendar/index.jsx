import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Calendar,
  Col,
  Row,
  Button,
  DatePicker,
  Select,
  Badge,
  Skeleton,
  Space
} from "antd";
import { LeftOutlined, PlusOutlined, RightOutlined } from "@ant-design/icons";
import Search from "antd/es/input/Search";
import Cookies from "js-cookie";
import UseModalHook from "hooks/useModalHook";
import FrontLayout from "components/frontLayout";
import EventCard from "components/eventCard";
import EventCalendarForm from "pages/backOffice/eventCalendar/eventCalendarForm";
import EventCalendarCard from "components/eventCalendarCard";
import generalService from "services/general.services";
import thTH from 'antd/es/date-picker/locale/th_TH';
import enUS from 'antd/es/date-picker/locale/en_US';
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { eventTypeOption } from 'constants/options/eventTypeOption';
import useCountryStateHook from "hooks/useCountryStateHook";
import { SYS_ISO_DATE_FORMAT } from 'constants/helper';
import { toStartOfDayISO } from "utils/format";

const { MonthPicker } = DatePicker;

const EventCalendar = () => {
  const { t, i18n } = useTranslation();
  const limitPage = 12;
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [internalEvent, setInternalEvent] = useState([]);
  const [externalEvent, setExternalEvent] = useState([]);
  const [provinceName, setProvinceName] = useState(null);
  const [eventType, setEventType] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [eventName, setEventName] = useState(null);
  const [searchParams, setSearchParams] = useState(null);
  const didMountRef = useRef(false);

  const isThai = i18n.language === "th";
  
  const eventDateFilter = selectedMonth
    ? {
      searchField: "eventDate",
      searchText: `${selectedMonth.startOf('month').toISOString()},${selectedMonth.endOf('month').toISOString()}`,
      searchType: "DATERANGE",
    }
    : startDate && endDate
      ? {
        searchField: "eventDate",
        searchText: `${startDate.toISOString()},${endDate.toISOString()}`,
        searchType: "DATERANGE",
      }
      : null;

  const {
    provinceOption,
    isLoadingProvince
  } = useCountryStateHook({ valueKey: 'stateLocal' });

  const {
    open: openForm,
    handleOpen: handleopenForm,
    handleClose: handlecloseForm,
  } = UseModalHook();

  const { data: eventDates = [] } = generalService.useQueryGetEventDatesInMonth({
    date: toStartOfDayISO(selectedDate),
  });

  const eventDateSet = useMemo(() => {
    return new Set(eventDates.map((d) => dayjs(d).format(SYS_ISO_DATE_FORMAT)));
  }, [eventDates]);

  const {
    data: eventData,
    isFetching: isLoadingEvents,
    refetch: refetchEventData,
  } = generalService.useQueryGetAllEvents({
    paging: {
      size: limitPage,
      page: page * limitPage - limitPage,
      search: [
        provinceName && { searchField: "province", searchText: provinceName },
        eventType && { searchField: "type", searchText: eventType },
        eventName && { searchField: "name", searchText: eventName },
        eventDateFilter
      ].filter(Boolean),
    }
  });

  const {
    data: eventExternalData,
    isFetching: isLoadingEventsExternal,
    refetch: refetchEventExternalData,
  } = generalService.useQueryGetExternalEventCalendar({
    paging: {
      size: limitPage,
      page: page * limitPage - limitPage,
      search: [
        provinceName && { searchField: "location", searchText: provinceName },
        eventType && { searchField: "eventType", searchText: eventType },
        eventName && { searchField: "eventName", searchText: eventName },
        eventDateFilter
      ].filter(Boolean),
    }
  });

  const isLoading = isLoadingEvents || isLoadingEventsExternal;

  const fullCellRender = (current, info) => {
    if (info.type !== "date") return info.originNode;

    const start = selectedDate.clone().startOf("week");
    const end = selectedDate.clone().endOf("week");
    const isInSelectedWeek = current.isBetween(start, end, null, "[]");
    const isStart = current.isSame(start, "day");
    const isEnd = current.isSame(end, "day");

    const dateStr = current.format(SYS_ISO_DATE_FORMAT);
    const hasEvent = eventDateSet.has(dateStr);

    return (
      <div
        className={`relative text-center py-1 h-8 flex items-center justify-center
        ${isInSelectedWeek ? "bg-blue-50 text-blue-600 font-semibold" : ""}
        ${isStart ? "rounded-l-md" : ""}
        ${isEnd ? "rounded-r-md" : ""}`}
      >
        {current.date()}
        {hasEvent && (
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2">
            <Badge color="blue" dot className="scale-75" />
          </span>
        )}
      </div>
    );
  };

  const headerRender = ({ value, onChange }) => {
    const current = value;
    const months = Array.from({ length: 12 }, (_, i) =>
      dayjs().month(i).locale(i18n.language).format('MMM')
    );
    const years = Array.from({ length: 20 }, (_, i) => current.year() - 10 + i);

    return (
      <div className="flex justify-end">
        <Space className="p-2">
          <Select
            value={current.month()}
            onChange={(newMonth) => {
              onChange(current.clone().month(newMonth));
            }}
          >
            {months.map((month, index) => (
              <Select.Option key={index} value={index}>
                {month}
              </Select.Option>
            ))}
          </Select>
          <Select
            value={current.year()}
            onChange={(newYear) => {
              onChange(current.clone().year(newYear));
            }}
          >
            {years.map((year) => (
              <Select.Option key={year} value={year}>
                {year}
              </Select.Option>
            ))}
          </Select>
        </Space></div>
    );
  };

  const getWeekRangeDisplay = (date) => {
    const start = date.clone().startOf("week");
    const end = date.clone().endOf("week");
    const formatStr = isThai ? "DD MMM" : "MMM DD";
    const endFormatStr = isThai ? "DD MMM YYYY" : "MMM DD, YYYY";

    return `${start.locale(i18n.language).format(formatStr)} - ${end.locale(i18n.language).format(endFormatStr)}`;
  };

  const onCalendarChange = (date) => {
    setSelectedDate(date);
  };

  const handleSearch = (value) => {
    setEventName(value);
    setPage(1);
    setSearchParams({});
  };

  useEffect(() => {
    setSelectedDate(dayjs());
    const lang = Cookies.get("language")?.toLowerCase() ?? "th";
    i18n.changeLanguage(lang);
  }, [])

  useEffect(() => {
    const start = selectedDate.clone().startOf("week");
    const end = selectedDate.clone().endOf("week");
    setStartDate(start);
    setEndDate(end);
    setSelectedMonth(null)
  }, [selectedDate]);

  useEffect(() => {
    if (eventData && eventExternalData) {
      setInternalEvent(eventData.content)
      setExternalEvent(eventExternalData.content)
    }
  }, [eventData, eventExternalData])

  useEffect(() => {
    if (!provinceName && !eventType && !selectedMonth) {
      setPage(1);
      setSelectedDate(dayjs());
      setSearchParams({});
    }
  }, [provinceName, eventType, selectedMonth]);

  useEffect(() => {
    if (didMountRef.current) {
      refetchEventData();
      refetchEventExternalData();
    } else {
      didMountRef.current = true;
    }
  }, [searchParams, page, startDate, endDate]);

  return (
    <FrontLayout title={"event"}>
      <div className="pt-3 md:pt-12">
        <Row className='mb-4' gutter={[4, 4]}>
          <Col xs={24} md={5}>
            <Select
              placeholder={t("front.event.selectProvince")} allowClear
              className='w-full'
              value={provinceName}
              options={provinceOption}
              disabled={isLoadingProvince}
              onChange={(value) => setProvinceName(value)}
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              placeholder={t("front.event.selectEventType")} allowClear
              className='w-full'
              value={eventType}
              options={eventTypeOption}
              onChange={(value) => setEventType(value)}
            />
          </Col>
          <Col xs={12} md={5}>
            <MonthPicker
              key={i18n.language}
              placeholder={t("front.event.selectMonth")}
              style={{ width: '100%' }}
              locale={isThai ? thTH : enUS}
              value={selectedMonth}
              onChange={(date) => setSelectedMonth(date)}
            />
          </Col>
          <Col xs={24} md={9}>
            <Search
              placeholder={t("front.campaign.searchEvent")}
              allowClear
              enterButton={t("general.search")}
              size="middle"
              onSearch={handleSearch}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Calendar
              fullscreen={false}
              onSelect={onCalendarChange}
              value={selectedDate}
              fullCellRender={fullCellRender}
              headerRender={headerRender}
            />
          </Col>

          <Col xs={24} md={16}>
            <div>
              <div className="my-2 flex flex-col-reverse gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex w-full items-center gap-2 flex-nowrap min-w-0 overflow-hidden lg:w-auto">
                  <Button
                    type="primary"
                    onClick={() => setSelectedDate(dayjs())}
                    className="shadow-none whitespace-nowrap flex-none"
                  >
                    {t("back.eventCalendarList.thisWeek")}
                  </Button>

                  <div className="flex items-center gap-2 flex-1 min-w-0 lg:flex-none">
                    <Button
                      icon={<LeftOutlined />}
                      onClick={() => setSelectedDate((prev) => prev.subtract(1, "week"))}
                      className="shadow-none flex-none"
                    />

                    <span
                      className="
                        flex-1 min-w-0 lg:flex-none
                        text-base md:text-xl lg:text-2xl font-semibold
                        whitespace-nowrap overflow-hidden text-ellipsis
                        text-center lg:text-left
                      "
                      title={getWeekRangeDisplay(selectedDate)}
                    >
                      {getWeekRangeDisplay(selectedDate)}
                    </span>

                    <Button
                      icon={<RightOutlined />}
                      onClick={() => setSelectedDate((prev) => prev.add(1, "week"))}
                      className="shadow-none flex-none"
                    />
                  </div>
                </div>

                <div className="flex w-full justify-end lg:w-auto">
                  <Button
                    type="primary"
                    onClick={handleopenForm}
                    className="shadow-none whitespace-nowrap !px-3 sm:!px-4 !text-sm sm:!text-base lg:!px-4 lg:!text-base"
                    icon={<PlusOutlined />}
                    loading={isSubmitting}
                  >
                    {t("back.eventCalendarList.submission")}
                  </Button>
                </div>
              </div>
              {isLoading ? (
                <Row gutter={[8, 12]}>
                  {[...Array(4)].map((_, idx) => (
                    <Col key={idx} xs={12} md={12}>
                      <Skeleton active avatar paragraph={{ rows: 3 }} />
                    </Col>
                  ))}
                </Row>
              ) : (
                <Row justify="start" gutter={[8, 12]}>
                  <>
                    {internalEvent?.map((event) => (
                      <Col
                        key={`event-${event.id}`}
                        xs={12}
                        md={12}
                        className="flex justify-center"
                      >
                        <EventCard {...event} />
                      </Col>
                    ))}
                    {!internalEvent?.length && !externalEvent?.length ? (
                      <Col span={24}>
                        <p>{t("back.eventCalendarList.noEvent")}</p>
                      </Col>
                    ) : null}
                    {externalEvent?.map((event) => (
                      <Col key={`approved-event-${event.id}`} xs={24}>
                        <EventCalendarCard event={event} />
                      </Col>
                    ))}
                  </>
                </Row>
              )}
            </div>
          </Col>
        </Row>
      </div>
      <EventCalendarForm
        mode="create"
        open={openForm}
        onOk={handlecloseForm}
        onCancel={handlecloseForm}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        isPublic={true}
      />
    </FrontLayout>
  );
};

export default EventCalendar;
