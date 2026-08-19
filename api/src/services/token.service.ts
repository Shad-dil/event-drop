import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
}

export interface RefreshTokenPayload {
  sub: string; // user id
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

/** Cookie options shared by both tokens; refresh is scoped to /api/auth. */
export const accessCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  maxAge: 15 * 60 * 1000,
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/api/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export const ACCESS_COOKIE_NAME = "eventdrop_access";
export const REFRESH_COOKIE_NAME = "eventdrop_refresh";

// ── Guest sessions ──────────────────────────────────────────────────────
// Guests never log in. Each event gets its own cookie (keyed by event id) so
// the same browser can hold separate anonymous identities across multiple
// events without them colliding.

export interface GuestTokenPayload {
  guestId: string;
  eventId: string;
}

export function signGuestToken(payload: GuestTokenPayload): string {
  return jwt.sign(payload, env.GUEST_SESSION_SECRET, {
    expiresIn: "180d",
  } as SignOptions);
}

export function verifyGuestToken(token: string): GuestTokenPayload {
  return jwt.verify(token, env.GUEST_SESSION_SECRET) as GuestTokenPayload;
}

export function guestCookieName(eventId: string): string {
  return `eg_${eventId}`;
}

export const guestCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 180 * 24 * 60 * 60 * 1000, // 180 days
};
