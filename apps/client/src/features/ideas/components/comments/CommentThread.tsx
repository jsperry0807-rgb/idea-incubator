import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@repo/ui";

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
        <div className="flex justify-center py-6">
          <Spinner size="md" />
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