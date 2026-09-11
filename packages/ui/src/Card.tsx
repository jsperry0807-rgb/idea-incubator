import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Adds hover lift + border tint for clickable cards. */
  interactive?: boolean;
  /** Padding scale. Defaults to "md". */
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6 sm:p-8",
};

export function Card({
  children,
  className,
  interactive = false,
  padding = "md",
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-card-fg)] shadow-[var(--shadow-sm)]",
        interactive
          ? "cursor-pointer transition-[border-color,box-shadow,transform] duration-[var(--motion-normal)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)] active:translate-y-0"
          : "",
        paddingClasses[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
