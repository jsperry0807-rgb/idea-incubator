import { useTranslation } from "react-i18next";
import {
  IDEA_STATUS_VALUES,
  type IdeaStatus,
  type PipelineIdea,
} from "@repo/shared";
import { ProgressBar, Spinner } from "@repo/ui";

import { usePipeline } from "../hooks/usePipeline";
import { PriorityDot } from "./PriorityDot";
import { TagBadge } from "./TagBadge";

function progressPercent(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

function PipelineCard({ idea }: { idea: PipelineIdea }) {
  const { t } = useTranslation();
  const percent = progressPercent(idea.completedTaskCount, idea.taskCount);

  return (
    <li className="flex flex-col gap-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3 shadow-sm">
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

function PipelineColumn({
  status,
  ideas,
}: {
  status: IdeaStatus;
  ideas: PipelineIdea[];
}) {
  const { t } = useTranslation();

  return (
    <section
      className="flex w-64 shrink-0 flex-col gap-2"
      aria-label={t(`ideas.status.${status}`)}
    >
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-fg)]">
          {t(`ideas.status.${status}`)}
        </h3>
        <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted)]">
          {ideas.length}
        </span>
      </header>

      {ideas.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] p-3 text-xs text-[var(--color-muted)]">
          {t("ideas.pipeline.emptyColumn")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ideas.map((idea) => (
            <PipelineCard key={idea.id} idea={idea} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function KanbanBoard() {
  const { t } = useTranslation();
  const query = usePipeline();

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (query.isError) {
    return <p className="text-sm text-[var(--color-danger)]">{t("ideas.pipeline.loadError")}</p>;
  }

  if (!query.data) {
    return null;
  }

  const pipeline = query.data;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {IDEA_STATUS_VALUES.map((status) => (
        <PipelineColumn
          key={status}
          status={status}
          ideas={pipeline[status]}
        />
      ))}
    </div>
  );
}