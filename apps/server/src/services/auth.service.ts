import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

import prisma from "../lib/prisma";
import { env } from "../config/env";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../lib/errors";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../lib/jwt";
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from "../lib/jwt";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  expiresIn: number;
}

const REFRESH_TOKEN_COOKIE = "refresh_token";

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      authProvider: "LOCAL",
    },
  });

  const tokens = await createSession(user.id, user.email);
  return { user: toPublicUser(user), ...tokens };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user || !user.passwordHash) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const tokens = await createSession(user.id, user.email);
  return { user: toPublicUser(user), ...tokens };
}

export async function refresh(refreshToken: string | undefined) {
  if (!refreshToken) {
    throw new UnauthorizedError("Missing refresh token");
  }

  let payload: RefreshTokenPayload;
  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
  });
  const newRefreshToken = await persistRefreshToken(user.id, refreshToken);

  return {
    accessToken,
    expiresIn: 900,
    refreshToken: newRefreshToken,
  };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return toPublicUser(user);
}

export async function logout(refreshToken: string | undefined) {
  if (refreshToken) {
    await prisma.refreshToken
      .deleteMany({ where: { token: refreshToken } })
      .catch(() => {});
  }
}

export function getRefreshTokenCookieName() {
  return REFRESH_TOKEN_COOKIE;
}

export async function validateAccessToken(token: string): Promise<AccessTokenPayload> {
  return verifyAccessToken(token);
}

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

async function createSession(
  userId: string,
  email: string,
): Promise<TokenPair & { refreshToken: string }> {
  const accessToken = await signAccessToken({ sub: userId, email });
  const refreshToken = await persistRefreshToken(userId);
  return { accessToken, expiresIn: 900, refreshToken };
}

async function persistRefreshToken(
  userId: string,
  oldToken?: string,
): Promise<string> {
  const refreshToken = await signRefreshToken({
    sub: userId,
    jti: randomUUID(),
  });

  const expiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt,
    },
  });

  if (oldToken) {
    await prisma.refreshToken
      .deleteMany({ where: { token: oldToken } })
      .catch(() => {});
  }

  return refreshToken;
}
