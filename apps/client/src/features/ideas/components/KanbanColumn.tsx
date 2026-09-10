import { useTranslation } from "react-i18next";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { IdeaStatus, PipelineIdea } from "@repo/shared";

import { KanbanCard } from "./KanbanCard";

function DraggableKanbanCard({ idea }: { idea: PipelineIdea }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: idea.id,
    data: { idea },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <KanbanCard
      idea={idea}
      style={style}
      dragAttributes={attributes}
      dragListeners={listeners}
      setNodeRef={setNodeRef}
      isDragging={isDragging}
    />
  );
}

export interface KanbanColumnProps {
  status: IdeaStatus;
  ideas: PipelineIdea[];
}

export function KanbanColumn({ status, ideas }: KanbanColumnProps) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  return (
    <section
      ref={setNodeRef}
      aria-label={t(`ideas.status.${status}`)}
      className={[
        "flex w-64 shrink-0 snap-start flex-col gap-2 p-2 transition-colors",
        isOver
          ? "rounded-[var(--radius)] bg-[var(--color-accent)]/5 ring-2 ring-[var(--color-accent)]/40"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
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
            <DraggableKanbanCard key={idea.id} idea={idea} />
          ))}
        </ul>
      )}
    </section>
  );
}