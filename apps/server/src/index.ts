import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { formatUptime } from '@repo/shared';
import type { ApiEnvelope, HealthResponse } from '@repo/shared';

import { env } from './config/env';
import { assertMailerConfigured } from './services/mailer.service';
import { corsOptions } from './config/cors';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { globalRateLimit } from './middleware/rateLimit';

// Fail at boot rather than serving a reset request that can never be honoured.
assertMailerConfigured();

const app = express();
const PORT = env.PORT;

app.use(helmet());
app.use(cors(corsOptions));

// Behind a load balancer every request arrives with the proxy's IP, so rate
// limiting without this puts the whole user base in one bucket — and
// express-rate-limit's validation rejects the mismatched X-Forwarded-For with
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR. `1` trusts exactly one hop, which is the
// usual single-proxy deployment; trusting more would let a client spoof its way
// to a fresh bucket.
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(globalRateLimit);

app.get('/health', (_req, res: express.Response<ApiEnvelope<HealthResponse>>) => {
  res.json({
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    meta: { uptimeFormatted: formatUptime(process.uptime()) },
  });
});

app.use('/', routes);

app.use((_req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server]: listening on http://localhost:${PORT}`);
});
