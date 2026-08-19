"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { getSocket } from "@/lib/socket";
import { Photo } from "@/lib/types";

export function useLiveGallery(slug: string, eventId: string | undefined) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedPhotoIds, setLikedPhotoIds] = useState<Set<string>>(new Set());
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<string>>(new Set());

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

    const joinRoom = () => {
      socket.emit("event:join", eventId);
    };

    function handleNewPhoto(photo: Photo) {
      setPhotos((prev) => {
        if (prev.some((p) => p.id === photo.id)) return prev;
        return [photo, ...prev];
      });
    }

    function handleReactionUpdate(data: { photoId: string; count: number }) {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === data.photoId ? { ...p, reactionCount: data.count } : p,
        ),
      );
    }

    joinRoom();
    socket.on("connect", joinRoom);
    socket.on("photo:new", handleNewPhoto);
    socket.on("reaction:update", handleReactionUpdate);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("photo:new", handleNewPhoto);
      socket.off("reaction:update", handleReactionUpdate);
      socket.emit("event:leave", eventId);
    };
  }, [eventId]);

  async function toggleReaction(photoId: string) {
    if (pendingLikeIds.has(photoId)) return;

    const wasLiked = likedPhotoIds.has(photoId);
    const currentCount =
      photos.find((photo) => photo.id === photoId)?.reactionCount ?? 0;
    const nextLiked = !wasLiked;
    const optimisticCount = Math.max(0, currentCount + (nextLiked ? 1 : -1));

    setPendingLikeIds((prev) => {
      const next = new Set(prev);
      next.add(photoId);
      return next;
    });

    setLikedPhotoIds((prev) => {
      const next = new Set(prev);
      if (nextLiked) next.add(photoId);
      else next.delete(photoId);
      return next;
    });

    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId
          ? { ...photo, reactionCount: optimisticCount }
          : photo,
      ),
    );

    try {
      const result = await apiClient.post<{ added: boolean; count: number }>(
        `/photos/${photoId}/reactions`,
        { slug },
      );

      setLikedPhotoIds((prev) => {
        const next = new Set(prev);
        if (result.added) next.add(photoId);
        else next.delete(photoId);
        return next;
      });

      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === photoId
            ? { ...photo, reactionCount: result.count }
            : photo,
        ),
      );
    } catch {
      setLikedPhotoIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(photoId);
        else next.delete(photoId);
        return next;
      });

      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === photoId
            ? { ...photo, reactionCount: currentCount }
            : photo,
        ),
      );
    } finally {
      setPendingLikeIds((prev) => {
        const next = new Set(prev);
        next.delete(photoId);
        return next;
      });
    }
  }

  return { photos, isLoading, likedPhotoIds, pendingLikeIds, toggleReaction };
}
