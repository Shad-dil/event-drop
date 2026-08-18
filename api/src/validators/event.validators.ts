import { z } from "zod";

export const createEventSchema = z.object({
  name: z.string().trim().min(1, "Event name is required").max(100),
  description: z.string().trim().max(1000).optional(),
  eventDate: z.coerce.date().optional(),
  autoApprove: z.boolean().optional().default(true),
});

export const updateEventSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  eventDate: z.coerce.date().nullable().optional(),
  coverImageKey: z.string().nullable().optional(),
  autoApprove: z.boolean().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
