import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button, Input } from "@repo/ui";
import { ROUTES } from "@config/routes";
import { useAuth } from "../hooks/useAuth";
import { authErrorMessage } from "@utils/errors";

export function LoginForm() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? ROUTES.DASHBOARD;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err, t));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
      <Input
        name="email"
        type="email"
        label={t("auth.login.email")}
        placeholder={t("auth.login.emailPlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <Input
        name="password"
        type="password"
        label={t("auth.login.password")}
        placeholder={t("auth.login.passwordPlaceholder")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />

      {error ? (
        <p className="m-0 text-sm text-[var(--color-danger)]">{error}</p>
      ) : null}

      <Button type="submit" isLoading={isSubmitting}>
        {t("auth.login.submit")}
      </Button>

      <p className="m-0 text-center text-sm text-[var(--color-muted)]">
        {t("auth.login.noAccount")}{" "}
        <Link to={ROUTES.REGISTER}>{t("auth.login.registerLink")}</Link>
      </p>
    </form>
  );
}
