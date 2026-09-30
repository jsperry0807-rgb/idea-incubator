import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { TaskStatus, type Task } from "@repo/shared";

import { useUpdateTask } from "../hooks/useUpdateTask";

type SortableResult = ReturnType<typeof useSortable>;

export interface TaskCardProps {
  task: Task;
  ideaId: string;
  /** Renders a detached preview for the drag overlay (no sortable registration). */
  overlay?: boolean;
}

const STATUS_ACCENT: Record<"TODO" | "IN_PROGRESS" | "DONE", string> = {
  [TaskStatus.TODO]: "var(--color-muted)",
  [TaskStatus.IN_PROGRESS]: "var(--color-warning)",
  [TaskStatus.DONE]: "var(--color-success)",
};

function DragGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
      <path
        fill="currentColor"
        d="M6.5 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm7-13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
      />
    </svg>
  );
}

function TaskCardBody({
  task,
  ideaId,
  attributes,
  listeners,
}: {
  task: Task;
  ideaId: string;
  attributes?: SortableResult["attributes"];
  listeners?: SortableResult["listeners"];
}) {
  const { t } = useTranslation();
  const updateMutation = useUpdateTask(ideaId);
  const isDone = task.status === TaskStatus.DONE;

  function handleToggle() {
    updateMutation.mutate({
      taskId: task.id,
      input: { status: isDone ? TaskStatus.TODO : TaskStatus.DONE },
    });
  }

  return (
    <div
      style={{ borderInlineStartColor: STATUS_ACCENT[task.status] }}
      className="flex items-start gap-2 rounded-md border border-[var(--color-border)] border-s-2 bg-[var(--color-card)] px-2 py-1.5 text-sm shadow-xs"
    >
      <button
        type="button"
        aria-label={t("ideas.board.dragHandle")}
        className="mt-0.5 shrink-0 cursor-grab touch-none text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)] active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <DragGlyph />
      </button>
      <input
        type="checkbox"
        checked={isDone}
        onChange={handleToggle}
        disabled={updateMutation.isPending}
        aria-label={task.title}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-accent)]"
      />
      <span
        className={
          isDone
            ? "line-through text-[var(--color-muted)]"
            : "text-[var(--color-fg)]"
        }
      >
        {task.title}
      </span>
    </div>
  );
}

export function TaskCard({ task, ideaId, overlay = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: overlay });

  if (overlay) {
    return (
      <li className="list-none">
        <TaskCardBody task={task} ideaId={ideaId} />
      </li>
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={[
        "list-none",
        isDragging ? "relative z-10 opacity-40" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <TaskCardBody
        task={task}
        ideaId={ideaId}
        attributes={attributes}
        listeners={listeners}
      />
    </li>
  );
}
