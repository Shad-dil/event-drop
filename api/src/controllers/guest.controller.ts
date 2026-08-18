import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/AppError";
import { createGuestSessionSchema, updateGuestNameSchema } from "../validators/guest.validators";
import * as guestService from "../services/guest.service";
import * as eventService from "../services/event.service";
import { guestCookieName, guestCookieOptions } from "../services/token.service";

export const createOrResumeSession = asyncHandler(async (req: Request, res: Response) => {
  const { slug, name } = createGuestSessionSchema.parse(req.body);
  const event = await eventService.getPublicEventBySlug(slug);

  const cookieName = guestCookieName(event.id);
  const existingToken = req.cookies?.[cookieName];

  const { guest, token, isNew } = await guestService.ensureGuestSession(
    event.id,
    existingToken,
    name
  );

  res.cookie(cookieName, token, guestCookieOptions);
  res.status(isNew ? 201 : 200).json({ success: true, data: { guest, event } });
});

export const updateName = asyncHandler(async (req: Request, res: Response) => {
  const { slug, name } = updateGuestNameSchema.parse(req.body);
  const event = await eventService.getPublicEventBySlug(slug);

  const cookieName = guestCookieName(event.id);
  const token = req.cookies?.[cookieName];

  if (!token) {
    throw new UnauthorizedError("No guest session found for this event");
  }

  const guest = await guestService.updateGuestName(event.id, token, name);
  res.status(200).json({ success: true, data: { guest } });
});
