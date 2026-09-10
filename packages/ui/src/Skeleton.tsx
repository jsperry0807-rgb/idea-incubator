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
        "animate-pulse rounded-[var(--radius)] bg-[var(--color-muted)]/15 motion-reduce:animate-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}