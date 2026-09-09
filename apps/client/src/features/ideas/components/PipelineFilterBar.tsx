import { useTranslation } from "react-i18next";
import { IDEA_PRIORITY_VALUES, type IdeaPriority, type Tag } from "@repo/shared";

const selectClasses =
  "rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40";

export interface PipelineFilterBarProps {
  tagId: string;
  priority: IdeaPriority | "";
  tags: Tag[];
  onTagChange: (value: string) => void;
  onPriorityChange: (value: IdeaPriority | "") => void;
}

export function PipelineFilterBar({
  tagId,
  priority,
  tags,
  onTagChange,
  onPriorityChange,
}: PipelineFilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        {t("ideas.filter.priority")}
        <select
          className={selectClasses}
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value as IdeaPriority | "")}
        >
          <option value="">{t("ideas.filter.all")}</option>
          {IDEA_PRIORITY_VALUES.map((p) => (
            <option key={p} value={p}>
              {t(`ideas.priority.${p}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        {t("ideas.filter.tag")}
        <select
          className={selectClasses}
          value={tagId}
          onChange={(e) => onTagChange(e.target.value)}
        >
          <option value="">{t("ideas.filter.all")}</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}