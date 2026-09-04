import { Router, type Response } from "express";
import { z } from "zod";

import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { authRateLimit } from "../middleware/rateLimit";
import {
  login,
  logout,
  me,
  refresh,
  register,
  getRefreshTokenCookieName,
} from "../services/auth.service";
import { env } from "../config/env";

const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const router = Router();

router.use(authRateLimit);

const COOKIE_NAME = getRefreshTokenCookieName();

function setRefreshCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const result = await register(req.body);
    setRefreshCookie(res, result.refreshToken);
    res.status(201).json({
      data: {
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const result = await login(req.body);
    setRefreshCookie(res, result.refreshToken);
    res.json({
      data: {
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const result = await refresh(req.cookies?.[COOKIE_NAME]);
    setRefreshCookie(res, result.refreshToken);
    res.json({
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    await logout(req.cookies?.[COOKIE_NAME]);
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    res.json({ data: await me(req.userId!) });
  } catch (err) {
    next(err);
  }
});

export default router;
