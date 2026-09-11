import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@repo/ui";
import { IDEA_STATUS_VALUES } from "@repo/shared";

import { useDashboardStats } from "../hooks/useDashboardStats";
import { StatsChartSkeleton } from "./skeletons";

export function StatsChart() {
  const { t } = useTranslation();
  const query = useDashboardStats();

  if (query.isLoading) {
    return <StatsChartSkeleton />;
  }

  if (query.isError) {
    return (
      <Card className="p-4">
        <p className="text-sm text-[var(--color-danger)]">
          {t("dashboard.stats.loadError")}
        </p>
      </Card>
    );
  }

  if (!query.data) {
    return null;
  }

  const data = IDEA_STATUS_VALUES.map((status) => ({
    name: t(`ideas.status.${status}`),
    count: query.data!.byStatus[status],
  }));

  return (
    <Card className="p-4">
      <h2 className="mb-4 text-sm font-semibold text-[var(--color-fg)]">
        {t("dashboard.chart.title")}
      </h2>
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "var(--color-muted)" }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "var(--color-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--color-muted)", opacity: 0.12 }}
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "var(--shadow-md)",
                fontSize: "0.875rem",
                color: "var(--color-card-fg)",
              }}
            />
            <Bar
              dataKey="count"
              name={t("dashboard.chart.count")}
              fill="var(--color-accent)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}