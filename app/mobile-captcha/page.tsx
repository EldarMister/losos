"use client";

import { useCallback, useState } from "react";
import { TurnstileWidget } from "../components/TurnstileWidget";

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

function sendToApp(message: object) {
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
}

export default function MobileCaptchaPage() {
  const [resetKey] = useState(0);
  const receiveToken = useCallback((token: string) => {
    sendToApp(token ? { type: "success", token } : { type: "error" });
  }, []);

  return (
    <main className="mobile-captcha-page">
      <TurnstileWidget onToken={receiveToken} resetKey={resetKey} />
      <p>Проверка безопасности Накта суши</p>
    </main>
  );
}
