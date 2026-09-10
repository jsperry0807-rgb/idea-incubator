import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@repo/ui";

import { ROUTES } from "@config/routes";
import { useTags } from "@features/tags/hooks/useTags";
import { useUIStore } from "@stores/ui.store";
import { useIdeas } from "../hooks/useIdeas";
import { IdeaGrid } from "../components/IdeaGrid";
import { IdeaList } from "../components/IdeaListRow";
import { IdeaFilters } from "../components/IdeaFilters";
import { IdeaSearch } from "../components/IdeaSearch";
import { IdeaGridSkeleton, IdeaListSkeleton } from "../components/skeletons";
import type { IdeaFilters as IdeaFiltersState } from "../types";

const DEFAULT_FILTERS: IdeaFiltersState = {
  sort: "createdAt",
  order: "desc",
};

export default function IdeasPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<IdeaFiltersState>(DEFAULT_FILTERS);
  const viewMode = useUIStore((s) => s.ideasViewMode);
  const toggleViewMode = useUIStore((s) => s.toggleIdeasViewMode);

  const ideasQuery = useIdeas(filters);
  const tagsQuery = useTags();

  const patchFilters = (patch: Partial<IdeaFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const isLoading = ideasQuery.isLoading;
  const error = ideasQuery.error;

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">{t("ideas.title")}</h1>
          <p className="text-sm text-[var(--color-muted)]">{t("ideas.subtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link to={ROUTES.NEW_IDEA}>
            <Button variant="primary" size="sm">
              {t("ideas.create.newIdeaButton")}
            </Button>
          </Link>
          <button
            type="button"
            onClick={toggleViewMode}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-fg)] transition-colors hover:bg-[var(--color-muted)]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            aria-label={viewMode === "grid" ? t("ideas.viewList") : t("ideas.viewGrid")}
            title={viewMode === "grid" ? t("ideas.viewList") : t("ideas.viewGrid")}
          >
            {viewMode === "grid" ? "≡ List" : "▦ Grid"}
          </button>
        </div>
      </header>

      <IdeaSearch
        value={filters.search ?? ""}
        placeholder={t("ideas.searchPlaceholder")}
        aria-label={t("ideas.searchPlaceholder")}
        onDebouncedChange={(search) => patchFilters({ search: search || undefined })}
      />

      <IdeaFilters filters={filters} tags={tagsQuery.data ?? []} onChange={patchFilters} />

      {isLoading ? (
        viewMode === "grid" ? (
          <IdeaGridSkeleton />
        ) : (
          <IdeaListSkeleton />
        )
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{t("ideas.loadError")}</p>
      ) : viewMode === "grid" ? (
        <IdeaGrid ideas={ideasQuery.data?.items ?? []} />
      ) : (
        <IdeaList ideas={ideasQuery.data?.items ?? []} />
      )}
    </section>
  );
}