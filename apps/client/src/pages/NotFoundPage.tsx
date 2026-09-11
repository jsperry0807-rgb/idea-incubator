import { Link } from "react-router-dom";
import { Button } from "@repo/ui";
import { ROUTES } from "@config/routes";

export default function NotFoundPage() {
  return (
    <section className="page-container flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="m-0 text-6xl font-extrabold leading-none text-[var(--color-muted)]">
        404
      </h1>
      <p className="m-0 text-lg text-[var(--color-muted)]">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link to={ROUTES.HOME} className="mt-4 no-underline hover:no-underline">
        <Button>Back to Home</Button>
      </Link>
    </section>
  );
}
