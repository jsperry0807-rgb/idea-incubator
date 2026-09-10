import type { Notification } from "@repo/shared";

import { client } from "@/axios";

export interface NotificationsResponse {
  items: Notification[];
  unreadCount: number;
}

export async function getNotifications(
  signal?: AbortSignal,
  unreadOnly = false,
): Promise<NotificationsResponse> {
  const { data } = await client.get<{
    data: Notification[];
    meta: { unreadCount: number };
  }>("/notifications", {
    signal,
    params: unreadOnly ? { unread: true } : undefined,
  });
  return { items: data.data, unreadCount: data.meta.unreadCount };
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const { data } = await client.patch<{ data: Notification }>(
    `/notifications/${id}/read`,
  );
  return data.data;
}

export async function markAllNotificationsRead(): Promise<number> {
  const { data } = await client.post<{ data: { updated: number } }>(
    "/notifications/read-all",
  );
  return data.data.updated;
}