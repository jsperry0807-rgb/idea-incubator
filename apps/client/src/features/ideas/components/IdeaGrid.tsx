import type { Idea } from "@repo/shared";
import { EmptyState } from "@repo/ui";
import { useTranslation } from "react-i18next";

import { IdeaCard } from "./IdeaCard";

export function IdeaGrid({ ideas }: { ideas: Idea[] }) {
  const { t } = useTranslation();

  if (ideas.length === 0) {
    return (
      <EmptyState
        title={t("ideas.emptyTitle")}
        description={t("ideas.emptyDescription")}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ideas.map((idea) => (
        <IdeaCard key={idea.id} idea={idea} />
      ))}
    </div>
  );
}