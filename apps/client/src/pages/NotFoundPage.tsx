import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@repo/ui';
import { ROUTES } from '@config/routes';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="page-container flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="m-0 text-6xl font-extrabold leading-none text-[var(--color-muted)]">
        {t('errors.notFound.title')}
      </h1>
      <p className="m-0 text-lg text-[var(--color-muted)]">{t('errors.notFound.description')}</p>
      <Button asChild className="mt-4">
        <Link to={ROUTES.HOME} className="no-underline hover:no-underline">
          {t('errors.notFound.backToHome')}
        </Link>
      </Button>
    </section>
  );
}
