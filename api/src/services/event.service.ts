import { prisma } from "../config/prisma";
import { NotFoundError } from "../utils/AppError";
import { buildSlugCandidate } from "../utils/slugify";
import { CreateEventInput, UpdateEventInput } from "../validators/event.validators";

const MAX_SLUG_ATTEMPTS = 5;

async function generateUniqueSlug(name: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const candidate = buildSlugCandidate(name);
    const existing = await prisma.event.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
  }
  // Astronomically unlikely with a 6-char alphanumeric suffix, but fail loudly
  // rather than silently create a colliding event.
  throw new Error("Could not generate a unique event slug, please try again");
}

export async function createEvent(organizerId: string, input: CreateEventInput) {
  const slug = await generateUniqueSlug(input.name);

  return prisma.event.create({
    data: {
      slug,
      name: input.name,
      description: input.description,
      eventDate: input.eventDate,
      autoApprove: input.autoApprove ?? true,
      organizerId,
    },
  });
}

export async function listEventsForOrganizer(organizerId: string) {
  return prisma.event.findMany({
    where: { organizerId },
    orderBy: { createdAt: "desc" },
  });
}

/** Fetches an event for its owner. Returns 404 (not 403) if not owned, to avoid leaking existence. */
export async function getEventForOrganizer(eventId: string, organizerId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, organizerId } });
  if (!event) throw new NotFoundError("Event not found");
  return event;
}

/** Public lookup for guests scanning a QR code — no organizer-only fields exposed. */
export async function getPublicEventBySlug(slug: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      eventDate: true,
      coverImageKey: true,
      createdAt: true,
    },
  });
  if (!event) throw new NotFoundError("Event not found");
  return event;
}

export async function updateEvent(
  eventId: string,
  organizerId: string,
  input: UpdateEventInput
) {
  await getEventForOrganizer(eventId, organizerId); // ownership check, 404s if not owner

  return prisma.event.update({
    where: { id: eventId },
    data: input,
  });
}

export async function deleteEvent(eventId: string, organizerId: string) {
  await getEventForOrganizer(eventId, organizerId); // ownership check, 404s if not owner
  await prisma.event.delete({ where: { id: eventId } });
}
