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
          "w-full rounded-[var(--radius)] border bg-[var(--color-bg)] px-3 py-2.5 text-[var(--color-fg)] text-base outline-none transition-[border-color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40",
          "placeholder:text-[var(--color-muted)] resize-y",
          error ? "border-[var(--color-danger)]" : "border-[var(--color-border)]",
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
