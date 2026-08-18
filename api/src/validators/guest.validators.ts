import { z } from "zod";

export const createGuestSessionSchema = z.object({
  slug: z.string().trim().min(1, "Event slug is required"),
  name: z.string().trim().min(1).max(60).optional(),
});

export const updateGuestNameSchema = z.object({
  slug: z.string().trim().min(1, "Event slug is required"),
  name: z.string().trim().min(1, "Name is required").max(60),
});

export type CreateGuestSessionInput = z.infer<typeof createGuestSessionSchema>;
export type UpdateGuestNameInput = z.infer<typeof updateGuestNameSchema>;
