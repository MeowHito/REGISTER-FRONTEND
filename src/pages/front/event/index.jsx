import { Col, DatePicker, Empty, Row, Select, Skeleton } from 'antd';
import FrontLayout from 'components/frontLayout';
import LayoutContent from 'components/LayoutContent';
import EventCard from 'components/eventCard';
import React, { useEffect, useMemo, useState } from 'react';
import generalService from 'services/general.services';
import { EMPTY_DESCRIPTION } from 'constants/emptyDescription';
import Search from 'antd/es/input/Search';
import { useTranslation } from "react-i18next";
import InfiniteScroll from 'react-infinite-scroll-component';
import thTH from 'antd/es/date-picker/locale/th_TH';
import enUS from 'antd/es/date-picker/locale/en_US';
import { eventTypeOption } from 'constants/options/eventTypeOption';
import { handleQueryStatus } from 'utils';
import useCountryStateHook from 'hooks/useCountryStateHook';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

const { MonthPicker } = DatePicker;

function Event({ layout = "FrontLayout" }) {
  const { t, i18n } = useTranslation();
  const limitPage = 12;

  const [urlParams] = useSearchParams();
  const initialProvince = (() => {
    const p = urlParams.get('province');
    if (!p) return null;
    return /^\d+$/.test(p) ? Number(p) : p;
  })();
  const monthParam = urlParams.get('month');
  const initialMonth = monthParam ? dayjs(`${monthParam}-01`) : null;

  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [provinceId, setProvinceId] = useState(initialProvince);

  const [eventType, setEventType] = useState(urlParams.get('type') || null);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [eventName, setEventName] = useState(null);
  const [searchParams, setSearchParams] = useState(null);
  const isThai = i18n.language === "th";

  const {
    isLoadingProvince,
    provinceOption,
  } = useCountryStateHook();

  const queryKey = useMemo(() => ["getAllEvents", { provinceId, eventType, eventName, selectedMonth, page }], [provinceId, eventType, eventName, selectedMonth, page]);

  const paging = {
    size: limitPage,
    page: page * limitPage - limitPage,
    search: [
      provinceId && { searchField: "province", searchText: provinceId },
      eventType && { searchField: "type", searchText: eventType },
      eventName && { searchField: "name", searchText: eventName },
      selectedMonth && {
        searchField: "eventDate",
        searchText: `${selectedMonth.startOf('month').toISOString()},${selectedMonth.endOf('month').toISOString()}`,
        searchType: "DATERANGE"
      }
    ].filter(Boolean)
  };

  const { data: events, isFetching: isLoadingEvents, refetch, ...other } = generalService.useQueryGetAllEvents({ paging, queryKey });

  const SelectLayout = layout === 'FrontLayout' ? FrontLayout : LayoutContent;

  const handleSearch = (value) => {
    setEventName(value);
    setPage(1);
    setItems([]);
    setSearchParams({});
  };

  useEffect(() => {
    handleQueryStatus(other, () => {
      if (events?.content?.length > 0) {
        if (page === 1) {
          setItems(events.content);
        } else {
          setItems(prev => [...prev, ...events.content]);
        }
      } else if (page === 1) {
        setItems([]);
      }
    })
  }, [other.fetchStatus])

  useEffect(() => {
    refetch();
  }, [searchParams, page]);

  useEffect(() => {
    if (!provinceId && !eventType && !selectedMonth) {
      setPage(1);
      setItems([]);
      setSearchParams({});
    }
  }, [provinceId, eventType, selectedMonth]);

  const fetchMoreData = () => {
    setPage(prevPage => prevPage + 1);
  };

  return (
    <SelectLayout title={"event"} useContainer={false}>
      <div className="md:max-w-screen-2xl mx-auto px-2">
        <Row className='!my-2 md:!my-10' gutter={[4, 4]}>
          <Col xs={24} md={5}>
            <Select
              placeholder={t("front.event.selectProvince")} allowClear
              showSearch
              className='w-full'
              value={provinceId}
              options={provinceOption}
              disabled={isLoadingProvince}
              onChange={(value) => setProvinceId(value)}
              filterOption={(input, option) => {
                const str = option.filterLabel || (typeof option.label === 'string' ? option.label : '');
                return str.toLowerCase().includes(input.toLowerCase());
              }}
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

        {isLoadingEvents && page === 1 ? (
          <Row justify="center" gutter={[8, 24]} align="stretch">
            {[...Array(3)].map((_, index) => (
              <Col className="flex" xs={12} md={8} key={`skeleton-${index}`}>
                <Skeleton active>
                  <EventCard />
                </Skeleton>
              </Col>
            ))}
          </Row>
        ) : (
          items?.length > 0 ? (
            <InfiniteScroll
              className='pb-5'
              style={{ overflowX: 'hidden' }}
              scrollableTarget="scrollableDiv"
              dataLength={items.length}
              next={fetchMoreData}
              loader={<h5 className="text-center mt-16 opacity-50">Loading...</h5>}
            >
              <Row justify="left" gutter={[8, 24]}>
                {items.map((data, index) => (
                  <Col key={`event-${index}`} xs={12} md={8}>
                    <EventCard {...data} />
                  </Col>
                ))}
              </Row>
            </InfiniteScroll>
          ) : (
            <div className="w-full center p-4">
              <Empty description={EMPTY_DESCRIPTION} />
            </div>
          )
        )}
      </div>
    </SelectLayout>
  );
}

export default Event;
