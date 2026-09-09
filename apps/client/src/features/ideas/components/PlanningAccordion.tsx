import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PLANNING_SECTION_NAMES, type PlanningSectionName } from "@repo/shared";

import { PlanningSection } from "./PlanningSection";

export interface PlanningAccordionProps {
  ideaId: string;
}

export function PlanningAccordion({ ideaId }: PlanningAccordionProps) {
  const { t } = useTranslation();
  const [requested, setRequested] = useState<
    Partial<Record<PlanningSectionName, boolean>>
  >({});

  return (
    <div className="flex flex-col items-stretch gap-2">
      {PLANNING_SECTION_NAMES.map((section) => (
        <details
          key={section}
          className="group rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)]"
          onToggle={(event) => {
            if (event.currentTarget.open) {
              setRequested((prev) =>
                prev[section] ? prev : { ...prev, [section]: true },
              );
            }
          }}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
            {t(`ideas.planning.sections.${section}`)}
            <ChevronDown className="text-[var(--color-muted)] transition-transform duration-150 group-open:rotate-180" />
          </summary>
          {requested[section] ? (
            <PlanningSection ideaId={ideaId} section={section} />
          ) : null}
        </details>
      ))}
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}