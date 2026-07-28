"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  useEffect(() => {
    if (!measurementId) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
    window.gtag("js", new Date());
    window.gtag("config", measurementId);

    const selector = `script[data-google-analytics="${measurementId}"]`;
    if (document.head.querySelector(selector)) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.dataset.googleAnalytics = measurementId;
    document.head.appendChild(script);
  }, [measurementId]);

  return null;
}
