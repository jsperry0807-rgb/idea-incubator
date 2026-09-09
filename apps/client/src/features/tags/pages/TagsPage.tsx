import { useTranslation } from "react-i18next";
import { Card } from "@repo/ui";

import { TagManager } from "../components/TagManager";

export default function TagsPage() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold">{t("tags.title")}</h1>
        <p className="text-sm text-[var(--color-muted)]">{t("tags.subtitle")}</p>
      </header>

      <Card>
        <TagManager />
      </Card>
    </section>
  );
}