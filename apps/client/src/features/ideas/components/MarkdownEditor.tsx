import type { TextareaHTMLAttributes } from "react";
import { Textarea } from "@repo/ui";

export interface MarkdownEditorProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({
  value,
  onChange,
  className,
  id,
  ...props
}: MarkdownEditorProps) {
  return (
    <Textarea
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={["min-h-48 font-mono", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}