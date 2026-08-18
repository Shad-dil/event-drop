"use client";

import { useLiveGallery } from "@/lib/hooks/useLiveGallery";

export function PhotoGallery({ slug, eventId }: { slug: string; eventId?: string }) {
  const { photos, isLoading, likedPhotoIds, toggleReaction } = useLiveGallery(slug, eventId);

  if (isLoading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Loading gallery…</p>;
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
      <p className="text-sm text-muted-foreground">
        {photos.length} photo{photos.length === 1 ? "" : "s"}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => {
          const liked = likedPhotoIds.has(photo.id);
          return (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              <button
                onClick={() => toggleReaction(photo.id)}
                className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm transition-transform active:scale-95"
                aria-label={liked ? "Remove reaction" : "React with heart"}
              >
                <span className={liked ? "" : "opacity-70"}>{liked ? "❤️" : "🤍"}</span>
                {photo.reactionCount > 0 && <span>{photo.reactionCount}</span>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
