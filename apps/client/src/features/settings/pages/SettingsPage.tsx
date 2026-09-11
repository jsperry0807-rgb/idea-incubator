import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input, toast } from "@repo/ui";

import { ROUTES } from "@config/routes";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useUIStore } from "@stores/ui.store";
import { LOCALES } from "@i18n";
import type { Locale } from "@i18n";

type ThemeOption = "light" | "dark" | "system";

const THEME_OPTIONS: ThemeOption[] = ["light", "dark", "system"];

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
};

function getDeleteError(
  status: number | undefined,
): "settings.danger.wrongPassword" | "settings.danger.deleteError" {
  return status === 401
    ? "settings.danger.wrongPassword"
    : "settings.danger.deleteError";
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, updateProfile, deleteAccount } = useAuth();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const currentLocale = i18n.resolvedLanguage ?? "en";

  const [name, setName] = useState(user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSaving(true);
    try {
      await updateProfile({ name: trimmedName, avatarUrl: avatarUrl.trim() || null });
      toast.success(t("settings.profile.saved"));
    } catch {
      toast.error(t("settings.profile.saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount(event: FormEvent) {
    event.preventDefault();
    if (!password.trim() || deleting) return;
    setDeleting(true);
    try {
      await deleteAccount(password);
      toast.success(t("settings.danger.deleted"));
      navigate(ROUTES.HOME, { replace: true });
    } catch (error) {
      const status = (error as { response?: { status?: number } } | undefined)
        ?.response?.status;
      toast.error(t(getDeleteError(status)));
    } finally {
      setDeleting(false);
    }
  }

  const pillClasses = (active: boolean) =>
    [
      "rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
      active
        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 font-medium text-[var(--color-fg)]"
        : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-muted)]/10",
    ].join(" ");

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-[var(--color-fg)]">
          {t("settings.title")}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">{t("settings.subtitle")}</p>
      </header>

      <Card className="flex flex-col gap-4 p-4">
        <h2 className="text-sm font-semibold text-[var(--color-fg)]">
          {t("settings.profile.title")}
        </h2>
        <form
          onSubmit={(event) => void handleSaveProfile(event)}
          className="flex flex-col gap-4"
        >
          <Input
            name="name"
            type="text"
            label={t("settings.profile.name")}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <Input
            name="avatarUrl"
            type="url"
            label={t("settings.profile.avatarUrl")}
            placeholder={t("settings.profile.avatarUrlPlaceholder")}
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={!name.trim()} isLoading={saving}>
              {t("settings.profile.save")}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="flex flex-col gap-4 p-4">
        <h2 className="text-sm font-semibold text-[var(--color-fg)]">
          {t("settings.theme.title")}
        </h2>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("settings.theme.title")}>
          {THEME_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={theme === option}
              onClick={() => setTheme(option)}
              className={pillClasses(theme === option)}
            >
              {t(`settings.theme.${option}`)}
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-4">
        <h2 className="text-sm font-semibold text-[var(--color-fg)]">
          {t("settings.language.title")}
        </h2>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label={t("settings.language.title")}
        >
          {LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              role="radio"
              aria-checked={currentLocale === locale}
              onClick={() => void i18n.changeLanguage(locale)}
              className={pillClasses(currentLocale === locale)}
            >
              {LOCALE_LABELS[locale]}
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-4 border-[var(--color-danger)]/30 p-4">
        <h2 className="text-sm font-semibold text-[var(--color-danger)]">
          {t("settings.danger.title")}
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          {t("settings.danger.description")}
        </p>

        {confirming ? (
          <form
            onSubmit={(event) => void handleDeleteAccount(event)}
            className="flex flex-col gap-3"
          >
            <p className="text-sm font-medium text-[var(--color-fg)]">
              {t("settings.danger.confirmTitle")}
            </p>
            <Input
              name="delete-password"
              type="password"
              label={t("settings.danger.password")}
              placeholder={t("settings.danger.passwordPlaceholder")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
              required
            />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setConfirming(false);
                  setPassword("");
                }}
                disabled={deleting}
              >
                {t("settings.danger.cancel")}
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={!password.trim()}
                isLoading={deleting}
              >
                {t("settings.danger.deleteForever")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex justify-end">
            <Button variant="danger" onClick={() => setConfirming(true)}>
              {t("settings.danger.delete")}
            </Button>
          </div>
        )}
      </Card>
    </section>
  );
}