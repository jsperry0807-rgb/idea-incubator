import { useTranslation } from "react-i18next";
import type { IdeaStatus, PipelineIdea } from "@repo/shared";

import { KanbanCard } from "./KanbanCard";

export interface KanbanColumnProps {
  status: IdeaStatus;
  ideas: PipelineIdea[];
}

export function KanbanColumn({ status, ideas }: KanbanColumnProps) {
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
            <KanbanCard key={idea.id} idea={idea} />
          ))}
        </ul>
      )}
    </section>
  );
}