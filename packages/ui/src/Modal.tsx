import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative flex w-full max-w-md flex-col gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-xl outline-none"
      >
        {title ? (
          <h2 className="text-lg font-semibold text-[var(--color-fg)]">{title}</h2>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-muted)]/10 hover:text-[var(--color-fg)]"
        >
          ✕
        </button>

        <div className="text-[var(--color-fg)]">{children}</div>

        {footer ? (
          <div className="mt-2 flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
