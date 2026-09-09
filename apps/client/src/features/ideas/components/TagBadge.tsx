import type { Tag } from "@repo/shared";

export function TagBadge({ tag }: { tag: Tag }) {
  const style = tag.color
    ? { backgroundColor: `${tag.color}22`, color: tag.color, borderColor: `${tag.color}55` }
    : undefined;

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        tag.color ? "" : "bg-[var(--color-muted)]/10 text-[var(--color-fg)] border-[var(--color-border)]",
      ].join(" ")}
      style={style}
    >
      {tag.name}
    </span>
  );
}