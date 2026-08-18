"use client";

import { useCallback, useState } from "react";
import { apiClient, ApiError } from "@/lib/api-client";
import { Photo } from "@/lib/types";

export interface UploadItem {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "confirming" | "done" | "error";
  errorMessage?: string;
  photo?: Photo;
}

async function uploadFileToR2(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
}

/** Orchestrates presign → direct R2 PUT → confirm for one or more files. */
export function usePhotoUpload(slug: string) {
  const [items, setItems] = useState<UploadItem[]>([]);

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const uploadOne = useCallback(
    async (item: UploadItem) => {
      try {
        updateItem(item.id, { status: "uploading" });

        const { uploadUrl, objectKey } = await apiClient.post<{
          uploadUrl: string;
          objectKey: string;
        }>("/photos/presign", {
          slug,
          mimeType: item.file.type,
          size: item.file.size,
        });

        await uploadFileToR2(uploadUrl, item.file);

        updateItem(item.id, { status: "confirming" });

        const { photo } = await apiClient.post<{ photo: Photo }>("/photos", {
          slug,
          objectKey,
          mimeType: item.file.type,
          size: item.file.size,
        });

        updateItem(item.id, { status: "done", photo });
      } catch (err) {
        updateItem(item.id, {
          status: "error",
          errorMessage: err instanceof ApiError ? err.message : "Upload failed",
        });
      }
    },
    [slug, updateItem]
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const newItems: UploadItem[] = Array.from(files).map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: "pending",
      }));
      setItems((prev) => [...prev, ...newItems]);
      newItems.forEach((item) => uploadOne(item));
    },
    [uploadOne]
  );

  const retry = useCallback(
    (id: string) => {
      const item = items.find((it) => it.id === id);
      if (item) uploadOne(item);
    },
    [items, uploadOne]
  );

  return { items, addFiles, retry };
}
