import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth/hooks/useAuth";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>{t("dashboard.title")}</h1>
          <p style={{ color: "var(--color-muted)", margin: "0.25rem 0 0" }}>
            {user ? `Signed in as ${user.name} (${user.email})` : ""}
          </p>
        </div>
        <button
          onClick={() => logout()}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius)",
            border: "1px solid var(--color-border)",
            background: "transparent",
            color: "var(--color-fg)",
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </header>
      <p style={{ color: "var(--color-muted)" }}>Your dashboard content will appear here.</p>
    </section>
  );
}
