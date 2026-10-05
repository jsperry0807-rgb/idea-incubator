import { Prisma } from '../generated/prisma/client';

import { ConflictError, NotFoundError } from './errors';

/** Prisma's unique-constraint violation. */
export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

function isMissingRow(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025';
}

/**
 * Routes a Prisma constraint failure to the right 4xx instead of letting it
 * reach the client as a 500.
 *
 * Services used to pre-check a condition and then write it, which is a race:
 * two concurrent requests can both pass the check, and the loser's write fails
 * here. The pre-checks are kept where they give a better error message, but the
 * database is the real arbiter, so every write funnels through this.
 *
 * Never swallows the error: anything not recognised is rethrown untouched.
 */
export function translatePrismaError(err: unknown): never {
  if (isUniqueViolation(err)) {
    throw new ConflictError('That value is already taken');
  }
  if (isMissingRow(err)) {
    throw new NotFoundError();
  }
  throw err;
}

/**
 * Runs a write, translating constraint failures.
 *
 * Exists so the translation cannot be forgotten at a call site: forgetting it is
 * exactly how a check-then-act race surfaced as a 500 in the first place.
 */
export async function withPrismaErrors<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (err) {
    translatePrismaError(err);
  }
}
