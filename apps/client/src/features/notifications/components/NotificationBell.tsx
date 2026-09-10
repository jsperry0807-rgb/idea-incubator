import { useTranslation } from "react-i18next";

import { useNotifications } from "../hooks/useNotifications";

export interface NotificationBellProps {
  onClick?: () => void;
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const { t } = useTranslation();
  const query = useNotifications();
  const unreadCount = query.data?.unreadCount ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("app.nav.notifications")}
      title={t("app.nav.notifications")}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: 9999,
        color: "var(--color-muted)",
        background: "none",
        border: "none",
        padding: 0,
        cursor: onClick ? "pointer" : "default",
        fontFamily: "inherit",
      }}
    >
      <BellIcon />
      {unreadCount > 0 ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            minWidth: 16,
            height: 16,
            padding: "0 4px",
            borderRadius: 9999,
            backgroundColor: "var(--color-danger)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 600,
            lineHeight: "16px",
            textAlign: "center",
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="20"
      height="20"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}