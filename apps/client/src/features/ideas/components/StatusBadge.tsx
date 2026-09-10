import type { IdeaStatus } from "@repo/shared";

const STATUS_CLASSES: Record<IdeaStatus, string> = {
  IDEA: "bg-zinc-500/10 text-zinc-600 border-zinc-500/30 dark:text-zinc-300",
  PLANNING: "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:text-sky-300",
  PLANNED: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300",
  IN_PROGRESS: "bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-300",
  DONE: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  ARCHIVED: "bg-zinc-400/10 text-zinc-500 border-zinc-400/30 dark:text-zinc-400",
};

export function StatusBadge({ status }: { status: IdeaStatus }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        STATUS_CLASSES[status],
      ].join(" ")}
    >
      {status.replace("_", " ")}
    </span>
  );
}