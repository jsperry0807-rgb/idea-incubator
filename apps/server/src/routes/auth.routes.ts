import { Router, type Router as RouterType, type Response } from "express";
import {
  deleteAccountSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "@repo/shared";

import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { authRateLimit } from "../middleware/rateLimit";
import {
  deleteAccount,
  login,
  logout,
  me,
  refresh,
  register,
  updateProfile,
  getRefreshTokenCookieName,
} from "../services/auth.service";
import { env } from "../config/env";

const router: RouterType = Router();

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

router.post("/register", authRateLimit, validate(registerSchema), async (req, res, next) => {
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

router.post("/login", authRateLimit, validate(loginSchema), async (req, res, next) => {
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

router.patch("/me", authenticate, validate(updateProfileSchema), async (req, res, next) => {
  try {
    res.json({ data: await updateProfile(req.userId!, req.body) });
  } catch (err) {
    next(err);
  }
});

router.delete("/me", authenticate, validate(deleteAccountSchema), async (req, res, next) => {
  try {
    await deleteAccount(req.userId!, req.body.password);
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
