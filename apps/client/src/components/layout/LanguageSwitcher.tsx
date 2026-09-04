import { useTranslation } from "react-i18next";

import { LOCALES } from "@i18n";
import type { Locale } from "@i18n";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? "en";

  return (
    <select
      aria-label="Language"
      value={current}
      onChange={(event) => void i18n.changeLanguage(event.target.value)}
      style={{
        background: "var(--color-bg)",
        color: "var(--color-fg)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius)",
        padding: "0.25rem 0.5rem",
        fontSize: "0.875rem",
        cursor: "pointer",
      }}
    >
      {LOCALES.map((locale) => (
        <option key={locale} value={locale}>
          {LOCALE_LABELS[locale]}
        </option>
      ))}
    </select>
  );
}