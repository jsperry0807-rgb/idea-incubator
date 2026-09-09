import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { PipelineIdea } from "@repo/shared";
import { Card, ProgressBar } from "@repo/ui";

import { ideaDetailPath } from "@config/routes";
import { PriorityDot } from "@/features/ideas/components/PriorityDot";
import { StatusBadge } from "@/features/ideas/components/StatusBadge";
import { TagBadge } from "@/features/ideas/components/TagBadge";

function progressPercent(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

export function IdeaProgressCard({ idea }: { idea: PipelineIdea }) {
  const { t } = useTranslation();
  const percent = progressPercent(idea.completedTaskCount, idea.taskCount);
  const taskCountLabel = t("ideas.tasks.task", {
    count: idea.taskCount,
  });

  return (
    <Card className="p-0 transition-colors hover:border-[var(--color-accent)]">
      <Link
        to={ideaDetailPath(idea.id)}
        className="flex flex-col gap-2 p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <PriorityDot priority={idea.priority} />
            <span className="text-sm font-semibold leading-snug text-[var(--color-fg)]">
              {idea.title}
            </span>
          </div>
          <StatusBadge status={idea.status} />
        </div>

        {idea.description ? (
          <p className="line-clamp-2 text-xs text-[var(--color-muted)]">
            {idea.description}
          </p>
        ) : null}

        {idea.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {idea.tags.map(({ tagId, tag }) => (
              <TagBadge key={tagId} tag={tag} />
            ))}
          </div>
        ) : null}

        {idea.taskCount > 0 ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
              <span>
                {idea.completedTaskCount}/{idea.taskCount} {taskCountLabel}
              </span>
              <span>{percent}%</span>
            </div>
            <ProgressBar
              value={percent}
              ariaLabel={t("ideas.tasks.overallProgress", { percent })}
            />
          </div>
        ) : null}
      </Link>
    </Card>
  );
}