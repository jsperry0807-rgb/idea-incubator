import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card } from "@repo/ui";

import { ROUTES } from "@config/routes";
import { CreateIdeaForm } from "../components/CreateIdeaForm";

export default function CreateIdeaPage() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <Link
        to={ROUTES.IDEAS}
        className="w-fit text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
      >
        ← {t("ideas.create.back")}
      </Link>

      <h1 className="text-2xl font-extrabold">{t("ideas.create.title")}</h1>

      <Card>
        <CreateIdeaForm />
      </Card>
    </section>
  );
}