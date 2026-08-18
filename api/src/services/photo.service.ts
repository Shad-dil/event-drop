import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET } from "../config/r2";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { BadRequestError, NotFoundError } from "../utils/AppError";
import {
  buildPhotoObjectKey,
  objectKeyBelongsToEvent,
} from "../utils/objectKey";

const PRESIGN_EXPIRY_SECONDS = 5 * 60; // 5 minutes — plenty of time to complete a direct upload

export async function createPresignedUpload(
  eventId: string,
  mimeType: string,
  size: number,
) {
  if (!R2_BUCKET) {
    throw new BadRequestError(
      "Photo uploads are not configured. Set R2_BUCKET_NAME in api/.env before uploading images.",
    );
  }

  const objectKey = buildPhotoObjectKey(eventId, mimeType);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: objectKey,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn: PRESIGN_EXPIRY_SECONDS,
  });

  return { uploadUrl, objectKey };
}

interface PhotoRecord {
  id: string;
  eventId: string;
  guestId: string;
  objectKey: string;
  mimeType: string;
  size: number;
  status: string;
  createdAt: Date;
  _count?: { reactions: number };
}

export async function listApprovedPhotos(eventId: string) {
  const photos = await prisma.photo.findMany({
    where: { eventId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { reactions: true } } },
  });

  return photos.map((photo: PhotoRecord) => ({
    id: photo.id,
    eventId: photo.eventId,
    guestId: photo.guestId,
    objectKey: photo.objectKey,
    mimeType: photo.mimeType,
    size: photo.size,
    status: photo.status,
    createdAt: photo.createdAt,
    url: `${env.R2_PUBLIC_URL}/${photo.objectKey}`,
    reactionCount: photo._count?.reactions ?? 0,
  }));
}

export async function confirmUpload(
  eventId: string,
  guestId: string,
  input: { objectKey: string; mimeType: string; size: number },
) {
  if (!objectKeyBelongsToEvent(input.objectKey, eventId)) {
    throw new BadRequestError("This upload does not belong to this event");
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new NotFoundError("Event not found");
  }

  // Confirm the object actually landed in R2 before trusting the metadata —
  // guests could otherwise POST fabricated objectKeys with no real upload.
  try {
    await r2Client.send(
      new HeadObjectCommand({ Bucket: R2_BUCKET, Key: input.objectKey }),
    );
  } catch {
    throw new BadRequestError(
      "We couldn't find that upload — please try again",
    );
  }

  const photo = await prisma.photo.create({
    data: {
      eventId,
      guestId,
      objectKey: input.objectKey,
      mimeType: input.mimeType,
      size: input.size,
      status: event.autoApprove ? "APPROVED" : "PENDING",
    },
  });

  return {
    ...photo,
    url: `${env.R2_PUBLIC_URL}/${photo.objectKey}`,
    reactionCount: 0,
  };
}
