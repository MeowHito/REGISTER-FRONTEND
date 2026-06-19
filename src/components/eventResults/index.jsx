import { Empty, Skeleton } from 'antd';
import EventCard from 'components/eventCard';
import React, { useEffect, useMemo, useState } from 'react';
import generalService from 'services/general.services';
import { EMPTY_DESCRIPTION } from 'constants/emptyDescription';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { handleQueryStatus } from 'utils';

const LIMIT = 12;

/**
 * Inline events grid with server-side filtering + infinite scroll.
 * Driven by props so the home page search bar can control it without navigating.
 */
export default function EventResults({ provinceId = null, eventType = null, eventName = null }) {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);

  // Reset paging whenever a filter changes
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [provinceId, eventType, eventName]);

  const queryKey = useMemo(
    () => ['getHomeEvents', { provinceId, eventType, eventName, page }],
    [provinceId, eventType, eventName, page]
  );

  const paging = {
    size: LIMIT,
    page: page * LIMIT - LIMIT,
    search: [
      provinceId && { searchField: 'province', searchText: provinceId },
      eventType && { searchField: 'type', searchText: eventType },
      eventName && { searchField: 'name', searchText: eventName },
    ].filter(Boolean),
  };

  const { data: events, isFetching, refetch, ...other } =
    generalService.useQueryGetAllEvents({ paging, queryKey });

  useEffect(() => {
    refetch();
  }, [provinceId, eventType, eventName, page]);

  useEffect(() => {
    handleQueryStatus(other, () => {
      if (events?.content?.length > 0) {
        setItems((prev) => (page === 1 ? events.content : [...prev, ...events.content]));
      } else if (page === 1) {
        setItems([]);
      }
    });
  }, [other.fetchStatus]);

  const hasFilter = !!(provinceId || eventType || eventName);
  const total = events?.totalElements ?? items.length;
  const hasMore = items.length < total;

  return (
    <section className="bg-white py-10 md:py-14">
      <div className="container md:max-w-screen-xl mx-auto px-5 md:px-4">
        <div className="mb-6 md:mb-8">
          <h2 className="text-[clamp(20px,7vw,30px)] leading-[1.05] md:text-3xl font-extrabold text-gray-900">
            {hasFilter ? t('front.home.searchResults') : t('front.home.upcomingEvents')}
          </h2>
          <div className="h-1 w-16 md:w-20 bg-brand rounded-full mt-2" />
        </div>

        {isFetching && page === 1 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-5">
            {[...Array(4)].map((_, index) => (
              <div key={`skeleton-${index}`} className="w-full bg-white rounded-2xl border border-gray-100 p-4">
                <Skeleton.Image active className="!w-full !h-40 !rounded-xl" />
                <Skeleton active paragraph={{ rows: 2 }} className="mt-3" />
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <InfiniteScroll
            className="!overflow-visible"
            scrollableTarget="scrollableDiv"
            dataLength={items.length}
            next={() => setPage((p) => p + 1)}
            hasMore={hasMore}
            loader={<h5 className="text-center mt-10 opacity-50">Loading...</h5>}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-5">
              {items.map((data, index) => (
                <EventCard key={`event-${data.id || index}`} {...data} />
              ))}
            </div>
          </InfiniteScroll>
        ) : (
          <div className="w-full flex justify-center p-8">
            <Empty description={EMPTY_DESCRIPTION} />
          </div>
        )}
      </div>
    </section>
  );
}
