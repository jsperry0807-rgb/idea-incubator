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
    <section className="page-container flex min-h-[70vh] flex-col items-center justify-center gap-2">
      <h1 className="m-0 text-[1.75rem] font-extrabold text-[var(--color-fg)]">
        {t("auth.register.title")}
      </h1>
      <p className="mb-6 m-0 text-[var(--color-muted)]">{t("auth.register.subtitle")}</p>
      <div className="w-full max-w-sm">
        <RegisterForm />
      </div>
    </section>
  );
}
