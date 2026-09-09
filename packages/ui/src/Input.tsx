import type { InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({ label, error, icon, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--color-fg)]"
        >
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
          id={inputId}
          className={[
            "w-full rounded-[var(--radius)] border bg-[var(--color-bg)] text-[var(--color-fg)] text-base outline-none transition-[border-color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40",
            icon ? "py-2.5 pl-10 pr-3" : "px-3 py-2.5",
            error ? "border-[var(--color-danger)]" : "border-[var(--color-border)]",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
      </div>

      {error ? (
        <span className="text-[13px] text-[var(--color-danger)]">{error}</span>
      ) : null}
    </div>
  );
}
