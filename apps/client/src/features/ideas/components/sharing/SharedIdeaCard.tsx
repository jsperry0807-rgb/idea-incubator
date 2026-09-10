import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@repo/ui";
import { ShareRole } from "@repo/shared";
import type { SharedIdea } from "@repo/shared";

import { ideaDetailPath } from "@config/routes";
import { PriorityDot } from "../PriorityDot";
import { StatusBadge } from "../StatusBadge";
import { TagBadge } from "../TagBadge";

const AVATAR_COLORS = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
];

function roleLabel(role: ShareRole) {
  return role === ShareRole.VIEW || role === ShareRole.EDIT
    ? (`ideas.sharing.role.${role}` as const)
    : ("ideas.sharing.role.VIEW" as const);
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function SharedIdeaCard({ item }: { item: SharedIdea }) {
  const { t } = useTranslation();
  const { idea, sharedBy, role } = item;

  const initialsName = sharedBy.name ?? sharedBy.id;
  const avatarColor =
    AVATAR_COLORS[
      [...initialsName].reduce((acc, char) => acc + char.charCodeAt(0), 0) %
        AVATAR_COLORS.length
    ];

  return (
    <Card className="flex flex-col gap-3 p-4 transition-shadow hover:shadow-md">
      <Link to={ideaDetailPath(idea.id)} className="flex h-full flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PriorityDot priority={idea.priority} />
            <StatusBadge status={idea.status} />
          </div>
          <span className="rounded-md border border-[var(--color-border)] px-2 py-0.5 text-xs font-medium text-[var(--color-muted)]">
            {t(roleLabel(role))}
          </span>
        </div>

        <h3 className="text-base font-semibold text-[var(--color-fg)]">
          {idea.title}
        </h3>

        {idea.description ? (
          <p className="line-clamp-2 text-sm text-[var(--color-muted)]">
            {idea.description}
          </p>
        ) : null}

        {idea.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {idea.tags.map(({ tagId, tag }) => (
              <TagBadge key={tagId} tag={tag} />
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center gap-2 pt-1">
          {sharedBy.avatarUrl ? (
            <img
              src={sharedBy.avatarUrl}
              alt=""
              className="size-6 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${avatarColor}`}
            >
              {initials(initialsName)}
            </span>
          )}
          <span className="text-xs text-[var(--color-muted)]">
            {t("ideas.shared.sharedBy", { name: sharedBy.name })}
          </span>
        </div>
      </Link>
    </Card>
  );
}