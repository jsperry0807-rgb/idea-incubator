import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@repo/ui";
import type { Comment } from "@repo/shared";

import { useAuth } from "@features/auth/hooks/useAuth";
import { useCommentMutations } from "../../hooks/useCommentMutations";
import { CommentForm } from "./CommentForm";

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

function CommentAvatar({ comment }: { comment: Comment }) {
  const name = comment.user?.name ?? comment.userId;
  const color =
    AVATAR_COLORS[
      [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0) %
        AVATAR_COLORS.length
    ];

  if (comment.user?.avatarUrl) {
    return (
      <img
        src={comment.user.avatarUrl}
        alt=""
        className="size-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${color}`}
    >
      {initials(name)}
    </span>
  );
}

export interface CommentItemProps {
  comment: Comment;
  ideaId: string;
  ideaOwnerId?: string;
  dateFormatter: Intl.DateTimeFormat;
}

export function CommentItem({
  comment,
  ideaId,
  ideaOwnerId,
  dateFormatter,
}: CommentItemProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { update, remove } = useCommentMutations(ideaId);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isAuthor = Boolean(user && comment.user?.id === user.id);
  const isIdeaOwner = Boolean(ideaOwnerId && user?.id === ideaOwnerId);
  const canEdit = isAuthor;
  const canDelete = isAuthor || isIdeaOwner;
  const edited = comment.updatedAt !== comment.createdAt;

  const dateLabel = useMemo(
    () => dateFormatter.format(new Date(comment.createdAt)),
    [dateFormatter, comment.createdAt],
  );

  async function handleDelete() {
    try {
      await remove.mutateAsync(comment.id);
    } catch {
      toast.error(t("ideas.comments.deleteError"));
    }
  }

  const busy = update.isPending || remove.isPending;

  return (
    <li className="flex items-start gap-3 py-3">
      <CommentAvatar comment={comment} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-medium text-[var(--color-fg)]">
            {comment.user?.name}
          </span>
          <time className="text-xs text-[var(--color-muted)]">{dateLabel}</time>
          {edited ? (
            <span className="text-xs italic text-[var(--color-muted)]">
              {t("ideas.comments.edited")}
            </span>
          ) : null}
        </div>

        {editing ? (
          <div className="mt-2">
            <CommentForm
              ideaId={ideaId}
              commentId={comment.id}
              initialValue={comment.content}
              submitLabel={t("ideas.comments.save")}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-fg)]">
            {comment.content}
          </p>
        )}

        {!editing && (canEdit || canDelete) ? (
          <div className="mt-1 flex items-center gap-3">
            {canEdit ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={busy}
                className="text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-50"
              >
                {t("ideas.comments.edit")}
              </button>
            ) : null}
            {canDelete ? (
              confirmingDelete ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={busy}
                    className="text-xs font-medium text-[var(--color-danger)] transition-colors hover:opacity-80 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {t("ideas.comments.deleteConfirm")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={busy}
                    className="text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {t("ideas.comments.cancel")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={busy}
                  className="text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-danger)] disabled:pointer-events-none disabled:opacity-50"
                >
                  {t("ideas.comments.delete")}
                </button>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}