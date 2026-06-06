import { useMutation, useQuery } from "@tanstack/react-query";
import { PUBLIC_API } from "utils";
import createRequest from "../utils/request";

const masterService = {
  useMutationLogin(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ values }) => {
        const { username, password } = values;
        const path = `login`;
        const query = { username, password };
        const res = await createRequest.post(path, query);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationLoginSocial(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ payload }) => {
        const path = `${PUBLIC_API}/login`;
        const res = await createRequest.post(path, payload);
        return res.data;
      },
      onSuccess,
      onError
    });
  },

  useMutationLoginStation(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ values }) => {
        const path = `${PUBLIC_API}/loginStation`;
        const payload = { ...values };
        const { username, password, campaignUuid } = values;
        const encodeHeader = encodeURIComponent(username + campaignUuid + password);
        const res = await createRequest.post(path, payload, {
          headers: { authorizationstation: encodeHeader },
        });
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationCheckEmail(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ values }) => {
        const path = `${PUBLIC_API}/checkUserEmail`;
        const payload = { ...values };
        const res = await createRequest.post(path, payload);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationSendContactEmail(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ values }) => {
        const path = `${PUBLIC_API}/sendContactEmail`;
        const payload = { ...values };
        const res = await createRequest.post(path, payload);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationRegister(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ values }) => {
        const path = `${PUBLIC_API}/register`;
        const payload = { ...values };
        const res = await createRequest.post(path, payload);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useMutationUpdatePasswordUserToken(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const path = `${PUBLIC_API}/updateUserToken`;
        const payload = { ...values };
        const res = await createRequest.put(path, payload);
        return res.data;
      },
      onSuccess,
      onError,
    });
  },

  useQueryGetAllProvince() {
    return useQuery({
      queryKey: ["getAllProvince"],
      queryFn: async () => {
        const path = `${PUBLIC_API}/master/provinces`;
        const res = await createRequest.get(path);
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetProvinces() {
    return useQuery({
      queryKey: ["getGeoProvinces"],
      queryFn: async () => {
        const path = `${PUBLIC_API}/master/geo/provinces`;
        const res = await createRequest.get(path);
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    });
  },

  useQueryGetDistricts({ provinceCode, provinceName } = {}) {
    const params = provinceCode ? { provinceCode } : provinceName ? { provinceName } : {};
    const enabled = !!(provinceCode || provinceName);
    return useQuery({
      queryKey: ["getGeoDistricts", provinceCode, provinceName],
      queryFn: async () => {
        const path = `${PUBLIC_API}/master/geo/districts`;
        const res = await createRequest.get(path, { params });
        return res.data.data;
      },
      enabled,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    });
  },

  useQueryGetSubdistricts({ districtCode, districtName } = {}) {
    const params = districtCode ? { districtCode } : districtName ? { districtName } : {};
    const enabled = !!(districtCode || districtName);
    return useQuery({
      queryKey: ["getGeoSubdistricts", districtCode, districtName],
      queryFn: async () => {
        const path = `${PUBLIC_API}/master/geo/subdistricts`;
        const res = await createRequest.get(path, { params });
        return res.data.data;
      },
      enabled,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    });
  },

  useQueryGeoLookupByPostal({ postalCode } = {}) {
    return useQuery({
      queryKey: ["getGeoLookupByPostal", postalCode],
      queryFn: async () => {
        const path = `${PUBLIC_API}/master/geo/lookup`;
        const res = await createRequest.get(path, { params: { postalCode } });
        return res.data.data;
      },
      enabled: !!(postalCode && String(postalCode).length === 5),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
    });
  },

  useQueryGetAllCountryState() {
    return useQuery({
      queryKey: ["getAllCountryState"],
      queryFn: async () => {
        const path = `${PUBLIC_API}/master/countryState`;
        const res = await createRequest.get(path);
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetNationality() {
    return useQuery({
      queryKey: ["getNationality"],
      queryFn: async () => {
        const path = `${PUBLIC_API}/master/nationalities`;
        const res = await createRequest.get(path);
        return res.data.data;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetOrganizer({ onSuccess, onError }) {
    return useQuery({
      queryKey: ["getOrganizer"],
      queryFn: async () => {
        const path = `/master/getOrganizer`;
        const res = await createRequest.get(path);
        return res.data.data;
      },
      onSuccess,
      onError,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetOtions({ vData, tData, onSuccess, onError }) {
    return useQuery({
      queryKey: ["getOtionData", vData, tData],
      queryFn: async () => {
        const path = `/master/getOtionData`;
        const query = { params: { vData, tData } };
        const res = await createRequest.get(path, query);
        return res.data.data;
      },
      onSuccess,
      onError,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetIdOtions({ vData, tData, onSuccess, onError }) {
    return useQuery({
      queryKey: ["getOtionIdOtions", vData, tData],
      queryFn: async () => {
        const path = `/master/getOtionIdOtions`;
        const query = { params: { vData, tData } };
        const res = await createRequest.get(path, query);
        return res.data.data;
      },
      onSuccess,
      onError,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetLoginStation({ username, password, id, login, onSuccess, onError }) {
    return useQuery({
      queryKey: ["getUserStation", username, password, id],
      queryFn: async () => {
        const path = `${PUBLIC_API}/getUserStation`;
        const query = { params: { username, password, id } };
        const res = await createRequest.get(path, query);
        return res.data.data;
      },
      onSuccess,
      onError,
      enabled: login,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },

  useQueryGetUserToken({ id }) {
    return useQuery({
      queryKey: ["getUserToken", id],
      queryFn: async () => {
        const path = `${PUBLIC_API}/validateUserToken`;
        const query = { params: { id } };
        const res = await createRequest.get(path, query);
        return res.data;
      },
      enabled: !!id,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });
  },
};

export default masterService;
