import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "@repo/ui";

import { ROUTES } from "@config/routes";
import { useAuth } from "@features/auth/hooks/useAuth";

const MOCKUP_STATUSES = ["IDEA", "PLANNED", "DONE"] as const;

function CaptureIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.55 1.05 1.3 1.2 2.2h4.8c.15-.9.5-1.65 1.2-2.2A6 6 0 0 0 12 3z" />
    </svg>
  );
}

function PipelineIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="4" width="4" height="10" rx="1.25" />
      <rect x="10" y="4" width="4" height="16" rx="1.25" />
      <rect x="16.5" y="4" width="4" height="7" rx="1.25" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" />
      <circle cx="10" cy="8" r="3.25" />
      <path d="M20 19v-1.5a3.5 3.5 0 0 0-2.5-3.36" />
      <path d="M15.5 5.14a3.25 3.25 0 0 1 0 5.72" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16" />
      <path d="M7 20v-7" />
      <path d="M12 20V6" />
      <path d="M17 20v-4" />
    </svg>
  );
}

function NewIdeaIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function RoadmapIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="6" r="2.25" />
      <circle cx="18.5" cy="18" r="2.25" />
      <path d="M7.75 6h6.75a3.25 3.25 0 0 1 0 6.5H9.5a3.25 3.25 0 0 0 0 6.5h6.75" />
    </svg>
  );
}

function SharedIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v9" />
      <path d="M9.5 9.5 12 12l2.5-2.5" />
      <path d="M4 13.5V18a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18v-4.5" />
    </svg>
  );
}

