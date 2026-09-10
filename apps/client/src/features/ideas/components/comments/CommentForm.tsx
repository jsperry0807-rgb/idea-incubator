import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button, Textarea, toast } from "@repo/ui";

import { useCommentMutations } from "../../hooks/useCommentMutations";

export interface CommentFormProps {
  ideaId: string;
  commentId?: string;
  initialValue?: string;
  submitLabel?: string;
  onCancel?: () => void;
}

export function CommentForm({
  ideaId,
  commentId,
  initialValue,
  submitLabel,
  onCancel,
}: CommentFormProps) {
  const { t } = useTranslation();
  const mutations = useCommentMutations(ideaId);
  const isEdit = Boolean(initialValue);
  const isPending = mutations.create.isPending || mutations.update.isPending;

  const [content, setContent] = useState(initialValue ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isPending) return;

    try {
      if (isEdit) {
        if (!commentId) return;
        await mutations.update.mutateAsync({
          commentId,
          input: { content: trimmed },
        });
      } else {
        await mutations.create.mutateAsync({ content: trimmed });
      }
      setContent("");
      setError(null);
      onCancel?.();
    } catch {
      const message = isEdit
        ? t("ideas.comments.updateError")
        : t("ideas.comments.createError");
      setError(message);
      toast.error(message);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-2">
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={t("ideas.comments.placeholder")}
        aria-label={t("ideas.comments.placeholder")}
        rows={isEdit ? 3 : 2}
        error={error ?? undefined}
      />
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
          >
            {t("ideas.comments.cancel")}
          </Button>
        ) : null}
        <Button
          type="submit"
          size="sm"
          variant="primary"
          disabled={isPending || !content.trim()}
        >
          {isPending
            ? t("ideas.comments.submitting")
            : (submitLabel ?? t("ideas.comments.submit"))}
        </Button>
      </div>
    </form>
  );
}