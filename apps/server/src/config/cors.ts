import type { CorsOptions } from "cors";

import { env } from "./env";

const allowedOrigins = new Set(env.CORS_ORIGINS);

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
