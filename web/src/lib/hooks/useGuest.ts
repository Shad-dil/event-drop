"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Guest, PublicEvent } from "@/lib/types";

export function usePublicEvent(slug: string) {
  return useQuery({
    queryKey: ["public-event", slug],
    queryFn: () =>
      apiClient.get<{ event: PublicEvent }>(`/events/public/${slug}`).then((d) => d.event),
    enabled: Boolean(slug),
    retry: false,
  });
}

/** Ensures a guest session cookie exists for this event; safe to call repeatedly. */
export function useEnsureGuestSession() {
  return useMutation({
    mutationFn: (input: { slug: string; name?: string }) =>
      apiClient.post<{ guest: Guest; event: PublicEvent }>("/guests/sessions", input),
  });
}

export function useUpdateGuestName() {
  return useMutation({
    mutationFn: (input: { slug: string; name: string }) =>
      apiClient.patch<{ guest: Guest }>("/guests/sessions", input),
  });
}
