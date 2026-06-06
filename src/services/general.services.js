import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { PUBLIC_API } from "utils";
import createRequest from "../utils/request";

function useQueryWithCallbacks(options, { onSuccess, onError } = {}) {
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const query = useQuery(options);

  useEffect(() => {
    if (query.isSuccess && query.data !== undefined) {
      onSuccessRef.current?.(query.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.dataUpdatedAt]);

  useEffect(() => {
    if (query.isError) {
      onErrorRef.current?.(query.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.errorUpdatedAt]);

  return query;
}

const generalService = {
  useQueryGetEventDatesInMonth({ date, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getEventDatesInMonth", date],
        queryFn: async () => {
          const path = `${PUBLIC_API}/event/dates?date=${date}`;
          const res = await createRequest.get(path);
          return res.data;
        },
        enabled: !!date,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetAllEvents({ paging, queryKey }) {
    return useQuery({
      queryKey: queryKey || ["getAllEvents", paging],
      queryFn: async () => {
        const path = `${PUBLIC_API}/event/getAllEvents`;
        const payload = { paging };
        const res = await createRequest.post(path, payload);
        return res.data.data;
      },
      enabled: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetEventDetailByURL({ url, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getEventDetailById", url],
        queryFn: async () => {
          const path = `${PUBLIC_API}/event/${url}`;
          const res = await createRequest.get(path);
          return res.data.data;
        },
        enabled: !!url,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetParticipantByEvent({ id, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getAllParticipantByEvent", id],
        queryFn: async () => {
          const path = `${PUBLIC_API}/campaign/getAllParticipantByEvent`;
          const res = await createRequest.get(path, { params: { id } });
          return res.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetAllStatusByEvent({ id, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getAllStatusByEvent", id],
        queryFn: async () => {
          const path = `${PUBLIC_API}/campaign/getAllStatusByEvent`;
          const res = await createRequest.get(path, { params: { id } });
          return res.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetStartersByAge({ id, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getStartersByAge", id],
        queryFn: async () => {
          const path = `${PUBLIC_API}/campaign/getStartersByAge`;
          const res = await createRequest.get(path, { params: { id } });
          return res.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetWithdrawalByAge({ id, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getWithdrawalByAge", id],
        queryFn: async () => {
          const path = `${PUBLIC_API}/campaign/getWithdrawalByAge`;
          const res = await createRequest.get(path, { params: { id } });
          return res.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetWithdrawalByCheckpoint({ id, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getWithdrawalByCheckpoint", id],
        queryFn: async () => {
          const path = `${PUBLIC_API}/campaign/getWithdrawalByCheckpoint`;
          const res = await createRequest.get(path, { params: { id } });
          return res.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetFinishByTime({ id, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getFinishByTime", id],
        queryFn: async () => {
          const path = `${PUBLIC_API}/campaign/getFinishByTime`;
          const res = await createRequest.get(path, { params: { id } });
          return res.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetDataTable({ queryTable, pathKey, path, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: [pathKey, queryTable],
        queryFn: async () => {
          const pagingTable = JSON.stringify(queryTable?.paging);
          const convertedPath = path.replace(/PUBLIC_API/g, PUBLIC_API);
          const res = await createRequest.get(convertedPath, {
            params: { ...queryTable, paging: pagingTable },
          });
          return res.data.data;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetExternalEventCalendar({ paging, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getExternalEventCalendar", paging],
        queryFn: async () => {
          const path = `${PUBLIC_API}/event/getExternalEvents`;
          const res = await createRequest.post(path, { paging });
          return res.data.data;
        },
        enabled: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryCheckparticipantName({ eventId, name }) {
    return useQuery({
      queryKey: ["checkparticipantName", eventId, name],
      queryFn: async () => {
        const path = `${PUBLIC_API}/participants/checkName?eventId=${eventId}&name=${name}`;
        const res = await createRequest.get(path);
        return res.data;
      },
      enabled: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryCheckParticipant({ eventId, name, page = 0, size = 20 }) {
    return useQuery({
      queryKey: ["checkParticipant", eventId, name, page, size],
      queryFn: async () => {
        const path = `${PUBLIC_API}/participants/check?eventId=${encodeURIComponent(eventId)}&name=${encodeURIComponent(name)}&page=${page}&size=${size}`;
        const res = await createRequest.get(path);
        return res.data;
      },
      enabled: !!eventId && !!name,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryResolveParticipantToken({ eventId, qr }) {
    return useQuery({
      queryKey: ["resolveParticipantToken", eventId, qr],
      queryFn: async () => {
        const path = `${PUBLIC_API}/participants/resolve?eventId=${encodeURIComponent(eventId)}&qr=${encodeURIComponent(qr)}`;
        const res = await createRequest.get(path);
        return res.data;
      },
      enabled: !!eventId && !!qr,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetActiveSliders() {
    return useQuery({
      queryKey: ["getActiveSliders"],
      queryFn: async () => {
        const path = `${PUBLIC_API}/slider/active`;
        const res = await createRequest.get(path);
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetParticipantDetail({ participantId, enabled = true }) {
    return useQuery({
      queryKey: ["getParticipantDetail", participantId],
      queryFn: async () => {
        const path = `${PUBLIC_API}/participants/detail?participantId=${encodeURIComponent(participantId)}`;
        const res = await createRequest.get(path);
        return res.data;
      },
      enabled: !!participantId && enabled,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useMutationGetAvailablePricing() {
    return useMutation({
      mutationFn: async (eventTypeId) => {
        const path = `${PUBLIC_API}/pricing/available/${eventTypeId}`;
        const res = await createRequest.get(path);
        return res.data;
      },
    });
  },

  useMutationGetEventTypesAvailability() {
    return useMutation({
      mutationFn: async (eventId) => {
        const path = `${PUBLIC_API}/event/${eventId}/types/availability`;
        const res = await createRequest.get(path);
        return res.data;
      },
    });
  },

  useMutationCreateEventCalendar(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(
          `${PUBLIC_API}/eventCalendar`,
          values,
        );
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useInfiniteTeamClubsByEventType({ eventTypeId, search, limit = 30, enabled = true, }) {
    return useInfiniteQuery({
      queryKey: ["teamClubsByEventType", eventTypeId, limit, search || ""],
      queryFn: async ({ pageParam = 0 }) => {
        const res = await createRequest.get(
          `/api/eventType/${eventTypeId}/teamClubs`,
          {
            params: { page: pageParam, limit, search: search || undefined },
          },
        );
        return res.data.data;
      },
      getNextPageParam: (lastPage) => lastPage?.hasMore ? lastPage.page + 1 : undefined,
      enabled: !!eventTypeId && enabled,
      initialPageParam: 0,
      staleTime: 10 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    });
  },

  useQueryGetActiveAnnouncements() {
    return useQuery({
      queryKey: ["getActiveSystemAnnouncements"],
      queryFn: async () => {
        const res = await createRequest.get(`${PUBLIC_API}/system-announcements/active`);
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000,
    });
  },
};

export default generalService;
