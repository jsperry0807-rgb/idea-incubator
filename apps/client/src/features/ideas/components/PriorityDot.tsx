import type { IdeaPriority } from "@repo/shared";

const DOT_CLASSES: Record<IdeaPriority, string> = {
  NONE: "bg-transparent border border-[var(--color-border)]",
  LOW: "bg-zinc-400",
  MEDIUM: "bg-amber-400",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-red-500",
};

const LABELS: Record<IdeaPriority, string> = {
  NONE: "None",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export function PriorityDot({ priority }: { priority: IdeaPriority }) {
  return (
    <span
      title={LABELS[priority]}
      aria-label={`Priority: ${LABELS[priority]}`}
      className={["inline-block size-2.5 shrink-0 rounded-full", DOT_CLASSES[priority]].join(" ")}
    />
  );
}