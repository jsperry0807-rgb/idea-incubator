import {
  Children,
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and disables the button while truthy. */
  isLoading?: boolean;
  /**
   * Merge button styling onto the single child element instead of rendering a
   * <button>. Use this when the button must navigate, so you get one interactive
   * element rather than the invalid `<a><button></a>` nesting.
   */
  asChild?: boolean;
  /**
   * Forwarded to the underlying <button>. `ref` lives in `ClassAttributes`, not
   * `ButtonHTMLAttributes`, so it has to be declared here for consumers to be
   * able to focus the button imperatively (React 19 passes it as a plain prop).
   */
  ref?: Ref<HTMLButtonElement>;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[var(--color-accent)] text-[var(--color-accent-fg)] border border-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] hover:border-[var(--color-accent-hover)]',
  secondary:
    'bg-[var(--color-bg)] text-[var(--color-fg)] border border-[var(--color-border)] hover:bg-[var(--color-muted)]/10 hover:border-[var(--color-border-strong)]',
  ghost:
    'bg-transparent text-[var(--color-fg)] border border-transparent hover:bg-[var(--color-muted)]/10',
  danger:
    'bg-[var(--color-danger)] text-[var(--color-danger-fg)] border border-[var(--color-danger)] hover:opacity-90',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

/**
 * Minimal single-child style merging so `asChild` does not need a slot library.
 * The child keeps ownership of its own href/onClick; we only contribute classes
 * and composed handlers. `ref` is deliberately handled by the caller.
 */
function mergeSlotProps(
  childProps: Record<string, unknown>,
  ownProps: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...ownProps };

  for (const key of Object.keys(ownProps)) {
    const own = ownProps[key];
    const child = childProps[key];

    if (typeof own === 'function' && typeof child === 'function' && /^on[A-Z]/.test(key)) {
      merged[key] = (...args: unknown[]) => {
        (child as (...a: unknown[]) => unknown)(...args);
        return (own as (...a: unknown[]) => unknown)(...args);
      };
      continue;
    }

    if (key === 'className') {
      merged[key] = [child, own].filter(Boolean).join(' ');
      continue;
    }

    if (key === 'style' && typeof child === 'object' && child !== null && typeof own === 'object') {
      merged[key] = { ...(child as object), ...(own as object) };
      continue;
    }
  }

  return merged;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  type = 'button',
  ref,
  asChild = false,
  ...props
}: ButtonProps) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-medium transition-[background-color,border-color,opacity,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]',
    'active:scale-[0.98]',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
    'disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {isLoading ? <Spinner size="sm" className="text-current" /> : null}
      {children}
    </>
  );

  if (asChild) {
    const child = Children.only(children);

    if (!isValidElement<Record<string, unknown>>(child)) {
      throw new Error('Button: `asChild` requires exactly one valid React element as its child.');
    }

    const inert = disabled || isLoading;
    const slotProps = mergeSlotProps(child.props, {
      ...props,
      className: classes,
      // `disabled` is meaningless on an <a>, so express it the accessible way.
      'aria-disabled': inert || undefined,
      ...(inert ? { tabIndex: -1 } : {}),
    });

    if (ref === undefined) return cloneElement(child, slotProps);

    // `react-hooks/refs` cannot tell that this is a ref *prop* being forwarded to
    // the cloned child rather than a `useRef` box being read during render.
    // eslint-disable-next-line react-hooks/refs
    return cloneElement(child, { ...slotProps, ref });
  }

  return (
    <button ref={ref} type={type} disabled={disabled || isLoading} className={classes} {...props}>
      {content}
    </button>
  );
}
