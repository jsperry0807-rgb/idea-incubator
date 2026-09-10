import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@repo/ui";

import { useComments } from "../../hooks/useComments";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";

export interface CommentThreadProps {
  ideaId: string;
  ideaOwnerId?: string;
}

export function CommentThread({ ideaId, ideaOwnerId }: CommentThreadProps) {
  const { t, i18n } = useTranslation();
  const query = useComments(ideaId);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [i18n.language],
  );

  return (
    <div className="flex flex-col gap-4">
      {query.isLoading ? (
        <div className="flex flex-col gap-4" role="status" aria-busy="true">
          <span className="sr-only">{t("app.loading")}</span>
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-start gap-3">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : query.isError ? (
        <p className="text-sm text-[var(--color-danger)]">
          {t("ideas.comments.loadError")}
        </p>
      ) : (query.data ?? []).length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">
          {t("ideas.comments.empty")}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--color-border)]">
          {(query.data ?? []).map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              ideaId={ideaId}
              ideaOwnerId={ideaOwnerId}
              dateFormatter={dateFormatter}
            />
          ))}
        </ul>
      )}

      <CommentForm ideaId={ideaId} />
    </div>
  );
}