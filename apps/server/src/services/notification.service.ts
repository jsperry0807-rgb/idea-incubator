import prisma from "../lib/prisma";
import { NotFoundError } from "../lib/errors";
import type { Notification, NotificationListQuery } from "@repo/shared";

export async function listNotifications(
  userId: string,
  query: NotificationListQuery,
): Promise<{ items: Notification[]; unreadCount: number }> {
  const [notifications, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { userId, ...(query.unread ? { read: false } : {}) },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({
      where: { userId, read: false },
    }),
  ]);

  return {
    items: notifications.map(toNotificationDto),
    unreadCount,
  };
}

export async function markNotificationRead(
  userId: string,
  id: string,
): Promise<Notification> {
  const existing = await prisma.notification.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError("Notification not found");
  }

  const notification = await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  return toNotificationDto(notification);
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<{ updated: number }> {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return { updated: result.count };
}

function toNotificationDto(notification: {
  id: string;
  userId: string;
  type: Notification["type"];
  message: string;
  ideaId: string | null;
  read: boolean;
  createdAt: Date;
}): Notification {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    message: notification.message,
    ideaId: notification.ideaId,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}