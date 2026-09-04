import { useTranslation } from "react-i18next";

import { Button } from "@repo/ui";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBlock: "4rem" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1.2 }}>
        {t("home.welcome")}
      </h1>
      <p style={{ fontSize: "1.125rem", color: "var(--color-muted)", maxWidth: "36rem" }}>
        {t("home.subtitle")}
      </p>
      <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
        <Button
          onClick={() => window.open("https://github.com", "_blank", "noopener,noreferrer")}
        >
          {t("home.docs")}
        </Button>
      </div>
    </section>
  );
}
