import {
  IDEA_STATUS_VALUES,
  type ActivityItem,
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

export async function getActivity(userId: string): Promise<ActivityItem[]> {
  const [ideas, comments, shares] = await prisma.$transaction([
    prisma.idea.findMany({
      where: { userId },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    }),
    prisma.comment.findMany({
      where: { idea: { userId } },
      select: {
        id: true,
        content: true,
        createdAt: true,
        ideaId: true,
        idea: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.share.findMany({
      where: { idea: { userId } },
      select: {
        id: true,
        role: true,
        createdAt: true,
        ideaId: true,
        idea: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const items: ActivityItem[] = [];

  for (const idea of ideas) {
    items.push({
      id: `idea:${idea.id}`,
      type: "IDEA_CREATED",
      ideaId: idea.id,
      ideaTitle: idea.title,
      createdAt: idea.createdAt.toISOString(),
    });

    if (idea.updatedAt.getTime() > idea.createdAt.getTime() + 1000) {
      items.push({
        id: `idea-updated:${idea.id}`,
        type: "IDEA_UPDATED",
        ideaId: idea.id,
        ideaTitle: idea.title,
        createdAt: idea.updatedAt.toISOString(),
      });
    }
  }

  for (const comment of comments) {
    items.push({
      id: `comment:${comment.id}`,
      type: "COMMENT",
      ideaId: comment.ideaId,
      ideaTitle: comment.idea.title,
      createdAt: comment.createdAt.toISOString(),
      meta: { text: comment.content },
    });
  }

  for (const share of shares) {
    items.push({
      id: `share:${share.id}`,
      type: "SHARE",
      ideaId: share.ideaId,
      ideaTitle: share.idea.title,
      createdAt: share.createdAt.toISOString(),
      meta: { role: share.role },
    });
  }

  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return items.slice(0, 10);
}