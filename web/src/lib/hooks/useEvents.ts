"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { CreateEventInput, Event } from "@/lib/types";

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: () => apiClient.get<{ events: Event[] }>("/events").then((d) => d.events),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => apiClient.get<{ event: Event }>(`/events/${id}`).then((d) => d.event),
    enabled: Boolean(id),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) =>
      apiClient.post<{ event: Event }>("/events", input).then((d) => d.event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
