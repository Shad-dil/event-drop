import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { ConflictError, UnauthorizedError } from "../utils/AppError";
import { RegisterInput, LoginInput } from "../validators/auth.validators";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "./token.service";

const SALT_ROUNDS = 12;

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
}

function toPublicUser(user: { id: string; email: string; name: string | null }): PublicUser {
  return { id: user.id, email: user.email, name: user.name };
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
    },
  });

  return issueTokensFor(toPublicUser(user));
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  return issueTokensFor(toPublicUser(user));
}

export async function refreshSession(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Session expired, please log in again");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new UnauthorizedError("Session expired, please log in again");
  }

  return issueTokensFor(toPublicUser(user));
}

export async function getUserById(userId: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? toPublicUser(user) : null;
}

function issueTokensFor(user: PublicUser) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id });
  return { user, accessToken, refreshToken };
}
