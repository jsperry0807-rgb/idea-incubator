import type { NextFunction, Request, Response } from "express";

import { UnauthorizedError } from "../lib/errors";
import { validateAccessToken } from "../services/auth.service";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    next(new UnauthorizedError("Missing or invalid authorization header"));
    return;
  }

  const token = header.slice(7);

  try {
    const payload = await validateAccessToken(token);
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}
