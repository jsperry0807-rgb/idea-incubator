import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  IdeaPriority,
  IdeaStatus,
} from "@repo/shared";
import { Button, Card, Input, Spinner, Textarea, toast } from "@repo/ui";

import { ROUTES } from "@config/routes";
import { useTags } from "@features/tags/hooks/useTags";
import { useCreateIdea } from "../hooks/useCreateIdea";
import { PriorityDot } from "./PriorityDot";

const STATUS_OPTIONS: Array<{
  value: IdeaStatus;
  labelKey: `ideas.status.${IdeaStatus}`;
}> = [
  { value: IdeaStatus.IDEA, labelKey: "ideas.status.IDEA" },
  { value: IdeaStatus.PLANNING, labelKey: "ideas.status.PLANNING" },
  { value: IdeaStatus.PLANNED, labelKey: "ideas.status.PLANNED" },
  { value: IdeaStatus.IN_PROGRESS, labelKey: "ideas.status.IN_PROGRESS" },
  { value: IdeaStatus.DONE, labelKey: "ideas.status.DONE" },
  { value: IdeaStatus.ARCHIVED, labelKey: "ideas.status.ARCHIVED" },
];

const PRIORITY_OPTIONS: Array<{
  value: IdeaPriority;
  labelKey: `ideas.priority.${IdeaPriority}`;
}> = [
  { value: IdeaPriority.NONE, labelKey: "ideas.priority.NONE" },
  { value: IdeaPriority.LOW, labelKey: "ideas.priority.LOW" },
  { value: IdeaPriority.MEDIUM, labelKey: "ideas.priority.MEDIUM" },
  { value: IdeaPriority.HIGH, labelKey: "ideas.priority.HIGH" },
  { value: IdeaPriority.CRITICAL, labelKey: "ideas.priority.CRITICAL" },
];

const PLANNING_FILES = [
  { name: "overview.md", onDemand: false },
  { name: "tech-stack.md", onDemand: false },
  { name: "features.md", onDemand: false },
  { name: "timeline.md", onDemand: false },
  { name: "risks.md", onDemand: true },
];

function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "my-new-idea";
}

export function CreateIdeaForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IdeaStatus>(IdeaStatus.IDEA);
  const [priority, setPriority] = useState<IdeaPriority>(IdeaPriority.NONE);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const createIdeaMutation = useCreateIdea();
  const tagsQuery = useTags();

  const toggleTag = (id: string) => {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError(t("ideas.create.titleRequired"));
      return;
    }

    try {
      await createIdeaMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        tagIds: tagIds.length > 0 ? tagIds : undefined,
      });
      toast.success(t("ideas.create.success"));
      navigate(ROUTES.IDEAS, { replace: true });
    } catch {
      setError(t("ideas.create.error"));
    }
  }

  const folderName = slugify(title);
  const isSubmitting = createIdeaMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Input
          name="title"
          type="text"
          label={t("ideas.create.titleLabel")}
          placeholder={t("ideas.create.titlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />
        <p className="text-xs text-[var(--color-muted)]">
          {t("ideas.create.titleHint", { folder: `${folderName}/` })}
        </p>
      </div>

      <Textarea
        name="description"
        label={t("ideas.create.description")}
        placeholder={t("ideas.create.descriptionPlaceholder")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t("ideas.create.status")}</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={status === opt.value}
              onClick={() => setStatus(opt.value)}
              className={[
                "rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
                status === opt.value
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-fg)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-muted)]/10",
              ].join(" ")}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t("ideas.create.priority")}</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={priority === opt.value}
              onClick={() => setPriority(opt.value)}
              className={[
                "flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
                priority === opt.value
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-fg)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-muted)]/10",
              ].join(" ")}
            >
              <PriorityDot priority={opt.value} />
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t("ideas.create.tags")}</legend>

        {tagsQuery.isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : (tagsQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">{t("ideas.create.tagsEmpty")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(tagsQuery.data ?? []).map((tag) => {
              const selected = tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleTag(tag.id)}
                  className={[
                    "rounded-md border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
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
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t("ideas.create.folder")}</legend>
        <Card className="flex flex-col gap-1 bg-[var(--color-muted)]/10 p-4 font-mono text-xs leading-6">
          <span className="flex items-center gap-1.5 font-semibold text-[var(--color-fg)]">
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            {folderName}/
          </span>
          {PLANNING_FILES.map((file) => (
            <span
              key={file.name}
              className={`flex items-center gap-1.5 pl-6 ${file.onDemand ? "text-[var(--color-muted)]/60" : "text-[var(--color-muted)]"}`}
            >
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              </svg>
              {file.name}
              {file.onDemand ? ` ${t("ideas.create.folderOnDemand")}` : ""}
            </span>
          ))}
        </Card>
      </fieldset>

      {error ? (
        <p className="m-0 text-sm text-[var(--color-danger)]">{error}</p>
      ) : null}

      <div className="flex justify-between gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(ROUTES.IDEAS)}
        >
          {t("ideas.create.cancel")}
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {t("ideas.create.submit")}
        </Button>
      </div>
    </form>
  );
}