import { TaskStatus, type Task } from "@repo/shared";

export const TASK_BOARD_STATUSES = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.DONE,
] as const;

export type TaskBoardStatus = (typeof TASK_BOARD_STATUSES)[number];

/** Sentinel lane key for tasks that have no milestone assigned. */
export const NO_MILESTONE_KEY = "__none__";

export interface TaskLane {
  key: string;
  milestone: string | null;
  tasks: Task[];
}

export interface TaskCell {
  status: TaskBoardStatus;
  milestone: string | null;
  tasks: Task[];
}

export function milestoneKey(milestone: string | null): string {
  return milestone && milestone.trim() !== "" ? milestone : NO_MILESTONE_KEY;
}

/**
 * Droppable ids encode both board axes so a single `over.id` resolves to a
 * cell. Milestones are free text and may contain the separator, so the lane
 * half is percent-encoded.
 */
export function cellId(status: TaskBoardStatus, milestone: string | null): string {
  return `${status}::${encodeURIComponent(milestoneKey(milestone))}`;
}

export function parseCellId(id: string): { status: TaskBoardStatus; milestone: string | null } | null {
  const separator = id.indexOf("::");
  if (separator === -1) {
    return null;
  }
  const status = id.slice(0, separator);
  if (!TASK_BOARD_STATUSES.includes(status as TaskBoardStatus)) {
    return null;
  }
  const key = decodeURIComponent(id.slice(separator + 2));
  return {
    status: status as TaskBoardStatus,
    milestone: key === NO_MILESTONE_KEY ? null : key,
  };
}

/** Unassigned tasks float to the top lane; milestones keep first-seen order. */
export function buildLanes(tasks: Task[]): TaskLane[] {
  const lanes = new Map<string, TaskLane>();
  for (const task of tasks) {
    const key = milestoneKey(task.milestone);
    const lane = lanes.get(key);
    if (lane) {
      lane.tasks.push(task);
    } else {
      lanes.set(key, { key, milestone: task.milestone, tasks: [task] });
    }
  }

  for (const lane of lanes.values()) {
    lane.tasks.sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
  }

  return [...lanes.values()].sort((a, b) => {
    if (a.milestone === null) {
      return -1;
    }
    if (b.milestone === null) {
      return 1;
    }
    return a.key.localeCompare(b.key);
  });
}

export function cellTasks(
  tasks: Task[],
  status: TaskBoardStatus,
  milestone: string | null,
): Task[] {
  const key = milestoneKey(milestone);
  return tasks
    .filter(
      (task) =>
        task.status === status && milestoneKey(task.milestone) === key,
    )
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

/** Lane-major flatten, so sortOrder stays a single global index per idea. */
export function flattenBoard(lanes: TaskLane[]): Task[] {
  return lanes.flatMap((lane) => lane.tasks);
}

export interface TaskMove {
  taskId: string;
  sortOrder: number;
  status: TaskBoardStatus;
  milestone: string | null;
}

export function sameCell(
  task: Task,
  status: TaskBoardStatus,
  milestone: string | null,
): boolean {
  return task.status === status && milestoneKey(task.milestone) === milestoneKey(milestone);
}

/**
 * Returns the minimal set of PATCH payloads needed to persist a move. Tasks
 * whose lane, status and index are all unchanged are omitted so a drag that
 * only shifts one card does not rewrite the whole board.
 */
export function buildMovePayloads(
  tasks: Task[],
  movedTaskId: string,
  target: { status: TaskBoardStatus; milestone: string | null; index: number },
): TaskMove[] {
  const lanes = buildLanes(tasks);

  let sourceLane: TaskLane | undefined;
  for (const lane of lanes) {
    if (lane.tasks.some((task) => task.id === movedTaskId)) {
      sourceLane = lane;
      break;
    }
  }
  if (!sourceLane) {
    return [];
  }

  const moving = sourceLane.tasks.find((task) => task.id === movedTaskId)!;

  const targetKey = milestoneKey(target.milestone);
  let targetLane = lanes.find((lane) => lane.key === targetKey);
  if (!targetLane) {
    targetLane = { key: targetKey, milestone: target.milestone, tasks: [] };
    lanes.push(targetLane);
  }

  const nextMilestone = target.milestone;
  const nextStatus = target.status;
  const rebucketed =
    nextStatus === "DONE" ? moving : { ...moving, status: nextStatus };

  sourceLane.tasks = sourceLane.tasks.filter((task) => task.id !== movedTaskId);

  const insertAt = Math.max(0, Math.min(target.index, targetLane.tasks.length));
  targetLane.tasks.splice(insertAt, 0, { ...rebucketed, milestone: nextMilestone });

  const flat = flattenBoard(lanes);
  const byId = new Map(tasks.map((task) => [task.id, task]));

  return flat
    .map((task, index) => ({
      taskId: task.id,
      sortOrder: index,
      status: task.status,
      milestone: task.milestone,
    }))
    .filter((move) => {
      const original = byId.get(move.taskId);
      if (!original) {
        return false;
      }
      return (
        original.sortOrder !== move.sortOrder ||
        original.status !== move.status ||
        milestoneKey(original.milestone) !== milestoneKey(move.milestone)
      );
    });
}
