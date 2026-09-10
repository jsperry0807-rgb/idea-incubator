import { useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NotificationBell } from "@features/notifications/components/NotificationBell";
import { NotificationPanel } from "@features/notifications/components/NotificationPanel";
import { ROUTES } from "@config/routes";
import { LanguageSwitcher } from "@components/layout/LanguageSwitcher";
import { useAuth } from "@features/auth/hooks/useAuth";

export default function RootLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationAnchorRef = useRef<HTMLSpanElement>(null);
  const isHome = location.pathname === ROUTES.HOME;
  const isIdeas = location.pathname === ROUTES.IDEAS || location.pathname.startsWith(`${ROUTES.IDEAS}/`);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 2rem",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <Link
          to={ROUTES.HOME}
          style={{
            fontWeight: 700,
            fontSize: "1.125rem",
            color: "var(--color-fg)",
            textDecoration: "none",
          }}
        >
          {t("app.name")}
        </Link>
        <nav style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <Link
            to={ROUTES.HOME}
            style={{
              color: isHome ? "var(--color-fg)" : "var(--color-muted)",
              fontWeight: isHome ? 600 : 400,
              textDecoration: "none",
            }}
          >
            {t("app.nav.home")}
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to={ROUTES.IDEAS}
                style={{
                  color: isIdeas ? "var(--color-fg)" : "var(--color-muted)",
                  fontWeight: isIdeas ? 600 : 400,
                  textDecoration: "none",
                }}
              >
                {t("app.nav.ideas")}
              </Link>
              <Link
                to={ROUTES.ROADMAP}
                style={{
                  color: location.pathname === ROUTES.ROADMAP ? "var(--color-fg)" : "var(--color-muted)",
                  fontWeight: location.pathname === ROUTES.ROADMAP ? 600 : 400,
                  textDecoration: "none",
                }}
              >
                {t("app.nav.roadmap")}
              </Link>
              <Link
                to={ROUTES.TAGS}
                style={{
                  color: location.pathname === ROUTES.TAGS ? "var(--color-fg)" : "var(--color-muted)",
                  fontWeight: location.pathname === ROUTES.TAGS ? 600 : 400,
                  textDecoration: "none",
                }}
              >
                {t("app.nav.tags")}
              </Link>
              <span ref={notificationAnchorRef} style={{ position: "relative" }}>
                <NotificationBell
                  onClick={() => setNotificationsOpen((value) => !value)}
                />
                <NotificationPanel
                  open={notificationsOpen}
                  onClose={() => setNotificationsOpen(false)}
                  anchorRef={notificationAnchorRef}
                />
              </span>
              <button
                type="button"
                onClick={() => logout()}
                style={{
                  color: "var(--color-muted)",
                  textDecoration: "none",
                  cursor: "pointer",
                  fontSize: "inherit",
                  fontFamily: "inherit",
                  background: "none",
                  border: "none",
                  padding: 0,
                }}
              >
                {t("app.nav.logout")}
              </button>
            </>
          ) : null}
          <LanguageSwitcher />
        </nav>
      </header>

      <main style={{ flex: 1, width: "100%", maxWidth: "var(--max-width)", marginInline: "auto", padding: "2rem" }}>
        <Outlet />
      </main>

      <footer
        style={{
          padding: "1rem 2rem",
          borderTop: "1px solid var(--color-border)",
          textAlign: "center",
          color: "var(--color-muted)",
          fontSize: "0.875rem",
        }}
      >
        &copy; {new Date().getFullYear()} {t("app.name")}
      </footer>
    </div>
  );
}
