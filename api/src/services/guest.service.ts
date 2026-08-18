import { nanoid } from "nanoid";
import { prisma } from "../config/prisma";
import { UnauthorizedError } from "../utils/AppError";
import { signGuestToken, verifyGuestToken } from "./token.service";

export interface PublicGuest {
  id: string;
  name: string | null;
}

function toPublicGuest(guest: { id: string; name: string | null }): PublicGuest {
  return { id: guest.id, name: guest.name };
}

/**
 * Resumes an existing guest session if the cookie token is valid for this
 * event, otherwise creates a new anonymous guest. Always returns a usable
 * session — this endpoint is meant to be idempotent from the client's POV.
 */
export async function ensureGuestSession(
  eventId: string,
  existingToken: string | undefined,
  name: string | undefined
) {
  if (existingToken) {
    try {
      const payload = verifyGuestToken(existingToken);
      if (payload.eventId === eventId) {
        const guest = await prisma.guest.findUnique({ where: { id: payload.guestId } });
        if (guest) {
          if (name && !guest.name) {
            const updated = await prisma.guest.update({ where: { id: guest.id }, data: { name } });
            return { guest: toPublicGuest(updated), token: existingToken, isNew: false };
          }
          return { guest: toPublicGuest(guest), token: existingToken, isNew: false };
        }
      }
    } catch {
      // Invalid/expired token — fall through and create a fresh session.
    }
  }

  const guest = await prisma.guest.create({
    data: { eventId, name, sessionId: nanoid() },
  });
  const token = signGuestToken({ guestId: guest.id, eventId });
  return { guest: toPublicGuest(guest), token, isNew: true };
}

export async function updateGuestName(eventId: string, token: string, name: string) {
  let payload;
  try {
    payload = verifyGuestToken(token);
  } catch {
    throw new UnauthorizedError("No guest session found for this event");
  }

  if (payload.eventId !== eventId) {
    throw new UnauthorizedError("No guest session found for this event");
  }

  const guest = await prisma.guest.update({
    where: { id: payload.guestId },
    data: { name },
  });

  return toPublicGuest(guest);
}

/** Verifies a guest cookie token belongs to this event and returns the guest id. */
export async function verifyGuestForEvent(
  eventId: string,
  token: string | undefined
): Promise<string> {
  if (!token) {
    throw new UnauthorizedError("No guest session found for this event");
  }

  let payload;
  try {
    payload = verifyGuestToken(token);
  } catch {
    throw new UnauthorizedError("No guest session found for this event");
  }

  if (payload.eventId !== eventId) {
    throw new UnauthorizedError("No guest session found for this event");
  }

  return payload.guestId;
}
