import { useTranslation } from "react-i18next";

import { KanbanBoard } from "../components/KanbanBoard";

export default function RoadmapPage() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold">{t("ideas.roadmap.title")}</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t("ideas.roadmap.subtitle")}
        </p>
      </header>

      <KanbanBoard />
    </section>
  );
}