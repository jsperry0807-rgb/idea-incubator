import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PlanningSectionName } from "@repo/shared";
import { Button, Spinner, Textarea, toast } from "@repo/ui";

import { usePlanningSection } from "../hooks/usePlanningSection";
import { useCreatePlanningSection } from "../hooks/useCreatePlanningSection";
import { useUpdatePlanningSection } from "../hooks/useUpdatePlanningSection";
import { ImportMarkdownModal } from "./ImportMarkdownModal";
import { MarkdownViewer } from "./MarkdownViewer";

export interface PlanningSectionProps {
  ideaId: string;
  section: PlanningSectionName;
}

export function PlanningSection({ ideaId, section }: PlanningSectionProps) {
  const { t } = useTranslation();
  const query = usePlanningSection(ideaId, section);
  const createMutation = useCreatePlanningSection();
  const updateMutation = useUpdatePlanningSection();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  if (query.isLoading) {
    return (
      <div className="flex justify-center px-4 pb-4">
        <Spinner size="md" />
      </div>
    );
  }

  const notFound =
    (query.error as { response?: { status?: number } } | undefined)?.response
      ?.status === 404;

  if (notFound) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 pb-4 text-center">
        <p className="text-sm text-[var(--color-muted)]">
          {t("ideas.planning.emptyDescription")}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void handleCreate()}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending
            ? t("ideas.planning.creating")
            : t("ideas.planning.createSection", { filename: `${section}.md` })}
        </Button>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="px-4 pb-4">
        <p className="text-sm text-[var(--color-danger)]">
          {t("ideas.planning.loadError")}
        </p>
      </div>
    );
  }

  const content = query.data?.content ?? "";

  async function handleCreate() {
    try {
      await createMutation.mutateAsync({ ideaId, section });
      toast.success(t("ideas.planning.created"));
    } catch {
      toast.error(t("ideas.planning.createError"));
    }
  }

  function startEdit() {
    setDraft(content);
    setEditing(true);
  }

  async function handleSave() {
    try {
      await updateMutation.mutateAsync({ ideaId, section, content: draft });
      toast.success(t("ideas.planning.saved"));
      setEditing(false);
    } catch {
      toast.error(t("ideas.planning.saveError"));
    }
  }

  function handleCancel() {
    setEditing(false);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2 px-4 pb-4">
      {editing ? (
        <>
          <Textarea
            className="min-h-48 font-mono"
            aria-label={t(`ideas.planning.sections.${section}`)}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
            >
              {t("ideas.planning.cancel")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleSave()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending
                ? t("ideas.planning.saving")
                : t("ideas.planning.save")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImportOpen(true)}
            >
              {t("ideas.planning.import")}
            </Button>
            <Button variant="ghost" size="sm" onClick={startEdit}>
              {t("ideas.planning.edit")}
            </Button>
          </div>
          <div className="max-h-96 overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-3">
            <MarkdownViewer content={content} />
          </div>
        </>
      )}

      <ImportMarkdownModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        section={section}
        onImport={async (importedContent) => {
          await updateMutation.mutateAsync({
            ideaId,
            section,
            content: importedContent,
          });
          toast.success(t("ideas.planning.imported"));
        }}
      />
    </div>
  );
}