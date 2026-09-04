import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { formatUptime } from "@repo/shared";
import type { ApiEnvelope, HealthResponse } from "@repo/shared";

import { env } from "./config/env";
import { corsOptions } from "./config/cors";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { globalRateLimit } from "./middleware/rateLimit";

const app = express();
const PORT = env.PORT;

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(globalRateLimit);

app.get(
  "/health",
  (_req, res: express.Response<ApiEnvelope<HealthResponse>>) => {
    res.json({
      data: {
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      meta: { uptimeFormatted: formatUptime(process.uptime()) },
    });
  },
);

app.use("/", routes);

app.use((_req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server]: listening on http://localhost:${PORT}`);
});
