type Tone = "accent" | "success" | "warning" | "danger" | "info";

export interface ProgressBarProps {
  value: number;
  ariaLabel?: string;
  tone?: Tone;
  className?: string;
}

const fillClasses: Record<Tone, string> = {
  accent: "bg-[var(--color-accent)]",
  success: "bg-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]",
  danger: "bg-[var(--color-danger)]",
  info: "bg-[var(--color-info)]",
};

export function ProgressBar({ value, ariaLabel, tone = "accent", className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={[
        "h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-muted)]/20",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "h-full rounded-full transition-[width] duration-[var(--motion-slow)] ease-[var(--ease-out)]",
          fillClasses[tone],
        ].join(" ")}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}