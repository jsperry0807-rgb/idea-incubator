import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Skeleton, toast } from "@repo/ui";
import type { Notification, NotificationType } from "@repo/shared";

import { ideaDetailPath } from "@config/routes";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";
import { useNotifications } from "../hooks/useNotifications";

const DOT_CLASSES: Record<NotificationType, string> = {
  SHARE: "bg-[var(--color-info)]",
  COMMENT: "bg-[var(--color-warning)]",
  MENTION: "bg-[var(--color-accent)]",
  TASK_COMPLETED: "bg-[var(--color-success)]",
};

export interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function NotificationPanel({
  open,
  onClose,
  anchorRef,
}: NotificationPanelProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const panelRef = useRef<HTMLDivElement>(null);
  const query = useNotifications();

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      toast.success(t("notifications.markedAll"));
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [i18n.language],
  );

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };

    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  async function handleSelect(notification: Notification) {
    if (!notification.read) {
      try {
        await markRead.mutateAsync(notification.id);
      } catch {
        toast.error(t("notifications.readError"));
      }
    }
    if (notification.ideaId) {
      navigate(ideaDetailPath(notification.ideaId));
    }
    onClose();
  }

  const items = query.data?.items ?? [];
  const unreadCount = query.data?.unreadCount ?? 0;

  return (
    <div
      ref={panelRef}
      role="menu"
      aria-label={t("notifications.title")}
      className="absolute right-0 top-full z-50 mt-2 flex max-h-[min(70vh,480px)] w-[min(24rem,90vw)] flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] shadow-xl"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--color-fg)]">
          {t("notifications.title")}
        </h2>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-xs text-[var(--color-accent)] transition-colors hover:opacity-80 disabled:pointer-events-none disabled:opacity-50"
          >
            {t("notifications.markAllRead")}
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto">
        {query.isLoading ? (
          <div className="flex flex-col gap-3 px-4 py-4" role="status" aria-busy="true">
            <span className="sr-only">{t("app.loading")}</span>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-start gap-3">
                <Skeleton className="size-3 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1">
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <p className="px-4 py-8 text-sm text-[var(--color-danger)]">
            {t("notifications.loadError")}
          </p>
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-sm text-[var(--color-muted)]">
            {t("notifications.empty")}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--color-border)]">
            {items.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleSelect(notification)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-muted)]/10"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${DOT_CLASSES[notification.type]}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`line-clamp-2 text-sm ${notification.read ? "text-[var(--color-muted)]" : "font-medium text-[var(--color-fg)]"}`}
                    >
                      {notification.message}
                    </span>
                    <time className="mt-0.5 block text-xs text-[var(--color-muted)]">
                      {dateFormatter.format(new Date(notification.createdAt))}
                    </time>
                  </span>
                  {!notification.read ? (
                    <span
                      aria-hidden="true"
                      className="mt-2 size-2 shrink-0 rounded-full bg-[var(--color-accent)]"
                    />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}