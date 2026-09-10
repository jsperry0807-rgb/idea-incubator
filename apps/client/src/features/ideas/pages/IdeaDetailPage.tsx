import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card, EmptyState, Spinner } from "@repo/ui";

import { useAuth } from "@features/auth/hooks/useAuth";
import { ROUTES } from "@config/routes";
import { useIdea } from "../hooks/useIdea";
import { PlanningAccordion } from "../components/PlanningAccordion";
import { PriorityDot } from "../components/PriorityDot";
import { ShareModal } from "../components/sharing/ShareModal";
import { StatusBadge } from "../components/StatusBadge";
import { TagBadge } from "../components/TagBadge";
import { TaskList } from "../components/TaskList";

export default function IdeaDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);

  const ideaQuery = useIdea(id);
  const isLoading = ideaQuery.isLoading;
  const notFound =
    (ideaQuery.error as { response?: { status?: number } } | undefined)
      ?.response?.status === 404;
  const isOwner = Boolean(
    user && ideaQuery.data && ideaQuery.data.userId === user.id,
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [i18n.language],
  );

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <Link
        to={ROUTES.IDEAS}
        className="w-fit text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
      >
        ← {t("ideas.detail.back")}
      </Link>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : notFound ? (
        <EmptyState
          title={t("ideas.detail.notFoundTitle")}
          description={t("ideas.detail.notFoundDescription")}
        />
      ) : ideaQuery.error ? (
        <EmptyState
          title={t("ideas.detail.loadError")}
          description={t("ideas.detail.loadErrorDescription")}
        />
      ) : ideaQuery.data ? (
        <article className="flex flex-col gap-5">
          <header className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PriorityDot priority={ideaQuery.data.priority} />
                <StatusBadge status={ideaQuery.data.status} />
              </div>
              {isOwner ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShareOpen(true)}
                >
                  {t("ideas.sharing.button")}
                </Button>
              ) : null}
            </div>
            <h1 className="text-2xl font-extrabold">{ideaQuery.data.title}</h1>
            {ideaQuery.data.description ? (
              <p className="whitespace-pre-wrap text-[var(--color-muted)]">
                {ideaQuery.data.description}
              </p>
            ) : null}
          </header>

          <Card className="p-4">
            <dl className="grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                  {t("ideas.detail.status")}
                </dt>
                <dd>
                  <StatusBadge status={ideaQuery.data.status} />
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                  {t("ideas.detail.priority")}
                </dt>
                <dd className="flex items-center gap-2">
                  <PriorityDot priority={ideaQuery.data.priority} />
                  {t(`ideas.priority.${ideaQuery.data.priority}`)}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                  {t("ideas.detail.createdAt")}
                </dt>
                <dd className="text-[var(--color-fg)]">
                  {dateFormatter.format(new Date(ideaQuery.data.createdAt))}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                  {t("ideas.detail.updatedAt")}
                </dt>
                <dd className="text-[var(--color-fg)]">
                  {dateFormatter.format(new Date(ideaQuery.data.updatedAt))}
                </dd>
              </div>
            </dl>
          </Card>

          {ideaQuery.data.tags.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-medium">{t("ideas.detail.tags")}</h2>
              <div className="flex flex-wrap gap-1.5">
                {ideaQuery.data.tags.map(({ tagId, tag }) => (
                  <TagBadge key={tagId} tag={tag} />
                ))}
              </div>
            </div>
          ) : null}

          <section
            className="flex flex-col gap-3"
            aria-labelledby="idea-planning-heading"
          >
            <h2 id="idea-planning-heading" className="text-sm font-medium">
              {t("ideas.detail.planningTitle")}
            </h2>
            <PlanningAccordion ideaId={id} />
          </section>

          <section
            className="flex flex-col gap-3"
            aria-labelledby="idea-tasks-heading"
          >
            <h2 id="idea-tasks-heading" className="text-sm font-medium">
              {t("ideas.detail.tasksTitle")}
            </h2>
            <TaskList ideaId={id} />
          </section>
        </article>
      ) : null}

      {isOwner && ideaQuery.data ? (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          ideaId={id}
          ideaTitle={ideaQuery.data.title}
        />
      ) : null}
    </section>
  );
}