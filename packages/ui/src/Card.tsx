import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm",
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
