import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Button, Input } from '@repo/ui';
import { ROUTES } from '@config/routes';
import { forgotPasswordRequest } from '../api/auth';
import { authErrorMessage } from '@utils/errors';

export function ForgotPasswordForm() {
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await forgotPasswordRequest({ email });
      setIsSent(true);
    } catch (err) {
      setError(authErrorMessage(err, t));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSent) {
    return (
      <div className="flex flex-col gap-3">
        <p className="m-0 text-sm text-[var(--color-fg)]">{t('auth.forgot.sentMessage')}</p>
        <p className="m-0 text-center text-sm text-[var(--color-muted)]">
          <Link to={ROUTES.LOGIN}>{t('auth.forgot.backToLogin')}</Link>
        </p>
      </div>
    );
  }

  return (
    <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
      <p className="m-0 text-sm text-[var(--color-muted)]">{t('auth.forgot.hint')}</p>
      <Input
        name="email"
        type="email"
        label={t('auth.forgot.email')}
        placeholder={t('auth.forgot.emailPlaceholder')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />

      {error ? <p className="m-0 text-sm text-[var(--color-danger)]">{error}</p> : null}

      <Button type="submit" isLoading={isSubmitting}>
        {t('auth.forgot.submit')}
      </Button>

      <p className="m-0 text-center text-sm text-[var(--color-muted)]">
        {t('auth.forgot.remembered')} <Link to={ROUTES.LOGIN}>{t('auth.forgot.backToLogin')}</Link>
      </p>
    </form>
  );
}
