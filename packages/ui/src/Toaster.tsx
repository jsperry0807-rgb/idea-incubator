import { createPortal } from 'react-dom';

import { dismissToast, useToasts } from './toast-store';
import type { Toast, ToastTone } from './toast-store';

const toneClasses: Record<ToastTone, string> = {
  success: 'border-[var(--color-success)]/40 text-[var(--color-success)]',
  error: 'border-[var(--color-danger)]/40 text-[var(--color-danger)]',
  info: 'border-[var(--color-info)]/40 text-[var(--color-info)]',
};

const dotClasses: Record<ToastTone, string> = {
  success: 'bg-[var(--color-success)]',
  error: 'bg-[var(--color-danger)]',
  info: 'bg-[var(--color-info)]',
};

export interface ToasterProps {
  /** Accessible name for each toast's dismiss button. Override to localise. */
  dismissLabel?: string;
}

const regionClass = 'flex flex-col gap-2';

export function Toaster({ dismissLabel }: ToasterProps) {
  const toasts = useToasts();

  if (typeof document === 'undefined') return null;

  // Two sibling live regions rather than one region with a nested `role="status"`
  // on each toast: nesting makes every toast announce twice, and a polite parent
  // downgrades `role="alert"` children to polite. Errors are split out here so
  // they can be assertive while everything else stays polite.
  const errors = toasts.filter((t) => t.tone === 'error');
  const notices = toasts.filter((t) => t.tone !== 'error');

  function renderToast(t: Toast) {
    return (
      <div
        key={t.id}
        className={[
          'pointer-events-auto flex items-center gap-2 rounded-md border bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-card-fg)] shadow-[var(--shadow-lg)] animate-[toast-in_var(--motion-normal)_var(--ease-out)]',
          toneClasses[t.tone],
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className={['size-2 shrink-0 rounded-full', dotClasses[t.tone]].join(' ')}
        />
        <span className="flex-1">{t.message}</span>
        <button
          type="button"
          onClick={() => dismissToast(t.id)}
          aria-label={dismissLabel ?? 'Dismiss'}
          className="ml-2 rounded text-current opacity-60 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        >
          ✕
        </button>
      </div>
    );
  }

  return createPortal(
    // The wrapper only positions and is deliberately not a live region.
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      <div aria-live="polite" aria-atomic="false" className={regionClass}>
        {notices.map(renderToast)}
      </div>
      {/* aria-atomic so the whole message is read, not just the added tail. */}
      <div aria-live="assertive" aria-atomic="true" className={regionClass}>
        {errors.map(renderToast)}
      </div>
    </div>,
    document.body
  );
}
