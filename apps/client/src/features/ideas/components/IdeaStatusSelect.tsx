import { useTranslation } from 'react-i18next';
import { IDEA_STATUS_VALUES, type Idea, type IdeaStatus } from '@repo/shared';
import { toast } from '@repo/ui';

import { useUpdateIdeaStatus } from '../hooks/useUpdateIdeaStatus';

export interface IdeaStatusSelectProps {
  idea: Idea;
}

export function IdeaStatusSelect({ idea }: IdeaStatusSelectProps) {
  const { t } = useTranslation();
  const statusMutation = useUpdateIdeaStatus();

  const handleChange = (status: IdeaStatus) => {
    if (status === idea.status) {
      return;
    }
    try {
      void statusMutation.mutateAsync(
        { ideaId: idea.id, status },
        {
          onSuccess: () => toast.success(t('ideas.detail.statusUpdated')),
          onError: () => toast.error(t('ideas.detail.statusUpdateError')),
        }
      );
    } catch {
      toast.error(t('ideas.detail.statusUpdateError'));
    }
  };

  return (
    <select
      value={idea.status}
      onChange={(event) => handleChange(event.target.value as IdeaStatus)}
      disabled={statusMutation.isPending}
      aria-label={t('ideas.detail.status')}
      className={[
        'rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-sm text-[var(--color-fg)]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
        'disabled:pointer-events-none disabled:opacity-50',
      ].join(' ')}
    >
      {IDEA_STATUS_VALUES.map((status) => (
        <option key={status} value={status}>
          {t(`ideas.status.${status}`)}
        </option>
      ))}
    </select>
  );
}
