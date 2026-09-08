import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Task } from "@repo/shared";
import { EmptyState, ProgressBar, Spinner, toast } from "@repo/ui";

import { useTasks } from "../hooks/useTasks";
import { useReorderTasks } from "../hooks/useReorderTasks";
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

interface TaskGroupSectionProps {
  group: TaskGroup;
  ideaId: string;
  onDragEnd: (event: DragEndEvent) => void;
}

function TaskGroupSection({ group, ideaId, onDragEnd }: TaskGroupSectionProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const groupCompleted = group.tasks.filter((task) => task.completed).length;
  const groupPercent = progressPercent(groupCompleted, group.tasks.length);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={group.tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <section className="flex flex-col gap-2">
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
      </SortableContext>
    </DndContext>
  );
}

export function TaskList({ ideaId }: TaskListProps) {
  const { t } = useTranslation();
  const query = useTasks(ideaId);
  const queryClient = useQueryClient();
  const reorderMutation = useReorderTasks(ideaId);

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

  function handleReorder(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const queryKey = ["ideas", ideaId, "tasks"];
    const current = queryClient.getQueryData<Task[]>(queryKey) ?? tasks;
    const currentGroups = groupTasksByMilestone(current);
    const groupIndex = currentGroups.findIndex((group) =>
      group.tasks.some((task) => task.id === active.id),
    );
    if (groupIndex < 0) {
      return;
    }

    const group = currentGroups[groupIndex];
    const oldIndex = group.tasks.findIndex((task) => task.id === active.id);
    const newIndex = group.tasks.findIndex((task) => task.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const reordered = arrayMove(group.tasks, oldIndex, newIndex);
    const nextGroups = currentGroups.map((currentGroup, index) =>
      index === groupIndex ? { ...currentGroup, tasks: reordered } : currentGroup,
    );
    const flat = nextGroups.flatMap((currentGroup) => currentGroup.tasks);

    const originalOrder = new Map(current.map((task, index) => [task.id, index]));
    const payloads = flat
      .map((task, index) => ({ taskId: task.id, sortOrder: index }))
      .filter((payload) => originalOrder.get(payload.taskId) !== payload.sortOrder);

    queryClient.setQueryData<Task[]>(queryKey, flat);

    reorderMutation.mutateAsync(payloads).catch(() => {
      void queryClient.invalidateQueries({ queryKey });
      toast.error(t("ideas.tasks.reorderError"));
    });
  }

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

      {groups.map((group) => (
        <TaskGroupSection
          key={group.milestone ?? ""}
          group={group}
          ideaId={ideaId}
          onDragEnd={(event) => handleReorder(event)}
        />
      ))}
    </div>
  );
}