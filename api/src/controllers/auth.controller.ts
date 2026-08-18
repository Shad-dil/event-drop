import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/AppError";
import { loginSchema, registerSchema } from "../validators/auth.validators";
import * as authService from "../services/auth.service";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  accessCookieOptions,
  refreshCookieOptions,
} from "../services/token.service";

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await authService.registerUser(input);
  setAuthCookies(res, accessToken, refreshToken);
  res.status(201).json({ success: true, data: { user } });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await authService.loginUser(input);
  setAuthCookies(res, accessToken, refreshToken);
  res.status(200).json({ success: true, data: { user } });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    throw new UnauthorizedError("Session expired, please log in again");
  }

  const { user, accessToken, refreshToken } = await authService.refreshSession(token);
  setAuthCookies(res, accessToken, refreshToken);
  res.status(200).json({ success: true, data: { user } });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie(ACCESS_COOKIE_NAME, { path: accessCookieOptions.path });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: refreshCookieOptions.path });
  res.status(200).json({ success: true, data: { loggedOut: true } });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError("You must be logged in to do that");
  }
  const user = await authService.getUserById(req.user.id);
  if (!user) {
    throw new UnauthorizedError("Account no longer exists");
  }
  res.status(200).json({ success: true, data: { user } });
});
