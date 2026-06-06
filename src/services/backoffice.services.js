import { AlertError, AlertSuccess } from "components/alert";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import createRequest from "utils/request";

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

const backOfficeServices = {
  useQueryGetAllPaymentHistory({ params, paging }) {
    return useQuery({
      queryKey: ["getAllPaymentHistory", params, paging],
      queryFn: async () => {
        const res = await createRequest.get("api/orderHistory", { params: { ...params, paging: JSON.stringify(paging) } });
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetUserById({ id }) {
    return useQuery({
      queryKey: ["useQueryGetUserById", id],
      queryFn: async () => {
        const res = await createRequest.get(`api/user/${id}`);
        return res.data.data;
      },
      enabled: !!id,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetEventById({ id, enabled = true }) {
    return useQuery({
      queryKey: ["getEventById", id],
      queryFn: async () => {
        const res = await createRequest.get(`api/event/${id}`);
        return res.data.data;
      },
      enabled: !!id && enabled,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetParticipantById({ id }) {
    return useQuery({
      queryKey: ["getParticipantById", id],
      queryFn: async () => {
        const res = await createRequest.get(`api/participants/${id}`);
        return res.data.data;
      },
      enabled: !!id,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetEventTypeById({ id, active, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getEventTypeById", id, active],
        queryFn: async () => {
          const res = await createRequest.get(`api/eventType/${id}`, { params: { active } });
          return res.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetEventTypeByEventId({ eventId, active }) {
    return useQuery({
      queryKey: ["getEventTypeByEventId", eventId, active],
      queryFn: async () => {
        const res = await createRequest.get(`api/eventType/getEventTypeByEventId`, { params: { eventId, active } });
        return res.data.data;
      },
      enabled: !!eventId,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetAllActiveEvents({ paging, queryKey }) {
    return useQuery({
      queryKey: queryKey || ["getAllActiveEvents", paging],
      queryFn: async () => {
        const payload = { paging, active: true };
        const res = await createRequest.post(`api/event/getAllEvents`, payload);
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetEventByOrganizer({ id, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getEventByOrganizer", id],
        queryFn: async () => {
          const res = await createRequest.get(`api/event/getEventByOrganizer`, { params: { id } });
          return res.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetEventByPermission({ id, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getEventByPermission", id],
        queryFn: async () => {
          const res = await createRequest.get(`api/event/getEventByPermission`, { params: { id } });
          return res.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetCheckpointMappingById({ campaignUuid, eventUuid, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getCheckpointMappingById", campaignUuid, eventUuid],
        queryFn: async () => {
          const res = await createRequest.get(`/event/getCheckpointMappingById`, { params: { campaignUuid, eventUuid } });
          return res.data.data;
        },
        enabled: !!eventUuid,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetUserStationById({ id, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getUserStationById", id],
        queryFn: async () => {
          const res = await createRequest.get(`/event/getUserStationById`, { params: { id } });
          return res.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetAllUser({ paging, queryKey }) {
    return useQuery({
      queryKey: queryKey || ["getAllUsers", paging],
      queryFn: async () => {
        const payload = { paging };
        const res = await createRequest.post(`/api/user/getAllUsers`, payload);
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetAllRole() {
    return useQuery({
      queryKey: ["getAllRole"],
      queryFn: async () => {
        const res = await createRequest.get(`/api/role`);
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetAllUserRole({ paging, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getAllUserRole", paging],
        queryFn: async () => {
          const res = await createRequest.get(`/user/getAllUserRole`, { params: { paging: JSON.stringify(paging) } });
          return res.data.data;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetAllParticipant({ id, paging }) {
    return useQuery({
      queryKey: ["getAllParticipant", id, paging],
      queryFn: async () => {
        const res = await createRequest.get(`api/participants`, { params: { id, paging: JSON.stringify(paging) } });
        return res.data.data;
      },
      enabled: !!id,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetEventPermissionsByEvent({ id, paging }) {
    return useQuery({
      queryKey: ["getEventPermissionsByEvent", id, paging],
      queryFn: async () => {
        const res = await createRequest.get(`api/eventPermission`, { params: { id, paging: JSON.stringify(paging) } });
        return res.data.data;
      },
      enabled: !!id,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },


  useQueryGetAllContract({ paging, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getAllContract", paging],
        queryFn: async () => {
          const res = await createRequest.get(`api/contracts`, { params: { paging: JSON.stringify(paging) } });
          return res.data.data;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetContractById({ id, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getContractById", id],
        queryFn: async () => {
          const res = await createRequest.get(`api/contracts/${id}`);
          return res.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetAllAnnouncement({ paging, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getAllAnnouncement", paging],
        queryFn: async () => {
          const res = await createRequest.get(`api/announcements`, { params: { paging: JSON.stringify(paging) } });
          return res.data.data;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetAnnouncementById({ id, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getAnnouncementById", id],
        queryFn: async () => {
          const res = await createRequest.get(`api/announcements/${id}`);
          return res.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetAllCoupon({ paging }) {
    return useQuery({
      queryKey: ["getAllCoupon", paging],
      queryFn: async () => {
        const res = await createRequest.get(`/api/coupon`, { params: { paging: JSON.stringify(paging) } });
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetCouponByBucketName({ id }) {
    return useQuery({
      queryKey: ["getCouponByBucketName", id],
      queryFn: async () => {
        const res = await createRequest.get(`/api/coupon/${id}`);
        return res.data.data;
      },
      enabled: !!id,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetCouponDetails({ bucketName, paging }) {
    return useQuery({
      queryKey: ["getCouponDetails", bucketName, paging],
      queryFn: async () => {
        const res = await createRequest.get(`/api/coupon/getDetails/${bucketName}`, { params: { paging: JSON.stringify(paging) } });
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetCouponByEventIds({ eventIds }) {
    return useQuery({
      queryKey: ["getCouponByEventIds", eventIds],
      queryFn: async () => {
        const path = `/api/coupon/getCoupons`;
        const res = await createRequest.post(path, eventIds);
        return res.data;
      },
      enabled: !!eventIds?.length,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetOrganizerActive() {
    return useQuery({
      queryKey: ["getOrganizerActive"],
      queryFn: async () => {
        const res = await createRequest.get(`api/user/getOrganizerActive`);
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetUserActiveByRole({ role, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getUserActiveByRole", role],
        queryFn: async () => {
          const res = await createRequest.get(`api/user/getUserActiveByRole`, { params: { role } });
          return res.data.data;
        },
        enabled: !!role,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetUserActiveByRoleType({ role }) {
    return useQuery({
      queryKey: ["getUserActiveByRoleType", role],
      queryFn: async () => {
        const res = await createRequest.get(`api/user/getUserActiveByRoleType`, { params: { role } });
        return res.data.data;
      },
      enabled: !!role,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetAllEventsDashboard() {
    return useQuery({
      queryKey: ["getAllEventsDashboard"],
      queryFn: async () => {
        const res = await createRequest.get(`api/dashboard/overview/events`);
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetDashboardOverview({ eventId }) {
    return useQuery({
      queryKey: ["getDashboardOverview", eventId],
      queryFn: async () => {
        const res = await createRequest.get(`api/dashboard/overview/${eventId}`);
        return res.data.data;
      },
      enabled: !!eventId,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetAllOrganizers() {
    return useQuery({
      queryKey: ["getAllOrganizers"],
      queryFn: async () => {
        const res = await createRequest.get(`api/dashboard/registration/events`);
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetDashboardRegistration({ eventId }) {
    return useQuery({
      queryKey: ["getDashboardRegistration", eventId],
      queryFn: async () => {
        const res = await createRequest.get(`api/dashboard/registration/${eventId}`);
        return res.data.data;
      },
      enabled: !!eventId,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetNotiEventCalendar() {
    return useQuery({
      queryKey: ["getNotiEventCalendar"],
      queryFn: async () => {
        const res = await createRequest.get(`api/eventCalendar/getNotiEventCalendar`);
        return res.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetNotiAnnouncement() {
    return useQuery({
      queryKey: ["getNotiAnnouncement"],
      queryFn: async () => {
        const res = await createRequest.get(`api/announcements/getNotiAnnouncement`);
        return res.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetAllEventCalendar({ paging }) {
    return useQuery({
      queryKey: ["getAllEventCalendar", paging],
      queryFn: async () => {
        const res = await createRequest.get(`api/eventCalendar/getEventCalendar`, { params: { paging: JSON.stringify(paging) } });
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetEventCalendarDetails({ id }) {
    return useQuery({
      queryKey: ["getEventCalendarDetails", id],
      queryFn: async () => {
        const res = await createRequest.get(`api/eventCalendar/${id}`);
        return res.data.data;
      },
      enabled: !!id,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetAllSliders({ paging, queryKey }) {
    return useQuery({
      queryKey: queryKey || ["getAllSliders", paging],
      queryFn: async () => {
        const res = await createRequest.get(`api/slider`, { params: { paging: JSON.stringify(paging) } });
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetSliderById({ id }) {
    return useQuery({
      queryKey: ["getSliderById", id],
      queryFn: async () => {
        const res = await createRequest.get(`api/slider/${id}`);
        return res.data.data;
      },
      enabled: !!id,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetFinanceSummary({ id, startDate, endDate, paging, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getFinanceSummary", id, startDate, endDate, paging],
        queryFn: async () => {
          const res = await createRequest.get(`api/summaryReport/finace`, { params: { id, startDate, endDate, paging: JSON.stringify(paging) } });
          return res.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetRevenueSummary({ startDate, endDate, paging, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getRevenueSummary", startDate, endDate, paging],
        queryFn: async () => {
          const res = await createRequest.get(`api/summaryReport/revenue`, { params: { startDate, endDate, paging: JSON.stringify(paging) } });
          return res.data.data;
        },
        enabled: !!(startDate && endDate),
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetRevenueDetailSummary({ id, startDate, endDate, paging, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getRevenueDetailSummary", id, startDate, endDate, paging],
        queryFn: async () => {
          const res = await createRequest.get(`api/summaryReport/revenueDetail`, { params: { id, startDate, endDate, paging: JSON.stringify(paging) } });
          return res.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    )
  },

  useQueryGetRegistrantSummary({ id, startDate, endDate, paging, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getRegistrantSummary", id, startDate, endDate, paging],
        queryFn: async () => {
          const res = await createRequest.get(`api/summaryReport/registrant`, { params: { id, startDate, endDate, paging: JSON.stringify(paging) } });
          return res.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetShirtSizeByType({ id }) {
    return useQuery({
      queryKey: ["getShirtSizeByType", id],
      queryFn: async () => {
        const res = await createRequest.get(`api/shirtSizes/getShirtSizeByType`, { params: { id } });
        return res.data.data;
      },
      enabled: !!id,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetRaceTypes({ id, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getRaceTypes", id],
        queryFn: async () => {
          const res = await createRequest.get(`/api/eventType/${id}`);
          return res.data;
        },
        refetchOnWindowFocus: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetShirtSizes({ onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getShirtSizes"],
        queryFn: async () => {
          const res = await createRequest.get(`/api/product/shirt-size`);
          return res.data;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetMenus({ paging, active, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["useQueryGetMenus", paging, active],
        queryFn: async () => {
          const query = { params: { paging: JSON.stringify(paging) } };
          if (active !== undefined) query.params.active = active;
          const res = await createRequest.get(`api/menu`, query);
          return res.data.data;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetMenuById({ id, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["useQueryGetMenuById", id],
        queryFn: async () => {
          const res = await createRequest.get(`api/menu/${id}`);
          return res.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetRoles({ paging, active, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["useQueryGetRoles", paging, active],
        queryFn: async () => {
          const query = { params: {} };
          if (paging) query.params.paging = JSON.stringify(paging);
          if (active !== undefined) query.params.active = active;
          const res = await createRequest.get(`api/role`, query);
          return res.data.data;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetRoleById({ id, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["useQueryGetRoleById", id],
        queryFn: async () => {
          const res = await createRequest.get(`api/role/${id}`);
          return res.data.data;
        },
        enabled: !!id,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryGetPermissionsByRoleId({ roleId, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["useQueryGetPermissionsByRoleId", roleId],
        queryFn: async () => {
          const res = await createRequest.get(`api/permission/role/${roleId}`);
          return res.data.data;
        },
        enabled: !!roleId,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQueryValidateOrderToken({ token }) {
    return useQuery({
      queryKey: ['useQueryValidateOrderToken', token],
      enabled: !!token,
      queryFn: async () => {
        const safe = encodeURIComponent(token ?? '');

        const res = await createRequest.get(`/api/order/validate-token/${safe}`, {
          validateStatus: () => true,
        });


        if (res.status === 401 || res.status === 403) {
          const err = new Error('Unauthorized');
          err.response = res;
          throw err;
        }
        if (res.status >= 400) {
          const err = new Error(`HTTP ${res.status}`);
          err.response = res;
          throw err;
        }


        const payload = res.data?.data ?? res.data;
        return payload;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryFetchPaymentLogDetails({ refNo, onSuccess, onError, options = {} }) {
    return useQueryWithCallbacks(
      {
        queryKey: ['fetchPaymentLogDetails', refNo],
        queryFn: async () => {
          const path = `/api/webhook/scb/get-payload?orderNo=${refNo}`;
          const res = await createRequest.get(path);
          if (res.status === 200 && res.data.length > 0) {
            return JSON.parse(res.data[0]);
          }
          return null;
        },
        enabled: options.enabled ?? !!refNo,
        retry: false,
        refetchInterval: refNo ? 3000 : false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useQuerygetHistoryDetail({ orderId }) {
    return useQuery({
      queryKey: ["fetchPaymentDetailsDirect", orderId],
      queryFn: async () => {
        const path = `/api/orderHistory/detail?orderId=${orderId}`;
        const res = await createRequest.get(path);
        return res.data;
      },
      enabled: !!orderId,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useMutationCreateUser(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post("/api/user", values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateUser(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`/api/user`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationDeleteUser(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ id }) => {
        const res = await createRequest.delete(`/api/user/${id}`, { params: { mode: "hard" } });
        return res.data.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationCreateRole(onSuccess, onError) {
    return useMutation({
      mutationFn: async (data) => {
        const res = await createRequest.post("api/role", data);
        return res.data.data;
      },
      onSuccess: (data) => {
        AlertSuccess({ text: "สร้าง Role สำเร็จ" });
        onSuccess?.(data);
      },
      onError: (err) => {
        AlertError({ text: err.response?.data?.message || "เกิดข้อผิดพลาดในการสร้าง Role" });
        onError?.(err);
      },
    });
  },

  useMutationUpdateRole(onSuccess, onError) {
    return useMutation({
      mutationFn: async (data) => {
        const res = await createRequest.put("api/role", data);
        return res.data.data;
      },
      onSuccess: (data) => {
        AlertSuccess({ text: "อัปเดต Role สำเร็จ" });
        onSuccess?.(data);
      },
      onError: (err) => {
        AlertError({ text: err.response?.data?.message || "เกิดข้อผิดพลาดในการอัปเดต Role" });
        onError?.(err);
      },
    });
  },

  useMutationDeleteRole(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ id, mode = "hard" }) => {
        const res = await createRequest.delete(`api/role/${id}`, {
          params: { mode }
        });
        return res.data;
      },
      onSuccess: () => {
        AlertSuccess({ text: "ลบ Role สำเร็จ" });
        onSuccess?.();
      },
      onError: (err) => {
        AlertError({ text: err.response?.data?.message || "เกิดข้อผิดพลาดในการลบ Role" });
        onError?.(err);
      },
    });
  },

  useMutationUpdatePassword(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`/api/user/updatePassword`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationResetPassword(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`/api/user/resetPassword`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateUserStatus(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`/api/user/updateStatus`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationCreateCampaign(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`/event/createCampaign`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateCampaign(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`/event/updateCampaign`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateCampaignPublish(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`/event/updateCampaignPublish`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateCampaignStatus(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`/event/updateCampaignStatus`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateCampaignActive(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`/event/updateCampaignActive`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationDeleteEvent(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ id }) => {
        const res = await createRequest.delete(`/api/event/${id}`, { params: { mode: "soft" } });
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationCreateEvent(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`/api/event`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateEventStatus(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`/api/event/updateStatus`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateEvent(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`/api/event`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateCheckpoint(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`/event/updateCheckpoint`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateCheckpointMapping(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`/event/updateCheckpointMapping`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdatePermission(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`/role/updatePermission`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateUserRole(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`/api/user/updateRole`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateParticipant(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`/api/participants/updateParticipant`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  async uploadParticipant(postData) {
    const path = "/api/participants/uploadParticipant";
    try {
      const result = await createRequest.put(path, postData);
      if (result.status === 200) {
        AlertSuccess({});
      } else {
        AlertError({ text: result.data?.status?.message });
      }
    } catch (error) {
      AlertError({ text: error?.response?.data?.message || error });
    }
  },

  useMutationDeleteParticipant(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ id }) => {
        const res = await createRequest.delete(`/participant/deleteParticipant`, { params: { id } });
        return res.data.data;
      },
      onSuccess,
      onError,
    })
  },

  useMutationDeleteAnnouncement(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ id }) => {
        const res = await createRequest.delete(`/api/announcements/${id}`, { params: { mode: "hard" } });
        return res.data.data;
      },
      onSuccess,
      onError,
    })
  },

  useMutationCreateContract(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`/api/contracts`, values);
        return res.data;
      },
      onSuccess,
      onError,
    })
  },

  useMutationDeleteContract(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ id }) => {
        const res = await createRequest.delete(`/api/contracts/${id}`, { params: { mode: "hard" } });
        return res.data.data;
      },
      onSuccess,
      onError,
    })
  },

  useMutationValidateCoupon({ onSuccess, onError }) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`/api/coupon/validateCoupon`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdatePermissions(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ roleId, permissions }) => {
        const payload = permissions;
        const res = await createRequest.put(`api/permission/role/${roleId}`, payload);
        return res.data;
      },
      onSuccess: () => {
        AlertSuccess({ text: "บันทึก Permission สำเร็จ" });
        onSuccess?.();
      },
      onError: (err) => {
        AlertError({ text: err.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึก Permission" });
        onError?.(err);
      }
    });
  },

  useMutationSendEmail(onSuccess, onError) {
    return useMutation({
      mutationFn: async (emailData) => {
        const res = await createRequest.post('/api/email/send', emailData);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationVerifyPayment(onSuccess, onError) {
    return useMutation({
      mutationFn: async (payload) => {
        const res = await createRequest.post('/api/gatewaypayment/verify-payment', payload);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdatePaymentMethod(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ orderId, paymentMethod }) => {
        const res = await createRequest.post('/api/order/update-payment-method', { orderId, paymentMethod });
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationCreateOrder(onSuccess, onError) {
    return useMutation({
      mutationFn: async (data) => {
        const res = await createRequest.post(`/api/order/create`, data);
        return res;
      },
      onSuccess,
      onError,
    });
  },

  useMutationCreateMenu(onSuccess, onError) {
    return useMutation({
      mutationFn: async (data) => {
        const res = await createRequest.post(`api/menu`, data);
        return res.data.data;
      },
      onSuccess: (data) => {
        AlertSuccess({ text: "สร้างเมนูสำเร็จ" });
        onSuccess?.(data);
      },
      onError: (err) => {
        AlertError({ text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
        onError?.(err);
      }
    });
  },

  useMutationUpdateMenu(onSuccess, onError) {
    return useMutation({
      mutationFn: async (data) => {
        const res = await createRequest.put(`api/menu`, data);
        return res.data.data;
      },
      onSuccess: (data) => {
        AlertSuccess({ text: "อัปเดตเมนูสำเร็จ" });
        onSuccess?.(data);
      },
      onError: (err) => {
        AlertError({ text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
        onError?.(err);
      }
    });
  },

  useMutationUpdateMenuOrder(onSuccess, onError) {
    return useMutation({
      mutationFn: async (data) => {
        const res = await createRequest.put(`api/menu/reorder`, data);
        return res.data;
      },
      onSuccess: (data) => {
        AlertSuccess({ text: "บันทึกการจัดเรียงเมนูสำเร็จ" });
        onSuccess?.(data);
      },
      onError: (err) => {
        AlertError({ text: err.response?.data?.message || "เกิดข้อผิดพลาดในการจัดเรียงเมนู" });
        onError?.(err);
      }
    });
  },

  useMutationDeleteMenu(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ id }) => {
        const res = await createRequest.delete(`api/menu/${id}`, { params: { mode: "hard" } });
        return res.data;
      },
      onSuccess: () => {
        AlertSuccess({ text: "ลบเมนูสำเร็จ" });
        onSuccess?.();
      },
      onError: (err) => {
        AlertError({ text: err.response?.data?.message || "เกิดข้อผิดพลาด" });
        onError?.(err);
      }
    });
  },

  useMutationCancelOrder(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ orderId, cancelledBy }) => {
        const res = await createRequest.post(`/api/orderHistory/cancel`, { orderId, cancelledBy });
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateContract(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`/api/contracts`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationCreateAnnouncement(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`/api/announcements`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateAnnouncement(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`/api/announcements`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateAnnouncementReadStatus(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`/api/announcements/updateAnnouncementReadStatus`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateCoupon(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`/api/coupon`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateCouponStatus(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`/api/coupon/updateCouponStatus`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationCreateCoupon(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`/api/coupon`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationSendBibByEvent(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`/api/participants/sendBibByEvent`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationDeleteCoupon(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ ids }) => {
        const res = await createRequest.delete(`/api/coupon`, { data: ids });
        return res.data.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationDeleteCouponByBucketName(onSuccess, onError) {
    return useMutation({
      mutationFn: async (bucketName) => {
        const res = await createRequest.delete(`/api/coupon/${bucketName}`);
        return res.data.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateContractDocument(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`/api/contracts/updateContractDocument`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateContractSignature(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`/api/contracts/updateContractSignature`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationCreateEventCalendar(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`/api/eventCalendar`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateEventCalendarStatus(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`/api/eventCalendar`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateEventCalendar(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`/api/eventCalendar/update`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationDeleteEventCalendar(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ id }) => {
        const res = await createRequest.delete(`/api/eventCalendar`, { params: { id } });
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationAlipayWechatInquire(onSuccess, onError) {
    return useMutation({
      mutationFn: async (payload) => {
        const res = await createRequest.post(`/api/gatewaypayment/ewallet-inquire`, payload);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useQueryGetCheckQuota({ pricingId, onSuccess, onError }) {
    return useQuery({
      queryKey: ["getCheckQuota", pricingId],
      queryFn: async () => {
        const res = await createRequest.get(`public-api/pricing/checkQuota/${pricingId}`);
        return res.data;
      },
      onSuccess,
      onError,
      enabled: !!pricingId,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },
  useUpdateOrder(onSuccess, onError) {
    return useMutation({
      mutationFn: async (data) => {
        const res = await createRequest.post(`/api/order/update`, data);
        return res;
      },
      onSuccess,
      onError,
    });
  },

  useQueryGetFriends({ enabled = true }) {
    return useQuery({
      queryKey: ['getFriends'],
      queryFn: async () => {
        const res = await createRequest.get(`/api/orderHistory/friends`);
        return res.data;
      },
      enabled,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })
  },

  useMutationUpdateEventPermissions(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ eventId, permissions, removedUserIds }) => {
        const payload = { permissions, removedUserIds };
        const res = await createRequest.post(`api/eventPermission/${eventId}`, payload);
        return res.data;
      },
      onSuccess: () => {
        AlertSuccess({ text: "บันทึก Event Permission สำเร็จ" });
        onSuccess?.();
      },
      onError: (err) => {
        AlertError({ text: err.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึก Event Permission" });
        onError?.(err);
      }
    });
  },

  useMutationInviteToEvent(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ eventId, invitees }) => {
        const res = await createRequest.post(`api/eventPermission/${eventId}/invite`, { invitees });
        return res.data;
      },
      onSuccess: (data) => {
        const sent = data?.data?.sent?.length || 0;
        if (sent > 0) {
          AlertSuccess({ text: `ส่งคำเชิญแล้ว ${sent} รายการ` });
        }
        onSuccess?.(data);
      },
      onError: (err) => {
        AlertError({ text: err.response?.data?.message || "เกิดข้อผิดพลาดในการส่งคำเชิญ" });
        onError?.(err);
      }
    });
  },

  useMutationAcceptInvite() {
    return useMutation({
      mutationFn: async ({ token }) => {
        const res = await createRequest.post(`api/eventPermission/invite/accept`, null, { params: { token } });
        return res.data;
      },
    });
  },

  useMutationCreateSlider(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`api/slider`, values);
        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to create slider");
        }
        return res.data;
      },
      onSuccess: () => {
        AlertSuccess({ text: "สร้าง Slider สำเร็จ" });
        onSuccess?.();
      },
      onError: (err) => {
        AlertError({ text: err.message || err.response?.data?.message || "เกิดข้อผิดพลาดในการสร้าง Slider" });
        onError?.(err);
      }
    });
  },

  useMutationUpdateSlider(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`api/slider`, values);
        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to update slider");
        }
        return res.data;
      },
      onSuccess: () => {
        AlertSuccess({ text: "อัปเดต Slider สำเร็จ" });
        onSuccess?.();
      },
      onError: (err) => {
        AlertError({ text: err.message || err.response?.data?.message || "เกิดข้อผิดพลาดในการอัปเดต Slider" });
        onError?.(err);
      }
    });
  },

  useMutationDeleteSlider(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ id }) => {
        const res = await createRequest.delete(`api/slider/${id}`, { params: { mode: "hard" } });
        if (!res.data.success) {
          throw new Error(res.data.message || "Failed to delete slider");
        }
        return res.data;
      },
      onSuccess: () => {
        AlertSuccess({ text: "ลบ Slider สำเร็จ" });
        onSuccess?.();
      },
      onError: (err) => {
        AlertError({ text: err.message || err.response?.data?.message || "เกิดข้อผิดพลาดในการลบ Slider" });
        onError?.(err);
      }
    });
  },

  useMutationUpdateSliderOrder(onSuccess, onError) {
    return useMutation({
      mutationFn: async (data) => {
        const res = await createRequest.put(`api/slider/reorder`, data);
        return res.data;
      },
      onSuccess: () => {
        AlertSuccess({ text: "บันทึกการจัดเรียง Slider สำเร็จ" });
        onSuccess?.();
      },
      onError: (err) => {
        AlertError({ text: err.response?.data?.message || "เกิดข้อผิดพลาดในการจัดเรียง Slider" });
        onError?.(err);
      }
    });
  },

  useQueryGetJobMonitoring({ queryKey }) {
    return useQuery({
      queryKey: queryKey || ["jobMonitoring"],
      queryFn: async () => {
        const res = await createRequest.get(`api/jobs/monitoring`);
        return res.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetJobExecutionHistory({ queryKey }) {
    return useQuery({
      queryKey: queryKey || ["jobExecutionHistory"],
      queryFn: async () => {
        const res = await createRequest.get(`api/jobs/execution-history`);
        return res.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useMutationTriggerJob(onSuccess, onError) {
    return useMutation({
      mutationFn: async (triggerPath) => {
        const res = await createRequest.post(`api/jobs/trigger/${triggerPath}`);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useQueryGetJobSchedule({ jobName, queryKey }) {
    return useQuery({
      queryKey: queryKey || ["jobSchedule", jobName],
      queryFn: async () => {
        const res = await createRequest.get(`api/scheduler/schedule/${jobName}`);
        return res.data;
      },
      enabled: !!jobName,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useMutationUpdateJobSchedule(onSuccess, onError) {
    return useMutation({
      mutationFn: async (data) => {
        const res = await createRequest.post(`api/scheduler/update-schedule`, data);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useQueryGetEmailQueueDashboard() {
    return useQuery({
      queryKey: ["getEmailQueueDashboard"],
      queryFn: async () => {
        const res = await createRequest.get("api/email-queue/dashboard");
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchInterval: 30000,
    });
  },

  useQueryGetEmailQueue({ page, size, type, status }) {
    return useQuery({
      queryKey: ["getEmailQueue", page, size, type, status],
      queryFn: async () => {
        const params = { page, size };
        if (type) params.type = type;
        if (status) params.status = status;
        const res = await createRequest.get("api/email-queue/queue", { params });
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchInterval: 10000,
    });
  },

  useMutationProcessEmailQueue(onSuccess, onError) {
    return useMutation({
      mutationFn: async () => {
        const res = await createRequest.post("api/email-queue/process-queue");
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useQueryGetEmailQueueConfig() {
    return useQuery({
      queryKey: ["getEmailQueueConfig"],
      queryFn: async () => {
        const res = await createRequest.get("api/email-queue/config");
        return res.data.data;
      },
      refetchOnWindowFocus: false,
    });
  },

  useMutationUpdateEmailQueueConfig(onSuccess, onError) {
    return useMutation({
      mutationFn: async (payload) => {
        const res = await createRequest.put("api/email-queue/config", payload);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationEnqueueCorrectionByEvent(onSuccess, onError) {
    return useMutation({
      mutationFn: async (eventUuid) => {
        const res = await createRequest.post(`api/email-queue/enqueue/correction/event/${eventUuid}`);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useQueryGetEmailLogsByOrder({ orderId, page = 0, size = 10 }) {
    return useQuery({
      queryKey: ["getEmailLogsByOrder", orderId, page, size],
      queryFn: async () => {
        const res = await createRequest.get(`api/email-logs/order/${orderId}`, {
          params: { page, size },
        });
        return res.data.data;
      },
      enabled: !!orderId,
      refetchOnWindowFocus: false,
    });
  },

  useQueryGetEmailLogById({ id }) {
    return useQuery({
      queryKey: ["getEmailLogById", id],
      queryFn: async () => {
        const res = await createRequest.get(`api/email-logs/${id}`);
        return res.data.data;
      },
      enabled: !!id,
      refetchOnWindowFocus: false,
    });
  },

  useMutationResendEmail(onSuccess, onError) {
    return useMutation({
      mutationFn: async (emailLogId) => {
        const res = await createRequest.post(`api/email-logs/${emailLogId}/resend`);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useQueryGetAllSystemAnnouncements({ paging, onSuccess, onError }) {
    return useQuery({
      queryKey: ["getAllSystemAnnouncements", paging],
      queryFn: async () => {
        const res = await createRequest.get(`api/system-announcements`, { params: { paging: JSON.stringify(paging) } });
        return res.data.data;
      },
      onSuccess,
      onError,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetSystemAnnouncementById({ id, onSuccess, onError }) {
    return useQuery({
      queryKey: ["getSystemAnnouncementById", id],
      queryFn: async () => {
        const res = await createRequest.get(`api/system-announcements/${id}`);
        return res.data.data;
      },
      onSuccess,
      onError,
      enabled: !!id,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useMutationCreateSystemAnnouncement(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.post(`/api/system-announcements`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdateSystemAnnouncement(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const res = await createRequest.put(`/api/system-announcements`, values);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationDeleteSystemAnnouncement(onSuccess, onError) {
    return useMutation({
      mutationFn: async (id) => {
        const res = await createRequest.delete(`/api/system-announcements/${id}`);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationCreateHelpRequest(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ orderUuid, message, attachmentUrl }) => {
        const res = await createRequest.post("/api/helpRequest", { orderUuid, message, attachmentUrl });
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useQueryGetHelpRequestsByOrder({ orderUuid, enabled = true }) {
    return useQuery({
      queryKey: ["getHelpRequestsByOrder", orderUuid],
      queryFn: async () => {
        const res = await createRequest.get("/api/helpRequest/byOrder", { params: { orderUuid } });
        return res.data.data;
      },
      enabled: !!orderUuid && enabled,
      refetchOnWindowFocus: false,
    });
  },

  useQueryGetAllHelpRequests({ status, page = 0, size = 20 }) {
    return useQuery({
      queryKey: ["getAllHelpRequests", status, page, size],
      queryFn: async () => {
        const params = { page, size };
        if (status) params.status = status;
        const res = await createRequest.get("/api/helpRequest", { params });
        return res.data.data;
      },
      refetchOnWindowFocus: false,
    });
  },

  useMutationUpdateHelpStatus(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ uuid, status, adminNote }) => {
        const res = await createRequest.put("/api/helpRequest/status", { uuid, status, adminNote });
        return res.data;
      },
      onSuccess,
      onError,
    });
  },
};

export default backOfficeServices;
