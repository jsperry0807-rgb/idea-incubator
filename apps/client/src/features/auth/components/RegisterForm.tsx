import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { Button, Input } from "@repo/ui";
import { ROUTES } from "@config/routes";
import { useAuth } from "../hooks/useAuth";
import { authErrorMessage } from "@utils/errors";

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

    if (password.length < 8) {
      setError(t("auth.register.passwordInvalid"));
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
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}
    >
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
        <p style={{ color: "var(--color-danger)", fontSize: "0.875rem", margin: 0 }}>{error}</p>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting}
        style={{ backgroundColor: "var(--color-accent)", color: "#fff", borderColor: "var(--color-accent)" }}
      >
        {isSubmitting ? "…" : t("auth.register.submit")}
      </Button>

      <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", textAlign: "center", margin: 0 }}>
        {t("auth.register.hasAccount")}{" "}
        <Link to={ROUTES.LOGIN} style={{ color: "var(--color-accent)" }}>
          {t("auth.register.loginLink")}
        </Link>
      </p>
    </form>
  );
}
