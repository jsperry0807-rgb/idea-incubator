import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-card)]/50 px-6 py-12 text-center">
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-[var(--color-fg)]">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm text-[var(--color-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
