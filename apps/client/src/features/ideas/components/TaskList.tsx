import { useTranslation } from "react-i18next";
import type { Task } from "@repo/shared";
import { EmptyState, Spinner } from "@repo/ui";

import { useTasks } from "../hooks/useTasks";

export interface TaskListProps {
  ideaId: string;
}

interface TaskGroup {
  milestone: string | null;
  tasks: Task[];
}

function groupTasksByMilestone(tasks: Task[]): TaskGroup[] {
  const groups = new Map<string | null, Task[]>();
  for (const task of tasks) {
    const group = groups.get(task.milestone);
    if (group) {
      group.push(task);
    } else {
      groups.set(task.milestone, [task]);
    }
  }
  return [...groups.entries()].map(([milestone, items]) => ({
    milestone,
    tasks: items,
  }));
}

export function TaskList({ ideaId }: TaskListProps) {
  const { t } = useTranslation();
  const query = useTasks(ideaId);

  if (query.isLoading) {
    return (
      <div className="flex justify-center px-4 pb-4">
        <Spinner size="md" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="px-4 pb-4">
        <p className="text-sm text-[var(--color-danger)]">
          {t("ideas.tasks.loadError")}
        </p>
      </div>
    );
  }

  const tasks = query.data ?? [];

  if (tasks.length === 0) {
    return (
      <div className="px-4 pb-4">
        <EmptyState
          title={t("ideas.tasks.emptyTitle")}
          description={t("ideas.tasks.emptyDescription")}
        />
      </div>
    );
  }

  const groups = groupTasksByMilestone(tasks);

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      {groups.map((group) => (
        <section key={group.milestone ?? ""} className="flex flex-col gap-2">
          <h3 className="flex items-center justify-between text-sm font-medium text-[var(--color-fg)]">
            <span>{group.milestone ?? t("ideas.tasks.noMilestone")}</span>
            <span className="text-xs font-normal text-[var(--color-muted)]">
              {t("ideas.tasks.task", { count: group.tasks.length })}
            </span>
          </h3>
          <ul className="flex flex-col divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
            {group.tasks.map((task) => (
              <li key={task.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span
                  className={
                    task.completed
                      ? "line-through text-[var(--color-muted)]"
                      : "text-[var(--color-fg)]"
                  }
                >
                  {task.title}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}