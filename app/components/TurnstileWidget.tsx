"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  remove: (widgetId: string) => void;
  render: (
    container: HTMLElement,
    options: {
      action: string;
      appearance: "always";
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
      sitekey: string;
      size: "flexible";
      theme: "light";
    },
  ) => string;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type Props = {
  onToken: (token: string) => void;
  resetKey: number;
};

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";

export function TurnstileWidget({ onToken, resetKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(Boolean(globalThis.window?.turnstile));

  useEffect(() => {
    const container = containerRef.current;
    const turnstile = window.turnstile;
    if (!SITE_KEY || !container || !turnstile || !scriptReady) return;

    if (widgetIdRef.current) turnstile.remove(widgetIdRef.current);
    container.replaceChildren();
    widgetIdRef.current = turnstile.render(container, {
      sitekey: SITE_KEY,
      action: "login_sms",
      appearance: "always",
      theme: "light",
      size: "flexible",
      callback: onToken,
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onToken, resetKey, scriptReady]);

  if (!SITE_KEY) {
    return <p className="turnstile-config-error">Проверка безопасности не настроена.</p>;
  }

  return (
    <>
      <Script
        id="cloudflare-turnstile"
        onReady={() => setScriptReady(true)}
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div className="turnstile-widget" ref={containerRef} />
    </>
  );
}
