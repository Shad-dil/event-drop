import { z } from "zod";

export const toggleReactionSchema = z.object({
  slug: z.string().trim().min(1, "Event slug is required"),
  type: z.enum(["heart"]).optional().default("heart"),
});

export type ToggleReactionInput = z.infer<typeof toggleReactionSchema>;
