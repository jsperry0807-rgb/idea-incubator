import type { HTMLAttributes, ReactNode } from "react";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
  tone?: Tone;
  /** Shows a small leading dot in the tone color. */
  dot?: boolean;
}

const toneClasses: Record<Tone, string> = {
  neutral: "bg-[var(--color-muted)]/10 text-[var(--color-fg)] border-[var(--color-border)]",
  primary: "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/30",
  success: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30",
  warning: "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/30",
  danger: "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/30",
  info: "bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/30",
};

export function Badge({ children, tone = "neutral", dot = false, className, ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {dot ? (
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      ) : null}
      {children}
    </span>
  );
}
