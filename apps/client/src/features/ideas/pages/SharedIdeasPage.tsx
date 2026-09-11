import { useTranslation } from "react-i18next";
import { EmptyState } from "@repo/ui";

import { useSharedWithMe } from "../hooks/useSharedWithMe";
import { SharedIdeaCard } from "../components/sharing/SharedIdeaCard";
import { IdeaGridSkeleton } from "../components/skeletons";

export default function SharedIdeasPage() {
  const { t } = useTranslation();
  const query = useSharedWithMe();

  return (
    <section className="page-container flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold">{t("ideas.shared.title")}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t("ideas.shared.subtitle")}
        </p>
      </header>

      {query.isLoading ? (
        <IdeaGridSkeleton />
      ) : query.isError ? (
        <EmptyState
          title={t("ideas.shared.loadError")}
          description={t("ideas.shared.loadErrorDescription")}
        />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          title={t("ideas.shared.emptyTitle")}
          description={t("ideas.shared.emptyDescription")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(query.data ?? []).map((item) => (
            <SharedIdeaCard key={item.idea.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}