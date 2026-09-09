import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { CreateTagInput, Tag } from "@repo/shared";
import { Button, Input } from "@repo/ui";

const DEFAULT_COLOR = "#6b7280";

interface TagFormProps {
  mode: "create" | "edit";
  initial?: Tag;
  isSubmitting: boolean;
  onSubmit: (input: CreateTagInput) => Promise<void>;
  onCancel: () => void;
}

export function TagForm({ mode, initial, isSubmitting, onSubmit, onCancel }: TagFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t("tags.nameRequired"));
      return;
    }

    try {
      await onSubmit({ name: name.trim(), color });
    } catch (err) {
      const axiosErr = err as { response?: { status?: number } };
      setError(
        axiosErr.response?.status === 409 ? t("tags.errorConflict") : t("tags.saveError"),
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3"
    >
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        aria-label={t("tags.color")}
        className="h-9 w-10 cursor-pointer rounded-md border border-[var(--color-border)] bg-transparent p-1"
      />

      <div className="min-w-40 flex-1">
        <Input
          name="tag-name"
          type="text"
          label={t("tags.name")}
          placeholder={t("tags.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "…" : mode === "create" ? t("tags.create") : t("tags.save")}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("tags.cancel")}
        </Button>
      </div>

      {error ? (
        <p className="m-0 w-full text-sm text-[var(--color-danger)]">{error}</p>
      ) : null}
    </form>
  );
}