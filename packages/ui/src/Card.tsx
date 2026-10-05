import type { HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /**
   * Adds hover lift + border tint. When `onClick` is also supplied the card is
   * given `role="button"`, `tabIndex` and Enter/Space handling so it is
   * reachable by keyboard. Without `onClick` this is styling only.
   */
  interactive?: boolean;
  /** Padding scale. Defaults to "md". */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6 sm:p-8',
};

export function Card({
  children,
  className,
  interactive = false,
  padding = 'md',
  onClick,
  onKeyDown,
  ...props
}: CardProps) {
  const clickable = interactive && Boolean(onClick);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || !clickable) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.(event as unknown as MouseEvent<HTMLDivElement>);
    }
  }

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={clickable ? handleKeyDown : onKeyDown}
      className={[
        'rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-card-fg)] shadow-[var(--shadow-sm)]',
        interactive
          ? 'cursor-pointer transition-[border-color,box-shadow,transform] duration-[var(--motion-normal)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)] active:translate-y-0'
          : '',
        // Only add a focus ring where the card itself is the control. `interactive`
        // is also used purely for styling, where a nested <Link> is the real target
        // and supplies its own focus ring.
        clickable
          ? 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]'
          : '',
        paddingClasses[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
