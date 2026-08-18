import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { confirmUploadSchema, presignUploadSchema } from "../validators/photo.validators";
import { toggleReactionSchema } from "../validators/reaction.validators";
import * as photoService from "../services/photo.service";
import * as reactionService from "../services/reaction.service";
import * as eventService from "../services/event.service";
import * as guestService from "../services/guest.service";
import { guestCookieName } from "../services/token.service";
import { getIO } from "../sockets";

export const presignUpload = asyncHandler(async (req: Request, res: Response) => {
  const input = presignUploadSchema.parse(req.body);
  const event = await eventService.getPublicEventBySlug(input.slug);

  const token = req.cookies?.[guestCookieName(event.id)];
  await guestService.verifyGuestForEvent(event.id, token); // throws if no valid session

  const { uploadUrl, objectKey } = await photoService.createPresignedUpload(
    event.id,
    input.mimeType,
    input.size
  );

  res.status(200).json({ success: true, data: { uploadUrl, objectKey } });
});

export const confirmUpload = asyncHandler(async (req: Request, res: Response) => {
  const input = confirmUploadSchema.parse(req.body);
  const event = await eventService.getPublicEventBySlug(input.slug);

  const token = req.cookies?.[guestCookieName(event.id)];
  const guestId = await guestService.verifyGuestForEvent(event.id, token);

  const photo = await photoService.confirmUpload(event.id, guestId, {
    objectKey: input.objectKey,
    mimeType: input.mimeType,
    size: input.size,
  });

  // Only broadcast to the live gallery once a photo is actually visible —
  // pending (moderated) photos stay invisible until an organizer approves them.
  if (photo.status === "APPROVED") {
    try {
      getIO().to(`event:${event.id}`).emit("photo:new", photo);
    } catch {
      // Socket.IO not initialized (e.g. in a test context) — safe to ignore.
    }
  }

  res.status(201).json({ success: true, data: { photo } });
});

export const toggleReaction = asyncHandler(async (req: Request, res: Response) => {
  const photoId = req.params.photoId as string;
  const { slug, type } = toggleReactionSchema.parse(req.body);
  const event = await eventService.getPublicEventBySlug(slug);

  const token = req.cookies?.[guestCookieName(event.id)];
  const guestId = await guestService.verifyGuestForEvent(event.id, token);

  const result = await reactionService.toggleReaction(event.id, guestId, photoId, type);

  try {
    getIO().to(`event:${event.id}`).emit("reaction:update", {
      photoId,
      type,
      count: result.count,
    });
  } catch {
    // Socket.IO not initialized (e.g. in a test context) — safe to ignore.
  }

  res.status(200).json({ success: true, data: result });
});
