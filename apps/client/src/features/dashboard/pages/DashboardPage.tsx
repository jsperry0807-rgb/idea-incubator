import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { usePipeline } from "@/features/ideas/hooks/usePipeline";
import { ActivityFeed } from "../components/ActivityFeed";
import { IdeaProgressCard } from "../components/IdeaProgressCard";
import { NeedsAttention } from "../components/NeedsAttention";
import { StatsGrid } from "../components/StatsGrid";
import {
  IdeaProgressCardSkeleton,
  StatsChartSkeleton,
} from "../components/skeletons";

const StatsChart = lazy(() =>
  import("../components/StatsChart").then((m) => ({ default: m.StatsChart })),
);

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const pipelineQuery = usePipeline();
  const inProgress = pipelineQuery.data?.IN_PROGRESS ?? [];

  return (
    <section className="page-container flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold text-[var(--color-fg)]">
          {user ? t("dashboard.greeting", { name: user.name }) : t("dashboard.title")}
        </h1>
      </header>

      <StatsGrid />

      <Suspense fallback={<StatsChartSkeleton />}>
        <StatsChart />
      </Suspense>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ActivityFeed />
        <NeedsAttention />
      </div>

      {pipelineQuery.isLoading ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-fg)]">
            {t("dashboard.inProgress.title")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }, (_, index) => (
              <IdeaProgressCardSkeleton key={index} />
            ))}
          </div>
        </section>
      ) : inProgress.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-fg)]">
            {t("dashboard.inProgress.title")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {inProgress.map((idea) => (
              <IdeaProgressCard key={idea.id} idea={idea} />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}