import type { TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, id, className, ...props }: TextareaProps) {
  const inputId = id ?? props.name;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-fg)]">
          {label}
        </label>
      ) : null}

      <textarea
        id={inputId}
        className={[
          "w-full rounded-[var(--radius-sm)] border bg-[var(--color-bg)] px-3 py-2.5 text-[var(--color-fg)] text-base outline-none transition-[border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
          "placeholder:text-[var(--color-muted-fg)] resize-y",
          "hover:border-[var(--color-border-strong)]",
          "focus-visible:border-[var(--color-accent)] focus-visible:ring-4 focus-visible:ring-[var(--color-accent)]/20",
          "disabled:cursor-not-allowed disabled:bg-[var(--color-muted)]/5 disabled:opacity-60",
          error ? "border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]/20" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />

      {error ? (
        <span className="text-[13px] text-[var(--color-danger)]">{error}</span>
      ) : null}
    </div>
  );
}
