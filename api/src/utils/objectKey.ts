import { nanoid } from "nanoid";

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export const ALLOWED_MIME_TYPES = Object.keys(EXTENSION_BY_MIME_TYPE);

export function extensionForMimeType(mimeType: string): string {
  return EXTENSION_BY_MIME_TYPE[mimeType] ?? "bin";
}

export function buildPhotoObjectKey(eventId: string, mimeType: string): string {
  return `events/${eventId}/${nanoid()}.${extensionForMimeType(mimeType)}`;
}

/** Guards against a guest confirming an objectKey that belongs to a different event. */
export function objectKeyBelongsToEvent(objectKey: string, eventId: string): boolean {
  return objectKey.startsWith(`events/${eventId}/`);
}
