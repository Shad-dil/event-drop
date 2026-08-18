"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { getSocket } from "@/lib/socket";
import { Photo } from "@/lib/types";

export function useLiveGallery(slug: string, eventId: string | undefined) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedPhotoIds, setLikedPhotoIds] = useState<Set<string>>(new Set());

  // Initial fetch of already-approved photos.
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    apiClient
      .get<{ photos: Photo[] }>(`/events/public/${slug}/photos`)
      .then((data) => {
        if (!cancelled) setPhotos(data.photos);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Live updates for the rest of the session.
  useEffect(() => {
    if (!eventId) return;

    const socket = getSocket();
    socket.emit("event:join", eventId);

    function handleNewPhoto(photo: Photo) {
      setPhotos((prev) => {
        if (prev.some((p) => p.id === photo.id)) return prev;
        return [photo, ...prev];
      });
    }

    function handleReactionUpdate(data: { photoId: string; count: number }) {
      setPhotos((prev) =>
        prev.map((p) => (p.id === data.photoId ? { ...p, reactionCount: data.count } : p))
      );
    }

    socket.on("photo:new", handleNewPhoto);
    socket.on("reaction:update", handleReactionUpdate);

    return () => {
      socket.off("photo:new", handleNewPhoto);
      socket.off("reaction:update", handleReactionUpdate);
      socket.emit("event:leave", eventId);
    };
  }, [eventId]);

  async function toggleReaction(photoId: string) {
    try {
      const result = await apiClient.post<{ added: boolean; count: number }>(
        `/photos/${photoId}/reactions`,
        { slug }
      );
      setLikedPhotoIds((prev) => {
        const next = new Set(prev);
        if (result.added) next.add(photoId);
        else next.delete(photoId);
        return next;
      });
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, reactionCount: result.count } : p))
      );
    } catch {
      // Non-critical — the tap just doesn't register; no need to interrupt the guest.
    }
  }

  return { photos, isLoading, likedPhotoIds, toggleReaction };
}
