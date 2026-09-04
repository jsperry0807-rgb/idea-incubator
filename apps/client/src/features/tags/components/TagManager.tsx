import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Tag } from "@repo/shared";
import { Button, Spinner, EmptyState, toast } from "@repo/ui";

import { TagBadge } from "@features/ideas/components/TagBadge";
import { useCreateTag } from "../hooks/useCreateTag";
import { useDeleteTag } from "../hooks/useDeleteTag";
import { useTags } from "../hooks/useTags";
import { useUpdateTag } from "../hooks/useUpdateTag";
import { TagForm } from "./TagForm";

export function TagManager() {
  const { t } = useTranslation();

  const tagsQuery = useTags();
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const confirmTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimer.current !== null) window.clearTimeout(confirmTimer.current);
    };
  }, []);

  function requestDelete(id: string) {
    setConfirmingDeleteId(id);
    if (confirmTimer.current !== null) window.clearTimeout(confirmTimer.current);
    confirmTimer.current = window.setTimeout(() => setConfirmingDeleteId(null), 3000);
  }

  async function confirmDelete(tag: Tag) {
    setConfirmingDeleteId(null);
    if (confirmTimer.current !== null) {
      window.clearTimeout(confirmTimer.current);
      confirmTimer.current = null;
    }
    try {
      await deleteMutation.mutateAsync(tag.id);
      toast.success(t("tags.deleted"));
    } catch {
      toast.error(t("tags.deleteError"));
    }
  }

  async function handleCreate(input: Parameters<typeof createMutation.mutateAsync>[0]) {
    await createMutation.mutateAsync(input);
    setCreating(false);
    toast.success(t("tags.created"));
  }

  async function handleUpdate(input: Parameters<typeof updateMutation.mutateAsync>[0]) {
    await updateMutation.mutateAsync(input);
    setEditingId(null);
    toast.success(t("tags.updated"));
  }

  const tags = tagsQuery.data ?? [];

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-muted)]">
          {tags.length === 1 ? "1" : String(tags.length)} {t("tags.count")}
        </p>
        <Button variant="secondary" size="sm" onClick={() => setCreating((v) => !v)}>
          {creating ? t("tags.cancel") : `+ ${t("tags.newTag")}`}
        </Button>
      </div>

      {creating ? (
        <TagForm
          mode="create"
          isSubmitting={createMutation.isPending}
          onSubmit={handleCreate}
          onCancel={() => setCreating(false)}
        />
      ) : null}

      {tagsQuery.isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      ) : tags.length === 0 ? (
        <EmptyState
          title={t("tags.emptyTitle")}
          description={t("tags.emptyDescription")}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3"
            >
              {editingId === tag.id ? (
                <TagForm
                  mode="edit"
                  initial={tag}
                  isSubmitting={updateMutation.isPending}
                  onSubmit={(input) => handleUpdate({ id: tag.id, input })}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <TagBadge tag={tag} />
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(tag.id)}>
                      {t("tags.edit")}
                    </Button>
                    {confirmingDeleteId === tag.id ? (
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        onClick={() => void confirmDelete(tag)}
                      >
                        {t("tags.deleteConfirm")}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => requestDelete(tag.id)}
                      >
                        {t("tags.delete")}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}