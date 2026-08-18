import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../utils/AppError";
import { ACCESS_COOKIE_NAME, verifyAccessToken } from "../services/token.service";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[ACCESS_COOKIE_NAME];

  if (!token) {
    return next(new UnauthorizedError("You must be logged in to do that"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new UnauthorizedError("Your session has expired, please log in again"));
  }
}
