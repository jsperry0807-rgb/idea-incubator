import { useTranslation } from "react-i18next";
import type { Idea } from "@repo/shared";
import { Spinner, toast } from "@repo/ui";

import { useTags } from "@features/tags/hooks/useTags";
import { useUpdateIdea } from "../hooks/useUpdateIdea";

export function IdeaTagEditor({ idea }: { idea: Idea }) {
  const { t } = useTranslation();
  const tagsQuery = useTags();
  const updateMutation = useUpdateIdea();

  const attachedIds = new Set(idea.tags.map(({ tagId }) => tagId));

  function toggleTag(tagId: string) {
    const next = attachedIds.has(tagId)
      ? idea.tags.filter((entry) => entry.tagId !== tagId).map((entry) => entry.tagId)
      : [...idea.tags.map((entry) => entry.tagId), tagId];

    updateMutation.mutate(
      { id: idea.id, input: { tagIds: next } },
      {
        onSuccess: () => toast.success(t("ideas.detail.tagsUpdated")),
        onError: () => toast.error(t("ideas.detail.tagsError")),
      },
    );
  }

  if (tagsQuery.isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner />
      </div>
    );
  }

  if ((tagsQuery.data ?? []).length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        {t("ideas.detail.tagsEmpty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-[var(--color-muted)]">
        {t("ideas.detail.tagsHint")}
      </p>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-busy={updateMutation.isPending}
      >
        {(tagsQuery.data ?? []).map((tag) => {
          const selected = attachedIds.has(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              aria-pressed={selected}
              disabled={updateMutation.isPending}
              onClick={() => toggleTag(tag.id)}
              className={[
                "rounded-md border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-50",
                selected
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-fg)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-muted)]/10",
              ].join(" ")}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
