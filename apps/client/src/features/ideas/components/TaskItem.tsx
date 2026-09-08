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

  function handleToggle() {
    updateMutation.mutate(
      { taskId: task.id, input: { completed: !task.completed } },
      {
        onError: () => toast.error(t("ideas.tasks.updateError")),
      },
    );
  }

  return (
    <li className="flex items-center gap-2 px-3 py-2 text-sm">
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