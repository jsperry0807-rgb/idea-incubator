import { useTranslation } from "react-i18next";
import type { PlanningSectionName } from "@repo/shared";
import { Spinner } from "@repo/ui";

import { usePlanningSection } from "../hooks/usePlanningSection";

export interface PlanningAccordionSectionProps {
  ideaId: string;
  section: PlanningSectionName;
}

export function PlanningAccordionSection({
  ideaId,
  section,
}: PlanningAccordionSectionProps) {
  const { t } = useTranslation();
  const query = usePlanningSection(ideaId, section);

  if (query.isLoading) {
    return (
      <div className="flex justify-center px-4 pb-4">
        <Spinner size="md" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="px-4 pb-4">
        <p className="text-sm text-[var(--color-danger)]">
          {t("ideas.planning.loadError")}
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-3 font-mono text-xs leading-relaxed text-[var(--color-fg)]">
        {query.data?.content ?? ""}
      </pre>
    </div>
  );
}