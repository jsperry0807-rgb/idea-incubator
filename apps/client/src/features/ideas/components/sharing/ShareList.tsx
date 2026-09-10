import { useTranslation } from "react-i18next";
import { Skeleton, toast } from "@repo/ui";
import type { Share, ShareRole } from "@repo/shared";

import { useShareMutations } from "../../hooks/useShareMutations";
import { useShares } from "../../hooks/useShares";
import { AccessRoleSelect } from "./AccessRoleSelect";

const AVATAR_COLORS = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function shareAvatar(share: Share) {
  const name = share.user?.name ?? share.userId;
  const color =
    AVATAR_COLORS[
      [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0) %
        AVATAR_COLORS.length
    ];

  if (share.user?.avatarUrl) {
    return (
      <img
        src={share.user.avatarUrl}
        alt=""
        className="size-9 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${color}`}
    >
      {initials(name)}
    </span>
  );
}

interface ShareRowProps {
  share: Share;
  ideaId: string;
}

function ShareRow({ share, ideaId }: ShareRowProps) {
  const { t } = useTranslation();
  const { changeRole, remove } = useShareMutations(ideaId);
  const busy = changeRole.isPending || remove.isPending;

  async function handleRoleChange(role: ShareRole) {
    try {
      await changeRole.mutateAsync({ shareId: share.id, role });
      toast.success(t("ideas.sharing.roleUpdated"));
    } catch {
      toast.error(t("ideas.sharing.updateRoleError"));
    }
  }

  async function handleRemove() {
    try {
      await remove.mutateAsync(share.id);
      toast.success(t("ideas.sharing.removed"));
    } catch {
      toast.error(t("ideas.sharing.removeError"));
    }
  }

  return (
    <li className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
      {shareAvatar(share)}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--color-fg)]">
          {share.user?.name}
        </p>
        <p className="truncate text-xs text-[var(--color-muted)]">
          {share.user?.email}
        </p>
      </div>
      <AccessRoleSelect
        value={share.role}
        onChange={(role) => void handleRoleChange(role)}
        disabled={busy}
        ariaLabel={t("ideas.sharing.changeRole", { name: share.user?.name ?? "" })}
      />
      <button
        type="button"
        onClick={() => void handleRemove()}
        disabled={busy}
        className="shrink-0 px-2 py-1 text-sm text-[var(--color-danger)] transition-colors hover:opacity-80 disabled:pointer-events-none disabled:opacity-50"
      >
        {t("ideas.sharing.remove")}
      </button>
    </li>
  );
}

export interface ShareListProps {
  ideaId: string;
}

export function ShareList({ ideaId }: ShareListProps) {
  const { t } = useTranslation();
  const query = useShares(ideaId);

  if (query.isLoading) {
    return (
      <ul className="flex flex-col gap-3" role="status" aria-busy="true">
        <span className="sr-only">{t("app.loading")}</span>
        {Array.from({ length: 3 }, (_, index) => (
          <li key={index} className="flex items-center gap-3 py-2">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-6 w-20 rounded-md" />
          </li>
        ))}
      </ul>
    );
  }

  if (query.isError) {
    return (
      <p className="text-sm text-[var(--color-danger)]">
        {t("ideas.sharing.loadError")}
      </p>
    );
  }

  const shares = query.data ?? [];

  if (shares.length === 0) {
    return (
      <p className="py-3 text-sm text-[var(--color-muted)]">
        {t("ideas.sharing.emptyAccess")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-[var(--color-border)]">
      {shares.map((share) => (
        <ShareRow key={share.id} share={share} ideaId={ideaId} />
      ))}
    </ul>
  );
}