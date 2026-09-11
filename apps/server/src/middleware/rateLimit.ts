import rateLimit from "express-rate-limit";

import { env } from "../config/env";

const isDev = env.NODE_ENV === "development";

export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDev ? 2000 : 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDev ? 200 : 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
