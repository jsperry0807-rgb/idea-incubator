import type { IdeaPriority, Tag } from "@repo/shared";
import { IDEA_PRIORITY_VALUES } from "@repo/shared";
import { useTranslation } from "react-i18next";

import { SORT_OPTIONS, STATUS_TABS, type IdeaFilters } from "../types";

interface IdeaFiltersProps {
  filters: IdeaFilters;
  tags: Tag[];
  onChange: (patch: Partial<IdeaFilters>) => void;
}

const selectClasses =
  "rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40";

export function IdeaFilters({ filters, tags, onChange }: IdeaFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {STATUS_TABS.map((tab) => {
          const active = filters.status === tab || (tab === "ALL" && !filters.status);
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() =>
                onChange({ status: tab === "ALL" ? undefined : tab })
              }
              className={[
                "rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
                active
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium"
                  : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)] hover:text-[var(--color-fg)]",
              ].join(" ")}
            >
              {t(`ideas.status.${tab}`)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
          {t("ideas.filter.priority")}
          <select
            className={selectClasses}
            value={filters.priority ?? ""}
            onChange={(e) =>
              onChange({ priority: e.target.value as IdeaPriority | "" })
            }
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
            value={filters.tagId ?? ""}
            onChange={(e) => onChange({ tagId: e.target.value || undefined })}
          >
            <option value="">{t("ideas.filter.all")}</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
          {t("ideas.filter.sort")}
          <select
            className={selectClasses}
            value={`${filters.sort}-${filters.order}`}
            onChange={(e) => {
              const opt = SORT_OPTIONS.find((o) => o.value === e.target.value);
              if (opt) onChange({ sort: opt.sort, order: opt.order });
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}