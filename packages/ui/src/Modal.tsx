import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Accessible name for the dialog. Required only when `title` is omitted. */
  ariaLabel?: string;
  /** Accessible name for the close button. Override to localise. */
  closeLabel?: string;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.offsetParent !== null || element === document.activeElement
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  ariaLabel,
  closeLabel,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);

  // Every call site passes an inline arrow, so `onClose` changes identity on each
  // parent render. Holding it in a ref keeps it out of the effect dependencies
  // below — otherwise the effect re-runs on every render and yanks focus back to
  // the panel, which breaks typing in any modal containing a field.
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onCloseRef.current();
      return;
    }

    if (event.key !== 'Tab') return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusable = getFocusableElements(panel);
    if (focusable.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !panel.contains(active)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last || !panel.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Restore the value that was there rather than assuming '' — a parent that
      // had already locked scrolling must stay locked.
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : ariaLabel}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={() => onCloseRef.current()}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative flex w-full max-w-md flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-[var(--color-card-fg)] shadow-[var(--shadow-xl)] outline-none motion-safe:animate-[modal-in_200ms_var(--ease-out)]"
      >
        {title ? (
          <h2 id={titleId} className="pr-8 text-lg font-semibold text-[var(--color-fg)]">
            {title}
          </h2>
        ) : null}

        <button
          type="button"
          onClick={() => onCloseRef.current()}
          aria-label={closeLabel ?? 'Close'}
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
    document.body
  );
}
