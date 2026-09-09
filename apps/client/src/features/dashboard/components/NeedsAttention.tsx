import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Spinner } from "@repo/ui";
import type { IdeaStatus, PipelineIdea } from "@repo/shared";

import { ideaDetailPath } from "@config/routes";
import { usePipeline } from "@/features/ideas/hooks/usePipeline";

const STALE_DAYS = 7;

function daysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

interface StaleIdea {
  idea: PipelineIdea;
  daysSinceUpdate: number;
}

export function NeedsAttention() {
  const { t } = useTranslation();
  const pipelineQuery = usePipeline();

  const staleIdeas = useMemo(() => {
    if (!pipelineQuery.data) {
      return [];
    }

    const staleStatuses: IdeaStatus[] = ["PLANNING", "PLANNED"];
    const stale: StaleIdea[] = [];

    for (const status of staleStatuses) {
      for (const idea of pipelineQuery.data[status]) {
        const days = daysSince(idea.updatedAt);
        if (days >= STALE_DAYS) {
          stale.push({ idea, daysSinceUpdate: days });
        }
      }
    }

    stale.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);
    return stale;
  }, [pipelineQuery.data]);

  if (pipelineQuery.isLoading) {
    return (
      <Card className="p-4">
        <div className="flex justify-center py-6">
          <Spinner size="md" />
        </div>
      </Card>
    );
  }

  if (pipelineQuery.isError) {
    return (
      <Card className="p-4">
        <p className="text-sm text-[var(--color-danger)]">
          {t("dashboard.needsAttention.loadError")}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-[var(--color-fg)]">
        {t("dashboard.needsAttention.title")}
      </h2>
      {staleIdeas.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">
          {t("dashboard.needsAttention.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {staleIdeas.map(({ idea, daysSinceUpdate }) => (
            <li
              key={idea.id}
              className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--color-border)] p-3"
            >
              <div className="flex flex-col gap-0.5">
                <Link
                  to={ideaDetailPath(idea.id)}
                  className="text-sm font-medium text-[var(--color-fg)] hover:text-[var(--color-accent)]"
                >
                  {idea.title}
                </Link>
                <span className="text-xs text-[var(--color-muted)]">
                  {t(`ideas.status.${idea.status}`)} ·{" "}
                  {t("dashboard.needsAttention.staleFor", {
                    count: String(daysSinceUpdate),
                  })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}