function MockupPanel() {
  const { t } = useTranslation();
  const bars: Record<(typeof MOCKUP_STATUSES)[number], number> = {
    IDEA: 3,
    PLANNED: 2,
    DONE: 2,
  };

  return (
    <Card className="p-4 shadow-lg sm:p-5" aria-hidden="true">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted)]">
        <span className="size-2 rounded-full bg-[var(--color-accent)]" />
        {t("home.mockupTitle")}
      </span>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {MOCKUP_STATUSES.map((status) => (
          <div
            key={status}
            className="flex flex-col gap-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-2"
          >
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {t(`ideas.status.${status}`)}
            </span>
            {Array.from({ length: bars[status] }, (_, index) => {
              const highlighted = status === "DONE" && index === 0;
              return (
                <div
                  key={index}
                  className={[
                    "h-9 rounded-md border p-1",
                    highlighted
                      ? "border-[var(--color-accent-cta)]/40 bg-[var(--color-primary-soft)]"
                      : "border-[var(--color-border)] bg-[var(--color-card)]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "block size-1.5 rounded-full",
                      highlighted
                        ? "bg-[var(--color-accent-cta)]"
                        : status === "DONE"
                          ? "bg-[var(--color-success)]"
                          : index === 0
                            ? "bg-[var(--color-success)]"
                            : "bg-[var(--color-info)]",
                    ].join(" ")}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
}

function IconChip({ variant = "soft", children }: { variant?: "soft" | "cta"; children: ReactNode }) {
  return (
    <span
      className={[
        "flex size-10 items-center justify-center rounded-[var(--radius)]",
        variant === "cta"
          ? "bg-[var(--color-accent-cta)] text-white"
          : "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <section className="page-container py-16 sm:py-24" aria-busy="true" />;
  }

  if (user) {
    const actions: {
      to: string;
      titleKey: "home.ctaDashboard" | "home.ctaNewIdea" | "home.ctaRoadmap" | "home.ctaSharedTitle";
      descKey: "home.ctaDashboardDesc" | "home.ctaNewIdeaDesc" | "home.ctaRoadmapDesc" | "home.ctaSharedDesc";
      icon: ReactNode;
      primary?: boolean;
    }[] = [
      { to: ROUTES.DASHBOARD, titleKey: "home.ctaDashboard", descKey: "home.ctaDashboardDesc", icon: <DashboardIcon />, primary: true },
      { to: ROUTES.NEW_IDEA, titleKey: "home.ctaNewIdea", descKey: "home.ctaNewIdeaDesc", icon: <NewIdeaIcon /> },
      { to: ROUTES.ROADMAP, titleKey: "home.ctaRoadmap", descKey: "home.ctaRoadmapDesc", icon: <RoadmapIcon /> },
      { to: ROUTES.SHARED, titleKey: "home.ctaSharedTitle", descKey: "home.ctaSharedDesc", icon: <SharedIcon /> },
    ];

    return (
      <section className="page-container flex flex-col gap-8 py-16 sm:py-24">
        <div className="flex flex-col gap-5">
          <span className="w-fit rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[var(--tracking-wide)] text-[var(--color-primary)]">
            {t("home.badge")}
          </span>
          <h1 className="m-0 max-w-3xl text-4xl font-extrabold leading-[1.15] tracking-[var(--tracking-tight)] text-[var(--color-fg)] sm:text-5xl">
            {t("home.greetingTitle", {
              name: user.name?.trim() || user.email,
            })}
          </h1>
          <p className="m-0 max-w-xl text-lg leading-[var(--leading-relaxed)] text-[var(--color-muted)]">
            {t("home.greetingSubtitle")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Card key={action.to} interactive padding="none">
              <button
                type="button"
                onClick={() => navigate(action.to)}
                className="flex h-full min-h-44 w-full cursor-pointer flex-col items-start gap-3 p-5 text-left"
              >
                <IconChip variant={action.primary ? "cta" : "soft"}>
                  {action.icon}
                </IconChip>
                <span
                  className={[
                    "text-base",
                    action.primary
                      ? "font-bold text-[var(--color-fg)]"
                      : "font-semibold text-[var(--color-fg)]",
                  ].join(" ")}
                >
                  {t(action.titleKey)}
                </span>
                <span className="text-sm leading-[var(--leading-normal)] text-[var(--color-muted)]">
                  {t(action.descKey)}
                </span>
              </button>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  const features: {
    titleKey: "home.features.captureTitle" | "home.features.planTitle" | "home.features.shareTitle";
    textKey: "home.features.captureText" | "home.features.planText" | "home.features.shareText";
    icon: ReactNode;
  }[] = [
    { titleKey: "home.features.captureTitle", textKey: "home.features.captureText", icon: <CaptureIcon /> },
    { titleKey: "home.features.planTitle", textKey: "home.features.planText", icon: <PipelineIcon /> },
    { titleKey: "home.features.shareTitle", textKey: "home.features.shareText", icon: <UsersIcon /> },
  ];

  return (
    <section className="page-container flex flex-col gap-6 py-16 sm:gap-8 sm:py-24">
      <div className="grid items-center gap-x-12 gap-y-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6 sm:gap-8">
          <span className="w-fit rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[var(--tracking-wide)] text-[var(--color-primary)]">
            {t("home.badge")}
          </span>
          <h1 className="m-0 max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-[var(--tracking-tight)] text-[var(--color-fg)] sm:text-5xl">
            {t("home.welcome")}
          </h1>
          <p className="m-0 max-w-xl text-lg leading-[var(--leading-relaxed)] text-[var(--color-muted)]">
            {t("home.subtitle")}
          </p>
          <div className="mt-1 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate(ROUTES.REGISTER)}>
              {t("home.primaryCta")}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate(ROUTES.LOGIN)}
            >
              {t("home.secondaryCta")}
            </Button>
          </div>
        </div>
        <div className="relative isolate">
          <div
            className="absolute inset-x-8 -bottom-3 top-3 -z-10 rounded-[var(--radius)] bg-[var(--color-primary-soft)]/60"
            aria-hidden="true"
          />
          <MockupPanel />
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:mt-16 sm:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.titleKey} className="flex flex-col gap-3 p-5">
            <IconChip>{feature.icon}</IconChip>
            <h2 className="m-0 text-base font-bold text-[var(--color-fg)]">
              {t(feature.titleKey)}
            </h2>
            <p className="m-0 text-sm leading-[var(--leading-relaxed)] text-[var(--color-muted)]">
              {t(feature.textKey)}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-start gap-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-primary-soft)]/50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-xl font-bold text-[var(--color-fg)]">
            {t("home.ctaBandTitle")}
          </h2>
          <p className="m-0 text-sm text-[var(--color-muted)]">
            {t("home.ctaBandText")}
          </p>
        </div>
        <Button onClick={() => navigate(ROUTES.REGISTER)}>
          {t("home.primaryCta")}
        </Button>
      </div>
    </section>
  );
}
