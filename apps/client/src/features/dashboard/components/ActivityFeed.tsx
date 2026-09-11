import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@repo/ui";
import type { ActivityItem } from "@repo/shared";

import { ideaDetailPath } from "@config/routes";
import { useActivity } from "../hooks/useActivity";
import { ActivityFeedSkeleton } from "./skeletons";

const DOT_CLASSES: Record<ActivityItem["type"], string> = {
  IDEA_CREATED: "bg-[var(--color-success)]",
  IDEA_UPDATED: "bg-[var(--color-info)]",
  COMMENT: "bg-[var(--color-warning)]",
  SHARE: "bg-[var(--color-accent)]",
};

interface ActivityRowProps {
  item: ActivityItem;
  dateFormatter: Intl.DateTimeFormat;
  typeLabel: string;
}

function ActivityRow({ item, dateFormatter, typeLabel }: ActivityRowProps) {
  return (
    <li className="flex items-start gap-3 py-2 first:pt-0 last:pb-0">
      <span
        className={`mt-1 size-2 shrink-0 rounded-full ${DOT_CLASSES[item.type]}`}
      />
      <div className="flex flex-col gap-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-medium text-[var(--color-fg)]">
            {typeLabel}
          </span>
          <Link
            to={ideaDetailPath(item.ideaId)}
            className="text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            {item.ideaTitle}
          </Link>
        </div>
        {item.meta?.text ? (
          <p className="line-clamp-2 text-xs text-[var(--color-muted)]">
            {item.meta.text}
          </p>
        ) : null}
        <time className="text-xs text-[var(--color-muted)]">
          {dateFormatter.format(new Date(item.createdAt))}
        </time>
      </div>
    </li>
  );
}

export function ActivityFeed() {
  const { t, i18n } = useTranslation();
  const query = useActivity();

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [i18n.language],
  );

  if (query.isLoading) {
    return <ActivityFeedSkeleton />;
  }

  if (query.isError) {
    return (
      <Card className="p-4">
        <p className="text-sm text-[var(--color-danger)]">
          {t("dashboard.activity.loadError")}
        </p>
      </Card>
    );
  }

  const items = query.data ?? [];

  if (items.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-[var(--color-muted)]">
          {t("dashboard.activity.empty")}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-[var(--color-fg)]">
        {t("dashboard.activity.title")}
      </h2>
      <ul className="flex flex-col divide-y divide-[var(--color-border)]">
        {items.map((item) => (
          <ActivityRow
            key={item.id}
            item={item}
            dateFormatter={dateFormatter}
            typeLabel={t(`dashboard.activity.${item.type}`)}
          />
        ))}
      </ul>
    </Card>
  );
}