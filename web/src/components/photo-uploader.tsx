"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { usePhotoUpload } from "@/lib/hooks/usePhotoUpload";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export function PhotoUploader({ slug }: { slug: string }) {
  const { items, addFiles, retry } = usePhotoUpload(slug);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = ""; // allow re-selecting the same file
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button onClick={() => inputRef.current?.click()} size="lg">
        📷 Add photos
      </Button>

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => (
            <div key={item.id} className="relative aspect-square overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-1 text-center text-[11px] text-white">
                {item.status === "pending" && "Waiting…"}
                {item.status === "uploading" && "Uploading…"}
                {item.status === "confirming" && "Finishing…"}
                {item.status === "done" && "✓ Uploaded"}
                {item.status === "error" && (
                  <button onClick={() => retry(item.id)} className="underline">
                    Failed — retry
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
