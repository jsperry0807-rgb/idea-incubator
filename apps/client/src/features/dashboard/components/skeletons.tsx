import { useTranslation } from "react-i18next";
import { Card, Skeleton } from "@repo/ui";

export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" role="status" aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} className="flex flex-col gap-2 p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-12" />
        </Card>
      ))}
    </div>
  );
}

export function StatsChartSkeleton() {
  const { t } = useTranslation();
  return (
    <Card className="p-4" role="status" aria-busy="true">
      <span className="sr-only">{t("app.loading")}</span>
      <Skeleton className="mb-4 h-4 w-32" />
      <div className="flex h-60 items-end gap-6 px-6">
        {[45, 75, 30, 60, 90, 55].map((height) => (
          <Skeleton key={height} className="flex-1" style={{ height: `${height}%` }} />
        ))}
      </div>
    </Card>
  );
}

export function ActivityFeedSkeleton() {
  const { t } = useTranslation();
  return (
    <Card className="p-4" role="status" aria-busy="true">
      <span className="sr-only">{t("app.loading")}</span>
      <Skeleton className="mb-3 h-4 w-28" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-start gap-3">
            <Skeleton className="size-2 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function NeedsAttentionSkeleton() {
  const { t } = useTranslation();
  return (
    <Card className="p-4" role="status" aria-busy="true">
      <span className="sr-only">{t("app.loading")}</span>
      <Skeleton className="mb-3 h-4 w-32" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </Card>
  );
}

export function IdeaProgressCardSkeleton() {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Skeleton className="size-2 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="mt-1 h-2.5 w-full" />
    </Card>
  );
}