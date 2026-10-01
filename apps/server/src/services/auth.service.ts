import { createHash, randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

import prisma from '../lib/prisma';
import { env } from '../config/env';
import { ConflictError, NotFoundError, UnauthorizedError } from '../lib/errors';
import { sendPasswordResetEmail } from './mailer.service';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../lib/jwt';
import type { AccessTokenPayload, RefreshTokenPayload } from '../lib/jwt';

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

const REFRESH_TOKEN_COOKIE = 'refresh_token';

const DEFAULT_TAGS: Array<{ name: string; color: string }> = [
  { name: 'Frontend', color: '#3b82f6' },
  { name: 'Backend', color: '#ef4444' },
  { name: 'Full-stack', color: '#8b5cf6' },
  { name: 'Mobile', color: '#10b981' },
  { name: 'API', color: '#f59e0b' },
  { name: 'Database', color: '#06b6d4' },
  { name: 'DevOps', color: '#6366f1' },
  { name: 'UI/UX', color: '#ec4899' },
  { name: 'AI', color: '#a855f7' },
  { name: 'MVP', color: '#84cc16' },
];

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

async function ensureDefaultTags(userId: string, tagService = prisma.tag) {
  const existing = await tagService.findMany({
    where: { userId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((tag) => tag.name));
  const missing = DEFAULT_TAGS.filter((tag) => !existingNames.has(tag.name));
  if (missing.length > 0) {
    await tagService.createMany({
      data: missing.map((tag) => ({ ...tag, userId })),
    });
  }
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      authProvider: 'LOCAL',
      tags: {
        create: DEFAULT_TAGS,
      },
    },
    include: { tags: true },
  });

  const tokens = await createSession(user.id, user.email);
  return { user: toPublicUser(user), ...tokens };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const tokens = await createSession(user.id, user.email);
  await ensureDefaultTags(user.id);
  return { user: toPublicUser(user), ...tokens };
}

export async function refresh(refreshToken: string | undefined) {
  if (!refreshToken) {
    throw new UnauthorizedError('Missing refresh token');
  }

  let payload: RefreshTokenPayload;
  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const consumed = await prisma.refreshToken.deleteMany({
    where: {
      tokenHash: digest(refreshToken),
      expiresAt: { gt: new Date() },
    },
  });

  if (consumed.count !== 1) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
  });
  const newRefreshToken = await persistRefreshToken(user.id);

  return {
    accessToken,
    expiresIn: 900,
    refreshToken: newRefreshToken,
  };
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }
  await ensureDefaultTags(userId);
  return toPublicUser(user);
}

export async function updateProfile(
  userId: string,
  input: { name?: string; avatarUrl?: string | null }
) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new NotFoundError('User not found');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    },
  });

  return toPublicUser(user);
}

export async function deleteAccount(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (!user.passwordHash) {
    throw new UnauthorizedError('Password is required to delete this account');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Incorrect password');
  }

  await prisma.user.delete({ where: { id: userId } });
}

export async function logout(refreshToken: string | undefined) {
  if (refreshToken) {
    await prisma.refreshToken
      .deleteMany({ where: { tokenHash: digest(refreshToken) } })
      .catch(() => {});
  }
}

export function getRefreshTokenCookieName() {
  return REFRESH_TOKEN_COOKIE;
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (user?.passwordHash) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + env.RESET_TOKEN_TTL_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: digest(token),
        expiresAt,
      },
    });

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail({ to: user.email, resetUrl });
  }

  return { sent: true };
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = digest(token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  const isExpired = !resetToken || resetToken.expiresAt <= new Date();
  const isUsed = !!resetToken?.usedAt;
  if (isExpired || isUsed) {
    throw new UnauthorizedError('Invalid or expired reset link');
  }

  const user = resetToken.user;
  if (!user.passwordHash) {
    throw new UnauthorizedError(
      'This account does not use a password. Sign in with your provider instead.'
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
  ]);

  return { ok: true };
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
  email: string
): Promise<TokenPair & { refreshToken: string }> {
  const accessToken = await signAccessToken({ sub: userId, email });
  const refreshToken = await persistRefreshToken(userId);
  return { accessToken, expiresIn: 900, refreshToken };
}

async function persistRefreshToken(userId: string): Promise<string> {
  const refreshToken = await signRefreshToken({
    sub: userId,
    jti: randomUUID(),
  });

  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: digest(refreshToken),
      expiresAt,
    },
  });

  return refreshToken;
}
