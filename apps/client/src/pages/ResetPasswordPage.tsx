import { Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@config/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  if (!token) {
    return <Navigate to={ROUTES.NOT_FOUND} replace />;
  }

  return (
    <section className="page-container flex min-h-[70vh] flex-col items-center justify-center gap-2">
      <h1 className="m-0 text-[1.75rem] font-extrabold text-[var(--color-fg)]">
        {t('auth.reset.title')}
      </h1>
      <p className="mb-6 m-0 text-[var(--color-muted)]">{t('auth.reset.subtitle')}</p>
      <div className="w-full max-w-sm">
        <ResetPasswordForm token={token} />
      </div>
    </section>
  );
}
