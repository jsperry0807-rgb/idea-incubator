export interface ProgressBarProps {
  value: number;
  ariaLabel?: string;
  className?: string;
}

export function ProgressBar({ value, ariaLabel, className }: ProgressBarProps) {
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
        className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}