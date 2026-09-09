import { useTranslation } from "react-i18next";
import type { PipelineIdea } from "@repo/shared";
import { ProgressBar } from "@repo/ui";

import { PriorityDot } from "./PriorityDot";
import { TagBadge } from "./TagBadge";

function progressPercent(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

export interface KanbanCardProps {
  idea: PipelineIdea;
  className?: string;
}

export function KanbanCard({ idea, className }: KanbanCardProps) {
  const { t } = useTranslation();
  const percent = progressPercent(idea.completedTaskCount, idea.taskCount);

  return (
    <li
      className={[
        "flex flex-col gap-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3 shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start gap-2">
        <PriorityDot priority={idea.priority} />
        <span className="text-sm font-medium leading-snug text-[var(--color-fg)]">
          {idea.title}
        </span>
      </div>

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
            <span>{t("ideas.pipeline.progress")}</span>
            <span>
              {idea.completedTaskCount}/{idea.taskCount}
            </span>
          </div>
          <ProgressBar value={percent} ariaLabel={t("ideas.pipeline.progress")} />
        </div>
      ) : null}
    </li>
  );
}