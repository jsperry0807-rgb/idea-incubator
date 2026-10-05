import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  /** Forwarded to the underlying <input>. See the note on `ButtonProps.ref`. */
  ref?: Ref<HTMLInputElement>;
}

export function Input({ label, error, icon, id, className, ref, ...props }: InputProps) {
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

      <div className="relative flex items-center">
        {icon ? (
          <span className="pointer-events-none absolute left-3 flex text-[var(--color-muted)]">
            {icon}
          </span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : props['aria-describedby']}
          className={[
            'w-full rounded-[var(--radius-sm)] border bg-[var(--color-bg)] text-[var(--color-fg)] text-base outline-none transition-[border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-out)]',
            'placeholder:text-[var(--color-muted-fg)]',
            'hover:border-[var(--color-border-strong)]',
            'focus-visible:border-[var(--color-accent)] focus-visible:ring-4 focus-visible:ring-[var(--color-accent)]/20',
            'disabled:cursor-not-allowed disabled:bg-[var(--color-muted)]/5 disabled:opacity-60',
            icon ? 'py-2.5 pl-10 pr-3' : 'px-3 py-2.5',
            error ? 'border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]/20' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
      </div>

      {error ? (
        <span id={errorId} role="alert" className="text-[13px] text-[var(--color-danger)]">
          {error}
        </span>
      ) : null}
    </div>
  );
}
