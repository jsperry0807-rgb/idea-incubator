import type { IdeaStatus } from '@repo/shared';
import { Badge } from '@repo/ui';
import { useTranslation } from 'react-i18next';

const STATUS_TONE = {
  IDEA: 'neutral',
  PLANNING: 'info',
  PLANNED: 'warning',
  IN_PROGRESS: 'primary',
  DONE: 'success',
  ARCHIVED: 'neutral',
} as const satisfies Record<IdeaStatus, 'neutral' | 'primary' | 'success' | 'warning' | 'info'>;

export function StatusBadge({ status }: { status: IdeaStatus }) {
  const { t } = useTranslation();

  return (
    <Badge tone={STATUS_TONE[status]} dot>
      {t(`ideas.status.${status}`)}
    </Badge>
  );
}
