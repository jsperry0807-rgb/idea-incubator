import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    ACCESS_TOKEN_SECRET: z.string().min(32),
    REFRESH_TOKEN_SECRET: z.string().min(32),
    ACCESS_TOKEN_TTL: z.coerce.string().default('15m'),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
    RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(60),
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:5173')
      .transform((v) =>
        v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      ),
    STORAGE_PATH: z.string().default('./storage'),
    LLM_API_KEY: z.string().optional(),
    LLM_BASE_URL: z.string().url().optional(),
    LLM_MODEL: z.string().optional(),
    LLM_SYNTHESIS_MODEL: z.string().optional(),
    // Required in production: see services/mailer.service.ts. Absent in dev,
    // where the reset link is logged instead of mailed.
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().optional(),
  })
  // Equal secrets make the two token types interchangeable: anything holding a
  // refresh token could then present it as an access token and skip the 15m
  // expiry entirely.
  .refine((v) => v.ACCESS_TOKEN_SECRET !== v.REFRESH_TOKEN_SECRET, {
    message:
      'ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must differ; equal secrets let a refresh token act as an access token',
    path: ['REFRESH_TOKEN_SECRET'],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
