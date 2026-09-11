import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ErrorBoundary } from "@components/error/ErrorBoundary";
import { NotificationBell } from "@features/notifications/components/NotificationBell";
import { NotificationPanel } from "@features/notifications/components/NotificationPanel";
import { ROUTES } from "@config/routes";
import { GlobalShortcuts } from "@components/shortcuts/GlobalShortcuts";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useUIStore } from "@stores/ui.store";

export default function RootLayout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationAnchorRef = useRef<HTMLSpanElement>(null);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const isHome = location.pathname === ROUTES.HOME;
  const isIdeas =
    location.pathname === ROUTES.IDEAS ||
    location.pathname.startsWith(`${ROUTES.IDEAS}/`);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? "en";

    let label: string | null = null;
    if (location.pathname === ROUTES.HOME) label = t("app.nav.home");
    else if (isIdeas) label = t("app.nav.ideas");
    else if (location.pathname === ROUTES.ROADMAP) label = t("app.nav.roadmap");
    else if (location.pathname === ROUTES.TAGS) label = t("app.nav.tags");
    else if (location.pathname === ROUTES.SHARED) label = t("app.nav.shared");
    else if (location.pathname === ROUTES.SETTINGS) label = t("app.nav.settings");
    document.title = label ? `${label} · ${t("app.name")}` : t("app.name");
  }, [i18n.resolvedLanguage, location.pathname, t, isIdeas]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen, setSidebarOpen]);

  const navLinkClasses = (active: boolean) =>
    [
      "rounded-full px-3 py-1.5 text-sm transition-colors duration-[var(--motion-fast)] ease-[var(--ease-out)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
      active
        ? "bg-[var(--color-accent)]/10 font-semibold text-[var(--color-accent)]"
        : "text-[var(--color-muted)] hover:bg-[var(--color-muted)]/10 hover:text-[var(--color-fg)]",
    ].join(" ");

  const authLinks = isAuthenticated
    ? [
        {
          to: ROUTES.IDEAS,
          label: t("app.nav.ideas"),
          active: isIdeas,
        },
        {
          to: ROUTES.ROADMAP,
          label: t("app.nav.roadmap"),
          active: location.pathname === ROUTES.ROADMAP,
        },
        {
          to: ROUTES.TAGS,
          label: t("app.nav.tags"),
          active: location.pathname === ROUTES.TAGS,
        },
        {
          to: ROUTES.SHARED,
          label: t("app.nav.shared"),
          active: location.pathname === ROUTES.SHARED,
        },
        {
          to: ROUTES.SETTINGS,
          label: t("app.nav.settings"),
          active: location.pathname === ROUTES.SETTINGS,
        },
      ]
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-[var(--color-bg)] focus:px-4 focus:py-2 focus:text-sm focus:text-[var(--color-fg)] focus:shadow-lg focus:outline-2 focus:outline-[var(--color-accent)]"
      >
        {t("app.skipToContent")}
      </a>
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--color-bg)]/70">
        <div className="mx-auto flex w-full max-w-[var(--max-width)] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            aria-label={t("app.nav.menu")}
            aria-expanded={sidebarOpen}
            onClick={toggleSidebar}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-muted)]/10 hover:text-[var(--color-fg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] md:hidden"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M3 6h18" />
              <path d="M3 12h18" />
              <path d="M3 18h18" />
            </svg>
          </button>
          <Link
            to={ROUTES.HOME}
            className="truncate text-lg font-bold text-[var(--color-fg)]"
          >
            {t("app.name")}
          </Link>
        </div>

        <nav className="hidden items-center gap-5 md:flex">
          <Link to={ROUTES.HOME} className={navLinkClasses(isHome)}>
            {t("app.nav.home")}
          </Link>
          {authLinks.map((link) => (
            <Link key={link.to} to={link.to} className={navLinkClasses(link.active)}>
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => logout()}
              className="cursor-pointer border-none bg-none p-0 font-inherit text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              {t("app.nav.logout")}
            </button>
          ) : null}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <span ref={notificationAnchorRef} className="relative">
            <NotificationBell
              onClick={() => setNotificationsOpen((value) => !value)}
            />
            <NotificationPanel
              open={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
              anchorRef={notificationAnchorRef}
            />
          </span>
        </div>
        </div>
      </header>

      {sidebarOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden motion-safe:animate-[fade-in_150ms_var(--ease-out)]"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside
            aria-label={t("app.nav.menu")}
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-1 overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-lg)] md:hidden motion-safe:animate-[sidebar-in_250ms_var(--ease-out)]"
          >
            <Link
              to={ROUTES.HOME}
              onClick={() => setSidebarOpen(false)}
              className="rounded-md px-3 pb-3 pt-1 text-sm font-semibold text-[var(--color-fg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              {t("app.name")}
            </Link>
            <Link
              to={ROUTES.HOME}
              onClick={() => setSidebarOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-[var(--color-muted)] transition-colors hover:bg-[var(--color-muted)]/10 hover:text-[var(--color-fg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              {t("app.nav.home")}
            </Link>
            {authLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={[
                  "rounded-md px-3 py-2 text-sm transition-colors hover:bg-[var(--color-muted)]/10 hover:text-[var(--color-fg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
                  link.active
                    ? "bg-[var(--color-accent)]/10 font-semibold text-[var(--color-fg)]"
                    : "text-[var(--color-muted)]",
                ].join(" ")}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  logout();
                }}
                className="cursor-pointer rounded-md border-none bg-none px-3 py-2 text-left text-sm text-[var(--color-danger)] transition-colors hover:bg-[var(--color-muted)]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              >
                {t("app.nav.logout")}
              </button>
            ) : null}
          </aside>
        </>
      ) : null}

      {isAuthenticated ? <GlobalShortcuts /> : null}

      <main id="main-content" className="w-full min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <ErrorBoundary resetKey={location.pathname}>
          <div key={location.pathname} className="motion-safe:animate-[page-in_250ms_var(--ease-out)]">
            <Outlet />
          </div>
        </ErrorBoundary>
      </main>

      <footer className="border-t border-[var(--color-border)]">
        <div className="mx-auto flex w-full max-w-[var(--max-width)] flex-col items-center gap-1 px-4 py-6 text-center text-sm text-[var(--color-muted)] sm:px-6 lg:px-8">
          <p>
            &copy; {new Date().getFullYear()} {t("app.name")} ·{" "}
            <span className="text-[var(--color-muted-fg)]">{t("app.tagline")}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}