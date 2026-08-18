import { prisma } from "../config/prisma";
import { NotFoundError } from "../utils/AppError";

/**
 * Toggles a guest's reaction on a photo (like tapping a heart on/off).
 * Only APPROVED photos in the given event can be reacted to.
 */
export async function toggleReaction(
  eventId: string,
  guestId: string,
  photoId: string,
  type: string
) {
  const photo = await prisma.photo.findFirst({
    where: { id: photoId, eventId, status: "APPROVED" },
  });
  if (!photo) {
    throw new NotFoundError("Photo not found");
  }

  const existing = await prisma.reaction.findUnique({
    where: { photoId_guestId_type: { photoId, guestId, type } },
  });

  let added: boolean;
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    added = false;
  } else {
    await prisma.reaction.create({ data: { photoId, guestId, type } });
    added = true;
  }

  const count = await prisma.reaction.count({ where: { photoId, type } });

  return { added, count };
}
