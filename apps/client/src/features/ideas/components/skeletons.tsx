import { useTranslation } from "react-i18next";
import { Card, Skeleton } from "@repo/ui";
import { IDEA_STATUS_VALUES } from "@repo/shared";

export function IdeaGridSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-busy="true">
      <span className="sr-only">{t("app.loading")}</span>
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={index} className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-2 rounded-full" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="mt-auto flex gap-1.5">
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function IdeaListSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3" role="status" aria-busy="true">
      <span className="sr-only">{t("app.loading")}</span>
      {Array.from({ length: 5 }, (_, index) => (
        <Card key={index}>
          <div className="flex items-center gap-4 p-4">
            <div className="flex shrink-0 items-center gap-2">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-2 h-3 w-full" />
            </div>
            <div className="hidden gap-1.5 md:flex">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function KanbanBoardSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4" role="status" aria-busy="true">
      <span className="sr-only">{t("app.loading")}</span>
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-40 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {IDEA_STATUS_VALUES.map((status) => (
          <div key={status} className="flex w-64 shrink-0 flex-col gap-2 p-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            {Array.from({ length: 3 }, (_, index) => (
              <Card key={index} className="flex flex-col gap-2 p-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-2 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function IdeaDetailSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-5" role="status" aria-busy="true">
      <span className="sr-only">{t("app.loading")}</span>
      <Skeleton className="h-4 w-24" />
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-2 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-1/3" />
      </Card>
      <Card className="flex flex-col gap-3 p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </Card>
    </div>
  );
}