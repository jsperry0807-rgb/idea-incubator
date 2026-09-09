import {
  IDEA_STATUS_VALUES,
  type DashboardStats,
  type IdeaStatus,
} from "@repo/shared";

import prisma from "../lib/prisma";

export async function getStats(userId: string): Promise<DashboardStats> {
  const [statusRows, totalTasks, completedTasks] = await prisma.$transaction([
    prisma.idea.groupBy({
      by: ["status"],
      where: { userId },
      _count: { id: true },
    }),
    prisma.task.aggregate({
      where: { idea: { userId } },
      _count: { _all: true },
    }),
    prisma.task.aggregate({
      where: { idea: { userId }, completed: true },
      _count: { _all: true },
    }),
  ]);

  const byStatus = Object.fromEntries(
    IDEA_STATUS_VALUES.map((status) => [status, 0]),
  ) as Record<IdeaStatus, number>;

  let totalIdeas = 0;
  for (const row of statusRows) {
    byStatus[row.status] = row._count.id;
    totalIdeas += row._count.id;
  }

  return {
    totalIdeas,
    byStatus,
    totalTasks: totalTasks._count._all,
    completedTasks: completedTasks._count._all,
  };
}