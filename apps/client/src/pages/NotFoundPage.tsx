import { Link } from "react-router-dom";
import { ROUTES } from "@config/routes";

export default function NotFoundPage() {
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        paddingBlock: "6rem",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "6rem", fontWeight: 800, lineHeight: 1, color: "var(--color-muted)" }}>
        404
      </h1>
      <p style={{ fontSize: "1.125rem", color: "var(--color-muted)" }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        to={ROUTES.HOME}
        style={{
          marginTop: "1rem",
          padding: "0.625rem 1.25rem",
          borderRadius: "var(--radius)",
          backgroundColor: "var(--color-accent)",
          color: "#fff",
          fontWeight: 500,
          textDecoration: "none",
        }}
      >
        Back to Home
      </Link>
    </section>
  );
}
