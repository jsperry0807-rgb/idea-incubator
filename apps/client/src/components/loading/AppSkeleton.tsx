import { useTranslation } from "react-i18next";
import { Skeleton } from "@repo/ui";

export function AppSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col" role="status" aria-busy="true">
      <span className="sr-only">{t("app.loading")}</span>

      <header className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-4 py-3 sm:px-6 lg:px-8">
        <Skeleton className="h-6 w-28" />
        <div className="hidden items-center gap-5 md:flex">
          {[48, 56, 64, 60, 68].map((width) => (
            <Skeleton key={width} className="h-4" style={{ width }} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[var(--max-width)] flex-1 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>
      </main>
    </div>
  );
}