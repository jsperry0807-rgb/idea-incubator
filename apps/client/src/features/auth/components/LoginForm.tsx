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
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}
    >
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
        <p style={{ color: "var(--color-danger)", fontSize: "0.875rem", margin: 0 }}>{error}</p>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting}
        style={{ backgroundColor: "var(--color-accent)", color: "#fff", borderColor: "var(--color-accent)" }}
      >
        {isSubmitting ? "…" : t("auth.login.submit")}
      </Button>

      <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", textAlign: "center", margin: 0 }}>
        {t("auth.login.noAccount")}{" "}
        <Link to={ROUTES.REGISTER} style={{ color: "var(--color-accent)" }}>
          {t("auth.login.registerLink")}
        </Link>
      </p>
    </form>
  );
}
