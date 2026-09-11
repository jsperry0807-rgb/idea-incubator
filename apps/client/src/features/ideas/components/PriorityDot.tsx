import { useTranslation } from "react-i18next";
import type { IdeaPriority } from "@repo/shared";

const DOT_CLASSES: Record<IdeaPriority, string> = {
  NONE: "bg-transparent border border-[var(--color-border)]",
  LOW: "bg-[var(--color-muted)]/70",
  MEDIUM: "bg-[var(--color-warning)]",
  HIGH: "bg-[var(--color-accent-cta)]",
  CRITICAL: "bg-[var(--color-danger)]",
};

export function PriorityDot({ priority }: { priority: IdeaPriority }) {
  const { t } = useTranslation();
  const label = t(`ideas.priority.${priority}`);
  return (
    <span
      title={label}
      aria-label={t("ideas.priority.label", { priority: label })}
      className={["inline-block size-2.5 shrink-0 rounded-full", DOT_CLASSES[priority]].join(" ")}
    />
  );
}