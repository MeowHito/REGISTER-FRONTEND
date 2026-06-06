import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import createRequest from "../utils/request";
import fileDownload from 'js-file-download';

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

const getFileName = (headers) => {
  let filename = "";
  const disposition = headers['content-disposition'];
  if (disposition && disposition.indexOf('attachment') !== -1) {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');

      filename = decodeURIComponent(filename);
    }
  }
  return filename;
};
const fileService = {
  useQueryGetFile({ queryObj, onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getFile"],
        queryFn: async () => {
          const { key, prefix } = queryObj;
          const path = `/public-api/getPublicUrl`;
          const res = await createRequest.get(path, { params: { key, prefix } });
          return res.data.data;
        },
        enabled: !!queryObj?.key && !!queryObj?.prefix,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },
  useMutationDownloadParticipant(id) {
    return useMutation({
      mutationFn: async () => {
        const path = `/api/file/downloadParticipant`;
        const query = { id };

        const response = await createRequest.get(path, { params: query, responseType: 'blob' });
        if (response.headers["content-type"] !== "application/json" && (response.status === 200 || response.status === 204)) {
          fileDownload(response.data, getFileName(response.headers));
        }
      }
    });
  },
  useMutationPreviewContractDocument(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ values }) => {
        const path = `/doc/getContractDocument`;
        const payload = { ...values };
        const response = await createRequest.post(path, payload, { responseType: 'blob' });
        if (
          response.headers["content-type"] !== "application/json" &&
          (response.status === 200 || response.status === 204)
        ) {
          const url = globalThis.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
          return { url };
        }
      },
      onSuccess,
      onError,
    });
  },
  useMutationZipAnnouncement(onSuccess, onError) {
    return useMutation({
      mutationFn: async (values) => {
        const path = `/doc/zipAnnouncement`;
        const payload = { ...values };
        const response = await createRequest.post(path, payload, { responseType: 'blob' });
        if (
          response.headers["content-type"] !== "application/json" &&
          (response.status === 200 || response.status === 204)
        ) {
          fileDownload(response.data, getFileName(response.headers));
        }
      },
      onSuccess,
      onError,
    });
  },
  useMutationDownloadSummaryFinanceExcel() {
    return useMutation({
      mutationFn: async ({ id, startDate, endDate }) => {
        const path = `/api/file/exportSummaryFinanceExcel`;
        const query = { id, startDate, endDate };

        const response = await createRequest.get(path, { params: query, responseType: 'blob' });
        if (response.headers["content-type"] !== "application/json" && (response.status === 200 || response.status === 204)) {
          fileDownload(response.data, getFileName(response.headers));
        }
      }
    });
  },
  useMutationSummaryFinanceDocument() {
    return useMutation({
      mutationFn: async ({ values }) => {
        const path = `/doc/getSummaryFinanceDocument`;
        const payload = { ...values };
        const response = await createRequest.post(path, payload, { responseType: 'blob' });
        if (response.headers["content-type"] !== "application/json" && (response.status === 200 || response.status === 204)) {
          const url = globalThis.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
          fileDownload(response.data, getFileName(response.headers));
          return { url };
        }
      }
    });
  },
  useMutationDownloadSummaryRegistrantExcel() {
    return useMutation({
      mutationFn: async ({ id, startDate, endDate }) => {
        const path = `/api/file/exportSummaryRegistrantExcel`;
        const query = { id, startDate, endDate };

        const response = await createRequest.get(path, { params: query, responseType: 'blob' });
        if (response.headers["content-type"] !== "application/json" && (response.status === 200 || response.status === 204)) {
          fileDownload(response.data, getFileName(response.headers));
        }
      }
    });
  },
  useMutationDownloadSummaryRevenueExcel() {
    return useMutation({
      mutationFn: async ({ startDate, endDate }) => {
        const path = `/api/file/exportSummaryRevenueExcel`;
        const query = { startDate, endDate };

        const response = await createRequest.get(path, { params: query, responseType: 'blob' });
        if (response.headers["content-type"] !== "application/json" && (response.status === 200 || response.status === 204)) {
          fileDownload(response.data, getFileName(response.headers));
        }
      }
    });
  },
  useMutationDownloadSummaryRevenueDetailExcel() {
    return useMutation({
      mutationFn: async ({ id, startDate, endDate }) => {
        const path = `/api/file/exportSummaryRevenueDetailExcel`;
        const query = { id, startDate, endDate };

        const response = await createRequest.get(path, { params: query, responseType: 'blob' });
        if (response.headers["content-type"] !== "application/json" && (response.status === 200 || response.status === 204)) {
          fileDownload(response.data, getFileName(response.headers));
        }
      }
    });
  },
  useMutationDownloadCouponDetails(bucketName) {
    return useMutation({
      mutationFn: async () => {
        const path = `/api/file/downloadCouponDetails`;
        const query = { bucketName };

        const response = await createRequest.get(path, { params: query, responseType: 'blob' });
        if (response.headers["content-type"] !== "application/json" && (response.status === 200 || response.status === 204)) {
          fileDownload(response.data, getFileName(response.headers));
        }
      },
    });
  },
  useMutationDownloadImg() {
    return useMutation({
      mutationFn: async (values) => {
        const path = `/doc/downloadImage`;
        const payload = { ...values };
        const response = await createRequest.post(path, payload, { responseType: 'blob' });
        if (response.headers["content-type"] !== "application/json" && (response.status === 200 || response.status === 204)) {
          fileDownload(response.data, getFileName(response.headers));
        }
      }
    });
  },
};
export default fileService;