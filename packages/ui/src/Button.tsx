import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and disables the button while truthy. */
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] text-[var(--color-accent-fg)] border border-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] hover:border-[var(--color-accent-hover)]",
  secondary:
    "bg-[var(--color-bg)] text-[var(--color-fg)] border border-[var(--color-border)] hover:bg-[var(--color-muted)]/10 hover:border-[var(--color-border-strong)]",
  ghost:
    "bg-transparent text-[var(--color-fg)] border border-transparent hover:bg-[var(--color-muted)]/10",
  danger:
    "bg-[var(--color-danger)] text-[var(--color-danger-fg)] border border-[var(--color-danger)] hover:opacity-90",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-medium transition-[background-color,border-color,opacity,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
        "active:scale-[0.98]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {isLoading ? <Spinner size="sm" className="text-current" /> : null}
      {children}
    </button>
  );
}
