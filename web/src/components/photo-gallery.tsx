"use client";

import { useEffect, useState } from "react";
import { useLiveGallery } from "@/lib/hooks/useLiveGallery";

export function PhotoGallery({
  slug,
  eventId,
}: {
  slug: string;
  eventId?: string;
}) {
  const { photos, isLoading, likedPhotoIds, toggleReaction } = useLiveGallery(
    slug,
    eventId,
  );
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  const selectedPhotoIndex = photos.findIndex(
    (photo) => photo.id === selectedPhotoId,
  );
  const selectedPhoto =
    selectedPhotoIndex >= 0 ? photos[selectedPhotoIndex] : null;

  const closePhoto = () => {
    setSelectedPhotoId(null);
    if (window.history.state && window.history.state.photoId) {
      window.history.back();
    }
  };

  useEffect(() => {
    const onPopState = () => {
      setSelectedPhotoId(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selectedPhoto) {
        closePhoto();
      }
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedPhoto]);

  const openPhoto = (photoId: string) => {
    setSelectedPhotoId(photoId);
    window.history.pushState({ photoId }, "", window.location.href);
  };

  const goToPhoto = (direction: "prev" | "next") => {
    if (!photos.length) return;

    const currentIndex = selectedPhotoIndex >= 0 ? selectedPhotoIndex : 0;
    const nextIndex =
      direction === "prev"
        ? (currentIndex - 1 + photos.length) % photos.length
        : (currentIndex + 1) % photos.length;

    setSelectedPhotoId(photos[nextIndex].id);
  };

  if (isLoading) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Loading gallery…
      </p>
    );
  }

  if (photos.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No photos yet — be the first to add one!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {photos.length} photo{photos.length === 1 ? "" : "s"}
        </p>

        <button
          type="button"
          onClick={async () => {
            const shareUrl = window.location.href;

            try {
              if (navigator.share) {
                await navigator.share({
                  title: "Event photos",
                  text: "Check out these event photos",
                  url: shareUrl,
                });
                return;
              }

              await navigator.clipboard.writeText(shareUrl);
            } catch {
              window.prompt("Copy this link:", shareUrl);
            }
          }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground"
        >
          Share
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => {
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => openPhoto(photo.id)}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />

              <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                <span>❤️</span>
                <span>{photo.reactionCount}</span>
              </span>
            </button>
          );
        })}
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={closePhoto}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-background shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closePhoto}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2 py-1 text-sm text-white"
            >
              ✕
            </button>

            <div className="absolute left-3 top-1/2 z-10 -translate-y-1/2">
              <button
                type="button"
                onClick={() => goToPhoto("prev")}
                className="rounded-full bg-black/60 px-3 py-2 text-lg text-white"
              >
                ‹
              </button>
            </div>

            <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2">
              <button
                type="button"
                onClick={() => goToPhoto("next")}
                className="rounded-full bg-black/60 px-3 py-2 text-lg text-white"
              >
                ›
              </button>
            </div>

            <div className="max-h-[90vh] overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto.url}
                alt=""
                className="h-auto max-h-[85vh] w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border bg-background p-3">
              <button
                type="button"
                onClick={() => toggleReaction(selectedPhoto.id)}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium"
              >
                <span>{likedPhotoIds.has(selectedPhoto.id) ? "❤️" : "🤍"}</span>
                <span>
                  {likedPhotoIds.has(selectedPhoto.id) ? "Liked" : "Like"}
                </span>
                <span className="text-muted-foreground">
                  {selectedPhoto.reactionCount}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
