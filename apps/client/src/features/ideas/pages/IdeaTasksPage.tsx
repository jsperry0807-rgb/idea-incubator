import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ideaDetailPath } from '@config/routes';
import { useIdea } from '../hooks/useIdea';
import { TaskBoard } from '../components/TaskBoard';
import { IdeaDetailSkeleton } from '../components/IdeaSkeletons';

export default function IdeaTasksPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const ideaQuery = useIdea(id);

  if (ideaQuery.isLoading) {
    return <IdeaDetailSkeleton />;
  }

  if (ideaQuery.isError || !ideaQuery.data) {
    return (
      <section className="flex flex-col items-center gap-3 py-12">
        <p className="text-sm text-[var(--color-danger)]">{t('ideas.detail.loadError')}</p>
        <Link to={ideaDetailPath(id)} className="text-sm text-[var(--color-primary)] underline">
          {t('ideas.board.backToIdea')}
        </Link>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <Link
          to={ideaDetailPath(id)}
          className="text-sm text-[var(--color-muted)] underline transition-colors hover:text-[var(--color-fg)]"
        >
          {t('ideas.board.backToIdea')}
        </Link>
        <h1 className="text-xl font-bold text-[var(--color-fg)]">{ideaQuery.data.title}</h1>
        <p className="text-sm text-[var(--color-muted)]">{t('ideas.board.subtitle')}</p>
      </header>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]">
        <TaskBoard ideaId={id} />
      </div>
    </section>
  );
}
