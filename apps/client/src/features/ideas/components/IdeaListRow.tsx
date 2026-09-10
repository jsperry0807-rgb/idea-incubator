import type { Idea } from "@repo/shared";
import { Card, EmptyState } from "@repo/ui";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ideaDetailPath } from "@config/routes";
import { PriorityDot } from "./PriorityDot";
import { StatusBadge } from "./StatusBadge";
import { TagBadge } from "./TagBadge";

export function IdeaListRow({ idea }: { idea: Idea }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <Link
        to={ideaDetailPath(idea.id)}
        className="flex items-center gap-4 p-4"
      >
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <PriorityDot priority={idea.priority} />
          <StatusBadge status={idea.status} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-[var(--color-fg)]">
            {idea.title}
          </h3>
          {idea.description ? (
            <p className="truncate text-sm text-[var(--color-muted)]">
              {idea.description}
            </p>
          ) : null}
        </div>

        {idea.tags.length > 0 ? (
          <div className="hidden flex-wrap gap-1.5 md:flex">
            {idea.tags.map(({ tagId, tag }) => (
              <TagBadge key={tagId} tag={tag} />
            ))}
          </div>
        ) : null}
      </Link>
    </Card>
  );
}

export function IdeaList({ ideas }: { ideas: Idea[] }) {
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
    <div className="flex flex-col gap-3">
      {ideas.map((idea) => (
        <IdeaListRow key={idea.id} idea={idea} />
      ))}
    </div>
  );
}