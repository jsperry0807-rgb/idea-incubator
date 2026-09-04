import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border border-dashed border-[var(--color-border)] px-6 py-12 text-center">
      {icon ? <div className="text-[var(--color-muted)]">{icon}</div> : null}
      <h3 className="text-base font-semibold text-[var(--color-fg)]">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm text-[var(--color-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
