import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ROUTES } from "@config/routes";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export default function RegisterPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        gap: "0.5rem",
      }}
    >
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>{t("auth.register.title")}</h1>
      <p style={{ color: "var(--color-muted)", margin: "0 0 1.5rem" }}>{t("auth.register.subtitle")}</p>
      <div style={{ width: "100%", maxWidth: "24rem" }}>
        <RegisterForm />
      </div>
    </section>
  );
}
