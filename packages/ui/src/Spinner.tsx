import type { HTMLAttributes } from "react";

type Size = "sm" | "md" | "lg";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: Size;
}

const sizeClasses: Record<Size, string> = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-8 border-4",
};

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={[
        "inline-block animate-spin rounded-full border-[var(--color-border)] border-t-[var(--color-accent)]",
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
