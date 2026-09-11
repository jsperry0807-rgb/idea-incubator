import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { Button, Input } from "@repo/ui";
import { passwordSchema } from "@repo/shared";
import { ROUTES } from "@config/routes";
import { useAuth } from "../hooks/useAuth";
import { authErrorMessage } from "@utils/errors";

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

export function RegisterForm() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setError(t(passwordErrorKey(passwordResult.error.issues[0])));
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ name, email, password });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err, t));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
      <Input
        name="name"
        type="text"
        label={t("auth.register.name")}
        placeholder={t("auth.register.namePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
        required
      />
      <Input
        name="email"
        type="email"
        label={t("auth.register.email")}
        placeholder={t("auth.register.emailPlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <Input
        name="password"
        type="password"
        label={t("auth.register.password")}
        placeholder={t("auth.register.passwordPlaceholder")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        required
      />

      {error ? (
        <p className="m-0 text-sm text-[var(--color-danger)]">{error}</p>
      ) : null}

      <Button type="submit" isLoading={isSubmitting}>
        {t("auth.register.submit")}
      </Button>

      <p className="m-0 text-center text-sm text-[var(--color-muted)]">
        {t("auth.register.hasAccount")}{" "}
        <Link to={ROUTES.LOGIN}>{t("auth.register.loginLink")}</Link>
      </p>
    </form>
  );
}
