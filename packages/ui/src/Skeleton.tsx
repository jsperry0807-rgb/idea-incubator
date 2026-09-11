import type { CSSProperties } from "react";

export interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={[
        "relative overflow-hidden rounded-[var(--radius)] bg-[var(--color-muted)]/15",
        "after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-[var(--color-card)]/60 after:to-transparent",
        "motion-safe:after:animate-[shimmer_1.5s_infinite]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}