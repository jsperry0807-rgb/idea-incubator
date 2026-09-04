import type { HTMLAttributes, ReactNode } from "react";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  neutral: "bg-[var(--color-muted)]/10 text-[var(--color-fg)] border-[var(--color-border)]",
  primary: "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/30",
  success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  danger: "bg-red-500/10 text-red-600 border-red-500/30",
  info: "bg-sky-500/10 text-sky-600 border-sky-500/30",
};

export function Badge({ children, tone = "neutral", className, ...props }: BadgeProps) {
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
      {children}
    </span>
  );
}
