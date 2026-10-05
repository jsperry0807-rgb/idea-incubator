import { useId, type Ref, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  /** Forwarded to the underlying <textarea>. See the note on `ButtonProps.ref`. */
  ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea({ label, error, id, className, ref, ...props }: TextareaProps) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-fg)]">
          {label}
        </label>
      ) : null}

      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : props['aria-describedby']}
        className={[
          'w-full rounded-[var(--radius-sm)] border bg-[var(--color-bg)] px-3 py-2.5 text-[var(--color-fg)] text-base outline-none transition-[border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-out)]',
          'placeholder:text-[var(--color-muted-fg)] resize-y',
          'hover:border-[var(--color-border-strong)]',
          'focus-visible:border-[var(--color-accent)] focus-visible:ring-4 focus-visible:ring-[var(--color-accent)]/20',
          'disabled:cursor-not-allowed disabled:bg-[var(--color-muted)]/5 disabled:opacity-60',
          error ? 'border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]/20' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />

      {error ? (
        <span id={errorId} role="alert" className="text-[13px] text-[var(--color-danger)]">
          {error}
        </span>
      ) : null}
    </div>
  );
}
