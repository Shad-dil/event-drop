"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiError } from "@/lib/api-client";
import { User } from "@/lib/types";

const ME_KEY = ["auth", "me"] as const;

export function useCurrentUser() {
  return useQuery<User | null>({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await apiClient.get<User>("/auth/me");
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      apiClient.post<{ user: User }>("/auth/login", input),
    onSuccess: (data) => {
      queryClient.setQueryData(ME_KEY, data.user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string; name?: string }) =>
      apiClient.post<{ user: User }>("/auth/register", input),
    onSuccess: (data) => {
      queryClient.setQueryData(ME_KEY, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post("/auth/logout"),
    onSuccess: () => {
      queryClient.setQueryData(ME_KEY, null);
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
