import { env } from "../config/env";

const isProduction = env.NODE_ENV === "production";

export interface SendPasswordResetEmailInput {
  to: string;
  resetUrl: string;
}

/**
 * Delivers password reset emails.
 *
 * Dev mode: logs the reset link to the server console so the flow is
 * testable without SMTP. Production: emits a clear console warning so the
 * app never silently pretends an email was sent. Swap in an SMTP/provider
 * transport behind this function when credentials are available.
 */
export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput) {
  const { to, resetUrl } = input;

  if (isProduction) {
    console.warn(
      `[mailer] No SMTP transport configured — password reset for ${to} NOT emailed. ` +
        `Reset URL: ${resetUrl}`,
    );
    return;
  }

  console.log(
    `\n[mailer:dev] Password reset for ${to}\n` +
      `  Reset link (valid ${env.RESET_TOKEN_TTL_MINUTES} min): ${resetUrl}\n`,
  );
}