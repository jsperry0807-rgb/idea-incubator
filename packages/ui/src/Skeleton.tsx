import type { HTMLAttributes } from 'react';

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      // Intentionally no size defaults. Tailwind resolves conflicting utilities by
      // stylesheet order, not class-attribute order, so a base `h-4 w-full` here
      // could silently override a caller's `size-9` or `h-1/2`.
      className={[
        'relative overflow-hidden rounded-[var(--radius)] bg-[var(--color-muted)]/15',
        'after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-[var(--color-card)]/60 after:to-transparent',
        'motion-safe:after:animate-[shimmer_1.5s_infinite]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
