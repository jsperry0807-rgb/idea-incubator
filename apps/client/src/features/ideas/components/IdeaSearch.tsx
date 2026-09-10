import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";

export interface IdeaSearchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onDebouncedChange: (value: string) => void;
  debounceMs?: number;
  shortcut?: boolean;
}

export function IdeaSearch({
  value,
  onDebouncedChange,
  debounceMs = 300,
  shortcut = true,
  placeholder,
  className,
  ...props
}: IdeaSearchProps) {
  const [inputValue, setInputValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const timerRef = useRef<number | null>(null);

  if (prevValue !== value) {
    setPrevValue(value);
    setInputValue(value);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (next: string) => {
    setInputValue(next);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      onDebouncedChange(next.trim());
    }, debounceMs);
  };

  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
        ⌕
      </span>
      <input
        type="search"
        data-shortcut={shortcut ? "search" : undefined}
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={[
          "w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 pl-9 pr-12 text-[var(--color-fg)] outline-none transition-[border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/40",
          className,
        ].join(" ")}
        {...props}
      />
      {shortcut ? (
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-[var(--color-border)] bg-[var(--color-muted)]/10 px-1.5 py-0.5 text-xs text-[var(--color-muted)]">
          /
        </kbd>
      ) : null}
    </div>
  );
}