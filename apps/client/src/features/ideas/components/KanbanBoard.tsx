import { useTranslation } from "react-i18next";
import { IDEA_STATUS_VALUES } from "@repo/shared";
import { Spinner } from "@repo/ui";

import { usePipeline } from "../hooks/usePipeline";
import { KanbanColumn } from "./KanbanColumn";

export function KanbanBoard() {
  const { t } = useTranslation();
  const query = usePipeline();

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (query.isError) {
    return <p className="text-sm text-[var(--color-danger)]">{t("ideas.pipeline.loadError")}</p>;
  }

  if (!query.data) {
    return null;
  }

  const pipeline = query.data;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {IDEA_STATUS_VALUES.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          ideas={pipeline[status]}
        />
      ))}
    </div>
  );
}