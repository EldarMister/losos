import type { ReactNode } from "react";
import Link from "next/link";

export function InfoPage({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <main className="info-page">
      <div className="info-page-shell">
        <header className="info-page-header">
          <Link
            aria-label="Вернуться в меню"
            className="info-page-back"
            href="/"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M19 12H5m6 6-6-6 6-6" />
            </svg>
          </Link>
          <h1>{title}</h1>
        </header>
        <article className="info-page-card">
          {children}
          {action ? <a className="info-page-action" href={action.href}>{action.label}</a> : null}
        </article>
      </div>
    </main>
  );
}
