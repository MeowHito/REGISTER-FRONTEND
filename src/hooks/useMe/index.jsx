import { useQuery, useQueryClient } from "@tanstack/react-query";
import createRequest from "utils/request";

export async function fetchMe() {
  const res = await createRequest.get("/api/auth/me");
  const payload = res?.data;

  if (payload && typeof payload === "object" && "success" in payload) {
    if (payload.success === false) {
      const msg = payload.message || "Unauthorized";
      const err = new Error(msg);
      err.status = 401;
      throw err;
    }
    return payload.data ?? null;
  }

  return payload ?? null;
}

export default function useMe(options = {}) {
  return useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      const status = error?.status || error?.response?.status;
      if (status === 401) return false;
      return failureCount < 1;
    },
    ...options,
  });
}

export function useLogout({ onSuccess, onError } = {}) {
  const qc = useQueryClient();

  return async function logout() {
    try {
      await createRequest.post("/logout");
      qc.removeQueries({ queryKey: ["me"], exact: true });
      if (onSuccess) onSuccess();
    } catch (e) {
      if (onError) onError(e);
      else throw e;
    }
  };
}

export function prefetchMe(queryClient, options = {}) {
  return queryClient.prefetchQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
