import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Task } from '@repo/shared';
import { EmptyState, Skeleton, toast } from '@repo/ui';

import { updateTask } from '../api/tasks';
import { useTasks } from '../hooks/useTasks';
import { AddTaskForm } from './AddTaskForm';
import { TaskCard } from './TaskCard';
import {
  TASK_BOARD_STATUSES,
  buildLanes,
  buildMovePayloads,
  cellId,
  cellTasks,
  parseCellId,
  type TaskBoardStatus,
} from '../lib/taskBoard';

export interface TaskBoardProps {
  ideaId: string;
}

const STATUS_LABEL_KEY = {
  TODO: 'ideas.board.status.todo',
  IN_PROGRESS: 'ideas.board.status.inProgress',
  DONE: 'ideas.board.status.done',
} as const satisfies Record<TaskBoardStatus, string>;

function BoardCell({
  ideaId,
  tasks,
  status,
  milestone,
}: {
  ideaId: string;
  tasks: Task[];
  status: TaskBoardStatus;
  milestone: string | null;
}) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({
    id: cellId(status, milestone),
  });

  return (
    <div
      ref={setNodeRef}
      className={[
        'min-h-16 rounded-md border border-dashed p-1.5 transition-colors',
        isOver
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
          : 'border-[var(--color-border)] bg-[var(--color-bg)]',
      ].join(' ')}
    >
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex list-none flex-col gap-1.5">
          {tasks.map((task) => (
            <TaskCard key={task.id} ideaId={ideaId} task={task} />
          ))}
        </ul>
      </SortableContext>
      {tasks.length === 0 ? (
        <p className="px-1 py-1 text-xs text-[var(--color-muted)]">{t('ideas.board.emptyCell')}</p>
      ) : null}
    </div>
  );
}

export function TaskBoard({ ideaId }: TaskBoardProps) {
  const { t } = useTranslation();
  const query = useTasks(ideaId);
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const queryKey = ['ideas', ideaId, 'tasks'] as const;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor)
  );

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-3 px-4 pb-4" role="status" aria-busy="true">
        <AddTaskForm ideaId={ideaId} />
        <span className="sr-only">{t('app.loading')}</span>
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="px-4 pb-4">
        <p className="text-sm text-[var(--color-danger)]">{t('ideas.tasks.loadError')}</p>
      </div>
    );
  }

  const tasks = query.data ?? [];

  function handleDragStart(event: DragStartEvent) {
    setActiveTask(tasks.find((task) => task.id === event.active.id) ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) {
      return;
    }

    const target = parseCellId(String(over.id));
    if (!target) {
      return;
    }

    const siblings = cellTasks(tasks, target.status, target.milestone);
    const overIndex = siblings.findIndex((task) => task.id === over.id);
    const index = overIndex >= 0 ? overIndex : siblings.length;

    const moves = buildMovePayloads(tasks, String(active.id), {
      status: target.status,
      milestone: target.milestone,
      index,
    });
    if (moves.length === 0) {
      return;
    }

    const previous = queryClient.getQueryData<Task[]>(queryKey);
    queryClient.setQueryData<Task[]>(queryKey, (current) =>
      current?.map((task) => {
        const move = moves.find((candidate) => candidate.taskId === task.id);
        if (!move) {
          return task;
        }
        return {
          ...task,
          sortOrder: move.sortOrder,
          status: move.status,
          milestone: move.milestone,
          completed: move.status === 'DONE',
        };
      })
    );

    try {
      await Promise.all(
        moves.map((move) =>
          updateTask(ideaId, move.taskId, {
            sortOrder: move.sortOrder,
            status: move.status,
            milestone: move.milestone,
          })
        )
      );
      void queryClient.invalidateQueries({ queryKey });
    } catch {
      if (previous) {
        queryClient.setQueryData(queryKey, previous);
      }
      toast.error(t('ideas.board.moveError'));
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col gap-3 px-4 pb-4">
        <AddTaskForm ideaId={ideaId} />
        <EmptyState
          title={t('ideas.tasks.emptyTitle')}
          description={t('ideas.tasks.emptyDescription')}
        />
      </div>
    );
  }

  const lanes = buildLanes(tasks);

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <AddTaskForm ideaId={ideaId} />

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTask(null)}
      >
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-[minmax(6rem,9rem)_repeat(3,minmax(0,1fr))] items-center gap-2">
            <span aria-hidden="true" />
            {TASK_BOARD_STATUSES.map((status) => (
              <h4 key={status} className="text-xs font-medium text-[var(--color-muted)]">
                {t(STATUS_LABEL_KEY[status])}
              </h4>
            ))}
          </div>

          {lanes.map((lane) => (
            <div
              key={lane.key}
              className="grid grid-cols-[minmax(6rem,9rem)_repeat(3,minmax(0,1fr))] items-start gap-2"
            >
              <h4 className="flex flex-col gap-0.5 pt-1.5 text-sm font-medium text-[var(--color-fg)]">
                <span className="break-words">
                  {lane.milestone ?? t('ideas.board.noMilestoneLane')}
                </span>
                <span className="text-xs font-normal text-[var(--color-muted)]">
                  {lane.milestone === null
                    ? t('ideas.board.unassigned')
                    : t('ideas.board.laneCount', { count: lane.tasks.length })}
                </span>
              </h4>
              {TASK_BOARD_STATUSES.map((status) => (
                <BoardCell
                  key={status}
                  ideaId={ideaId}
                  status={status}
                  milestone={lane.milestone}
                  tasks={cellTasks(tasks, status, lane.milestone)}
                />
              ))}
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard ideaId={ideaId} task={activeTask} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
