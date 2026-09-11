import { createPortal } from "react-dom";

import { dismissToast, useToasts } from "./toast-store";

const toneClasses: Record<string, string> = {
  success: "border-[var(--color-success)]/40 text-[var(--color-success)]",
  error: "border-[var(--color-danger)]/40 text-[var(--color-danger)]",
  info: "border-[var(--color-info)]/40 text-[var(--color-info)]",
};

const dotClasses: Record<string, string> = {
  success: "bg-[var(--color-success)]",
  error: "bg-[var(--color-danger)]",
  info: "bg-[var(--color-info)]",
};

export function Toaster() {
  const toasts = useToasts();

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            "pointer-events-auto flex items-center gap-2 rounded-md border bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-card-fg)] shadow-[var(--shadow-lg)] animate-[toast-in_var(--motion-normal)_var(--ease-out)]",
            toneClasses[t.tone],
          ].join(" ")}
          role="status"
        >
          <span className={["size-2 shrink-0 rounded-full", dotClasses[t.tone]].join(" ")} />
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss"
            className="ml-2 text-current opacity-60 transition-opacity hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
