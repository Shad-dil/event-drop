import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/AppError";
import { createEventSchema, updateEventSchema } from "../validators/event.validators";
import * as eventService from "../services/event.service";
import * as photoService from "../services/photo.service";

function requireUser(req: Request) {
  if (!req.user) throw new UnauthorizedError("You must be logged in to do that");
  return req.user;
}

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const input = createEventSchema.parse(req.body);
  const event = await eventService.createEvent(user.id, input);
  res.status(201).json({ success: true, data: { event } });
});

export const listMyEvents = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const events = await eventService.listEventsForOrganizer(user.id);
  res.status(200).json({ success: true, data: { events } });
});

export const getMyEvent = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const event = await eventService.getEventForOrganizer(req.params.id as string, user.id);
  res.status(200).json({ success: true, data: { event } });
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const input = updateEventSchema.parse(req.body);
  const event = await eventService.updateEvent(req.params.id as string, user.id, input);
  res.status(200).json({ success: true, data: { event } });
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  await eventService.deleteEvent(req.params.id as string, user.id);
  res.status(200).json({ success: true, data: { deleted: true } });
});

export const getPublicEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await eventService.getPublicEventBySlug(req.params.slug as string);
  res.status(200).json({ success: true, data: { event } });
});

export const getPublicEventPhotos = asyncHandler(async (req: Request, res: Response) => {
  const event = await eventService.getPublicEventBySlug(req.params.slug as string);
  const photos = await photoService.listApprovedPhotos(event.id);
  res.status(200).json({ success: true, data: { photos } });
});
