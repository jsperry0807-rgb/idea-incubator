import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import type { Task } from "@repo/shared";
import { Badge, toast } from "@repo/ui";

import { useUpdateTask } from "../hooks/useUpdateTask";

export interface TaskItemProps {
  ideaId: string;
  task: Task;
}

export function TaskItem({ ideaId, task }: TaskItemProps) {
  const { t } = useTranslation();
  const updateMutation = useUpdateTask(ideaId);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  function handleToggle() {
    updateMutation.mutate(
      { taskId: task.id, input: { completed: !task.completed } },
      {
        onError: () => toast.error(t("ideas.tasks.updateError")),
      },
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
        "flex items-center gap-2 px-3 py-2 text-sm",
        isDragging
          ? "relative z-10 rounded-md bg-[var(--color-bg)] shadow-md"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        aria-label={t("ideas.tasks.reorder")}
        className="cursor-grab touch-none text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)] active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
          <path
            fill="currentColor"
            d="M6.5 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm7-13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
          />
        </svg>
      </button>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={handleToggle}
        disabled={updateMutation.isPending}
        aria-label={task.title}
        className="h-4 w-4 cursor-pointer accent-[var(--color-accent)]"
      />
      <span
        className={
          task.completed
            ? "line-through text-[var(--color-muted)]"
            : "text-[var(--color-fg)]"
        }
      >
        {task.title}
      </span>
      {task.milestone ? <Badge tone="neutral">{task.milestone}</Badge> : null}
    </li>
  );
}