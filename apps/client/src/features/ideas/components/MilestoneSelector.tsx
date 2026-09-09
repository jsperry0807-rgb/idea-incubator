import { useId, type InputHTMLAttributes } from "react";

import { Input } from "@repo/ui";

export interface MilestoneSelectorProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "list" | "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  milestones: string[];
}

export function MilestoneSelector({
  value,
  onChange,
  milestones,
  ...props
}: MilestoneSelectorProps) {
  const listId = useId().replace(/:/g, "");

  return (
    <>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        list={listId}
        maxLength={100}
        {...props}
      />
      <datalist id={listId}>
        {milestones.map((milestone) => (
          <option key={milestone} value={milestone} />
        ))}
      </datalist>
    </>
  );
}