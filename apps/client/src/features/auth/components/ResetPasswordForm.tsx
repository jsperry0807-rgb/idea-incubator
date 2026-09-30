import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Button, Input } from "@repo/ui";
import { passwordSchema } from "@repo/shared";
import { ROUTES } from "@config/routes";
import { resetPasswordRequest } from "../api/auth";

type PasswordErrorKey =
  | "auth.register.passwordLength"
  | "auth.register.passwordLowercase"
  | "auth.register.passwordUppercase"
  | "auth.register.passwordNumber";

const passwordIssueMessages: Record<string, PasswordErrorKey> = {
  "Password must contain a lowercase letter": "auth.register.passwordLowercase",
  "Password must contain an uppercase letter": "auth.register.passwordUppercase",
  "Password must contain a number": "auth.register.passwordNumber",
};

function passwordErrorKey(issue: { code: string; message: string }): PasswordErrorKey {
  return passwordIssueMessages[issue.message] ?? "auth.register.passwordLength";
}

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { t } = useTranslation();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setError(t(passwordErrorKey(passwordResult.error.issues[0])));
      return;
    }

    if (password !== confirm) {
      setError(t("auth.reset.mismatch"));
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPasswordRequest({ token, password });
      setIsDone(true);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(
        status === 401 ? t("auth.reset.expired") : t("auth.reset.genericError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isDone) {
    return (
      <div className="flex flex-col gap-3">
        <p className="m-0 text-sm text-[var(--color-fg)]">
          {t("auth.reset.successMessage")}
        </p>
        <p className="m-0 text-center text-sm text-[var(--color-muted)]">
          <Link to={ROUTES.LOGIN}>{t("auth.reset.backToLogin")}</Link>
        </p>
      </div>
    );
  }

  return (
    <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
      <Input
        name="password"
        type="password"
        label={t("auth.reset.password")}
        placeholder={t("auth.reset.passwordPlaceholder")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        required
      />
      <Input
        name="confirm"
        type="password"
        label={t("auth.reset.confirm")}
        placeholder={t("auth.reset.confirmPlaceholder")}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
        required
      />

      {error ? (
        <p className="m-0 text-sm text-[var(--color-danger)]">{error}</p>
      ) : null}

      <Button type="submit" isLoading={isSubmitting}>
        {t("auth.reset.submit")}
      </Button>
    </form>
  );
}