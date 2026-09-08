import { useTranslation } from "react-i18next";
import type { Task } from "@repo/shared";
import { EmptyState, ProgressBar, Spinner } from "@repo/ui";

import { useTasks } from "../hooks/useTasks";
import { AddTaskForm } from "./AddTaskForm";
import { TaskItem } from "./TaskItem";

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

function progressPercent(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

export function TaskList({ ideaId }: TaskListProps) {
  const { t } = useTranslation();
  const query = useTasks(ideaId);

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-3 px-4 pb-4">
        <AddTaskForm ideaId={ideaId} />
        <div className="flex justify-center py-4">
          <Spinner size="md" />
        </div>
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
      <div className="flex flex-col gap-3 px-4 pb-4">
        <AddTaskForm ideaId={ideaId} />
        <EmptyState
          title={t("ideas.tasks.emptyTitle")}
          description={t("ideas.tasks.emptyDescription")}
        />
      </div>
    );
  }

  const groups = groupTasksByMilestone(tasks);

  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const overallPercent = progressPercent(completed, total);

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <AddTaskForm ideaId={ideaId} />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-[var(--color-fg)]">
            {t("ideas.tasks.overall")}
          </span>
          <span className="text-xs text-[var(--color-muted)]">
            {completed}/{total} · {overallPercent}%
          </span>
        </div>
        <ProgressBar
          value={overallPercent}
          ariaLabel={t("ideas.tasks.overallProgress", {
            percent: overallPercent,
          })}
        />
      </div>

      {groups.map((group) => {
        const groupCompleted = group.tasks.filter((task) => task.completed).length;
        const groupPercent = progressPercent(groupCompleted, group.tasks.length);

        return (
          <section key={group.milestone ?? ""} className="flex flex-col gap-2">
            <h3 className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-fg)]">
              <div className="flex items-center justify-between">
                <span>{group.milestone ?? t("ideas.tasks.noMilestone")}</span>
                <span className="text-xs font-normal text-[var(--color-muted)]">
                  {groupCompleted}/{group.tasks.length}{" "}
                  {t("ideas.tasks.task", { count: group.tasks.length })}
                </span>
              </div>
              <ProgressBar
                value={groupPercent}
                ariaLabel={group.milestone ?? t("ideas.tasks.noMilestone")}
              />
            </h3>
            <ul className="flex flex-col divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
              {group.tasks.map((task) => (
                <TaskItem key={task.id} ideaId={ideaId} task={task} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}