import axios from "axios";
import { CONTEXT_URL, timeout } from "constants/helper";
import errorLogger from "./errorLogger";

const createRequest = axios.create({
  baseURL: CONTEXT_URL,
  timeout,
  withCredentials: true
});

const IGNORE_LOG_ENDPOINTS = [
  '/api/webhook/scb/get-payload',
  '/api/auth/me'
];

const shouldIgnoreLog = (url) => {
  return IGNORE_LOG_ENDPOINTS.some(endpoint => url?.includes(endpoint));
};

const isExpectedNotFound = (err) => {
  const url = err?.config?.url;
  if (!/\/public-api\/event\/[^/]+$/.test(url || "")) return false;
  return err?.response?.status === 404 || /not found/i.test(err?.response?.data?.message || "");
};

createRequest.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

createRequest.interceptors.response.use(
  (res) => res,
  async (err) => {
    const requestUrl = err?.config?.url;
    
    if (err?.response?.status !== 401 && !shouldIgnoreLog(requestUrl) && !isExpectedNotFound(err)) {
      errorLogger.apiError(err);
    }

    if (err?.response?.status === 401) {
      const currentPath = globalThis.location.pathname + globalThis.location.search;
      if (currentPath && currentPath !== '/login') {
        sessionStorage.setItem('returnUrl', currentPath);
      }
      globalThis.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default createRequest;
