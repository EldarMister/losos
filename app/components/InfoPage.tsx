import type { ReactNode } from "react";

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="info-page-logo" src="/logo.webp" alt="Накта суши" />
          <a className="info-page-back" href="/">Вернуться в меню</a>
        </header>
        <article className="info-page-card">
          <h1>{title}</h1>
          {children}
          {action ? <a className="info-page-action" href={action.href}>{action.label}</a> : null}
        </article>
      </div>
    </main>
  );
}
