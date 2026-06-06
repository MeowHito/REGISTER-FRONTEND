import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import request from "utils/request";

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

const masterService = {
  useQueryGetUserProfile({ onSuccess, onError }) {
    return useQueryWithCallbacks(
      {
        queryKey: ["getUserProfile"],
        queryFn: async () => {
          const path = `/user/getUserProfile`;
          const res = await request.get(path, { params: {} });
          return res.data.data;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      { onSuccess, onError }
    );
  },

  useMutationCreateData(onSuccess, onError) {
    return useMutation({
      mutationFn: async ({ data }) => {
        const path = `/core/createDate`;
        const res = await request.post(path, { ...data });
        return res.data;
      },
      onSuccess,
      onError,
    });
  },
};
export default masterService;
