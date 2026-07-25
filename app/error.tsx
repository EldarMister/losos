"use client";

import { useEffect } from "react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep the technical details in the browser console while customers see a clear recovery action.
    console.error("Storefront render failed");
  }, []);

  return <main className="site-fallback" role="alert">
    <div className="site-fallback-card">
      <span className="site-fallback-mark">МЛ</span>
      <b>Не удалось открыть меню</b>
      <span>Проверьте интернет и попробуйте ещё раз.</span>
      <button type="button" onClick={reset}>Повторить</button>
    </div>
  </main>;
}
