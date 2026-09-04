import { createPortal } from "react-dom";

import { dismissToast, useToasts } from "./toast-store";

const toneClasses: Record<string, string> = {
  success: "border-emerald-500/40 text-emerald-700",
  error: "border-red-500/40 text-red-700",
  info: "border-sky-500/40 text-sky-700",
};

const dotClasses: Record<string, string> = {
  success: "bg-emerald-500",
  error: "bg-red-500",
  info: "bg-sky-500",
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
            "pointer-events-auto flex items-center gap-2 rounded-md border bg-white px-4 py-3 text-sm shadow-lg",
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
