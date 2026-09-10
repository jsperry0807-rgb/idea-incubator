import { useTranslation } from "react-i18next";
import { Card } from "@repo/ui";

import { useDashboardStats } from "../hooks/useDashboardStats";
import { StatsGridSkeleton } from "./skeletons";

interface StatCardProps {
  label: string;
  value: number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </span>
      <span className="text-3xl font-extrabold text-[var(--color-fg)]">
        {value}
      </span>
    </Card>
  );
}

export function StatsGrid() {
  const { t } = useTranslation();
  const query = useDashboardStats();

  if (query.isLoading) {
    return <StatsGridSkeleton />;
  }

  if (query.isError) {
    return (
      <p className="text-sm text-[var(--color-danger)]">
        {t("dashboard.stats.loadError")}
      </p>
    );
  }

  if (!query.data) {
    return null;
  }

  const { totalIdeas, byStatus } = query.data;

  const stats: StatCardProps[] = [
    { label: t("dashboard.stats.totalIdeas"), value: totalIdeas },
    { label: t("dashboard.stats.inPlanning"), value: byStatus.PLANNING },
    { label: t("dashboard.stats.planned"), value: byStatus.PLANNED },
    { label: t("dashboard.stats.done"), value: byStatus.DONE },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} label={stat.label} value={stat.value} />
      ))}
    </div>
  );
}