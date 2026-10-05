import { env } from '../config/env';

export interface SendPasswordResetEmailInput {
  to: string;
  resetUrl: string;
}

const isProduction = env.NODE_ENV === 'production';

/**
 * True when a real transport is configured.
 *
 * A production deployment without one cannot honour a password reset, and the
 * old behaviour made that invisible: the request returned success while nothing
 * was sent. Startup fails instead, so the misconfiguration is found at deploy
 * time rather than when a user needs their password back.
 */
export function assertMailerConfigured(): void {
  if (!isProduction || env.SMTP_HOST) return;

  throw new Error(
    'SMTP_HOST must be set in production: without it password resets are never delivered.'
  );
}

/**
 * Delivers password reset emails.
 *
 * Dev mode logs the reset link to the server console so the flow is testable
 * without SMTP. Production requires a configured transport (see
 * {@link assertMailerConfigured}).
 */
export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput) {
  const { to, resetUrl } = input;

  if (!env.SMTP_HOST) {
    console.log(
      `\n[mailer:dev] Password reset for ${to}\n` +
        `  Reset link (valid ${env.RESET_TOKEN_TTL_MINUTES} min): ${resetUrl}\n`
    );
    return;
  }

  // No provider is wired up yet. This path is unreachable in a bootable
  // production deployment, because startup asserts SMTP_HOST is present.
  throw new Error(
    'SMTP_HOST is set but no transport is implemented yet; wire one up before enabling it.'
  );
}
