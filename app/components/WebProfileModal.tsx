"use client";
/* eslint-disable @next/next/no-img-element */

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

type AuthSession = {
  phone: string;
  verificationToken: string;
  expiresAt: number;
};

type AccountNft = {
  id: string;
  name: string;
  image: string;
  description: string;
  network: "polygon" | "ethereum" | "bsc" | "solana" | "ton";
  status: "owned" | "pending" | "submitted" | "withdrawn" | "failed";
  walletAddress: string | null;
  txHash: string | null;
  withdrawalError: string | null;
  milestoneOrderCount: number;
};

type ProfileData = {
  naktaCoins: number;
  nfts?: AccountNft[];
  currentOrders: unknown[];
  orderHistory: unknown[];
};

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const AUTH_STORAGE_KEY = "losos.web.auth.v1";
const networkLabels: Record<AccountNft["network"], string> = {
  polygon: "Polygon",
  ethereum: "Ethereum",
  bsc: "BNB Smart Chain",
  solana: "Solana",
  ton: "TON",
};
const statusLabels: Record<AccountNft["status"], string> = {
  owned: "доступен для вывода",
  pending: "вывод обрабатывается",
  submitted: "отправлен в сеть",
  withdrawn: "выведен",
  failed: "ошибка вывода",
};

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("996")) return `+${digits.slice(0, 12)}`;
  if (digits.length <= 9) return `+996${digits}`;
  return `+${digits.slice(0, 12)}`;
}

function displayPhone(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^996/, "").slice(0, 9);
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean);
  return `+996${parts.length ? ` ${parts.join(" ")}` : ""}`;
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => null) as { message?: string | string[] } | T | null;
  if (!response.ok) {
    const rawMessage = payload && typeof payload === "object" && "message" in payload
      ? payload.message
      : null;
    throw new Error(Array.isArray(rawMessage) ? rawMessage.join(". ") : rawMessage || "Не удалось выполнить запрос");
  }
  return payload as T;
}

export function WebProfileModal({ apiUrl, onClose }: { apiUrl: string; onClose: () => void }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [phone, setPhone] = useState("+996");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletDrafts, setWalletDrafts] = useState<Record<string, string>>({});
  const [withdrawingNft, setWithdrawingNft] = useState<string | null>(null);
  const captchaRef = useRef<HTMLDivElement>(null);
  const captchaWidgetIdRef = useRef("");
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";
  const nfts = profile?.nfts ?? [];

  const completedOrders = useMemo(() => profile?.orderHistory.length ?? 0, [profile]);
  const resolveNftImage = (image: string) => {
    if (/^(?:https?:|data:)/i.test(image)) return image;
    try {
      return new URL(image, apiUrl.replace(/\/api\/?$/, "/")).toString();
    } catch {
      return image;
    }
  };

  const saveSession = (nextSession: AuthSession) => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const logout = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    setSession(null);
    setProfile(null);
    setStep("phone");
    setCode("");
    setError("");
  };

  useEffect(() => {
    const restoreSession = () => {
      try {
        const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored) as AuthSession;
        if (parsed.phone && parsed.verificationToken && parsed.expiresAt > Date.now()) {
          setPhone(parsed.phone);
          setSession(parsed);
        } else {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    };
    queueMicrotask(restoreSession);
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    apiRequest<ProfileData>(`${apiUrl}/auth/profile?phone=${encodeURIComponent(session.phone)}`, {
      headers: { authorization: `Bearer ${session.verificationToken}` },
    })
      .then((data) => { if (!cancelled) setProfile(data); })
      .catch((requestError: Error) => {
        if (cancelled) return;
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        setSession(null);
        setProfile(null);
        setStep("phone");
        setCode("");
        setError(requestError.message);
      });
    return () => { cancelled = true; };
  }, [apiUrl, session]);

  useEffect(() => {
    if (session || step !== "phone" || !turnstileSiteKey) return;
    let widgetId = "";
    let cancelled = false;
    const renderWidget = () => {
      if (cancelled || !captchaRef.current || !window.turnstile || widgetId) return;
      widgetId = window.turnstile.render(captchaRef.current, {
        sitekey: turnstileSiteKey,
        action: "login_sms",
        callback: (token: string) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(""),
        "error-callback": () => {
          setCaptchaToken("");
          setError("Не удалось выполнить проверку безопасности");
        },
      });
      captchaWidgetIdRef.current = widgetId;
    };
    const scriptId = "cloudflare-turnstile-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (window.turnstile) {
      renderWidget();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderWidget);
    }
    return () => {
      cancelled = true;
      script?.removeEventListener("load", renderWidget);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      if (captchaWidgetIdRef.current === widgetId) captchaWidgetIdRef.current = "";
    };
  }, [session, step, turnstileSiteKey]);

  const acceptSession = (result: { phone?: string; verificationToken: string; expiresInSeconds: number }) => {
    const nextSession = {
      phone: result.phone || normalizePhone(phone),
      verificationToken: result.verificationToken,
      expiresAt: Date.now() + result.expiresInSeconds * 1_000,
    };
    saveSession(nextSession);
  };

  const requestCode = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizePhone(phone);
    if (!/^\+996\d{9}$/.test(normalized)) {
      setError("Введите телефон в формате +996 XXX XXX XXX");
      return;
    }
    if (!turnstileSiteKey) {
      setError("Для входа на сайте нужно настроить NEXT_PUBLIC_TURNSTILE_SITE_KEY");
      return;
    }
    if (!captchaToken) {
      setError("Подтвердите, что вы не робот");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest<{
        verified?: boolean;
        phone?: string;
        verificationToken?: string;
        expiresInSeconds: number;
      }>(`${apiUrl}/auth/request-code`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: normalized, captchaToken }),
      });
      setPhone(normalized);
      if (result.verified && result.verificationToken) {
        acceptSession({ ...result, verificationToken: result.verificationToken });
      } else {
        setStep("code");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось отправить код");
      setCaptchaToken("");
      if (captchaWidgetIdRef.current && window.turnstile) {
        window.turnstile.reset(captchaWidgetIdRef.current);
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Введите шестизначный код");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest<{ phone: string; verificationToken: string; expiresInSeconds: number }>(
        `${apiUrl}/auth/verify-code`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ phone: normalizePhone(phone), code }),
        },
      );
      acceptSession(result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось проверить код");
    } finally {
      setLoading(false);
    }
  };

  const withdrawNft = async (nft: AccountNft) => {
    if (!session) return;
    const walletAddress = walletDrafts[nft.id]?.trim();
    if (!walletAddress) return;
    setWithdrawingNft(nft.id);
    setError("");
    try {
      const updated = await apiRequest<AccountNft>(
        `${apiUrl}/auth/nfts/${encodeURIComponent(nft.id)}/withdraw?phone=${encodeURIComponent(session.phone)}`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${session.verificationToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ walletAddress }),
        },
      );
      setProfile((current) => current ? {
        ...current,
        nfts: (current.nfts ?? []).map((item) => item.id === updated.id ? updated : item),
      } : current);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось вывести NFT");
    } finally {
      setWithdrawingNft(null);
    }
  };

  return (
    <div className="overlay profile-overlay" role="dialog" aria-modal="true" aria-label="Профиль" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="profile-modal">
        <button className="profile-close" onClick={onClose} aria-label="Закрыть">×</button>
        {!session ? (
          <div className="web-profile-auth">
            <div className="web-profile-heading">
              <span className="cat-reference" aria-hidden="true" />
              <div><span>Привет!</span><strong>{step === "phone" ? "Войдите в профиль" : "Введите код из SMS"}</strong></div>
            </div>
            {step === "phone" ? (
              <form onSubmit={requestCode}>
                <label htmlFor="web-profile-phone">Номер телефона</label>
                <input
                  id="web-profile-phone"
                  autoComplete="tel"
                  inputMode="tel"
                  onChange={(event) => setPhone(normalizePhone(event.target.value))}
                  value={displayPhone(phone)}
                />
                <div className="web-profile-captcha" ref={captchaRef} />
                <button className="web-profile-primary" disabled={loading} type="submit">
                  {loading ? "Отправляем…" : "Получить код"}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyCode}>
                <p className="web-profile-note">Код отправлен на {displayPhone(phone)}</p>
                <label htmlFor="web-profile-code">Код подтверждения</label>
                <input
                  id="web-profile-code"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  value={code}
                />
                <button className="web-profile-primary" disabled={loading} type="submit">
                  {loading ? "Проверяем…" : "Войти"}
                </button>
                <button className="web-profile-secondary" type="button" onClick={() => { setStep("phone"); setCode(""); setError(""); }}>
                  Изменить номер
                </button>
              </form>
            )}
            {error ? <p className="web-profile-error" role="alert">{error}</p> : null}
          </div>
        ) : (
          <div className="web-profile-content">
            <header className="web-profile-account">
              <div><span>Ваш профиль</span><strong>{displayPhone(session.phone)}</strong></div>
              <button type="button" onClick={logout}>Выйти</button>
            </header>
            {!profile ? <p className="web-profile-loading">Загружаем баланс…</p> : null}
            {profile ? (
              <>
                <div className="web-profile-balances">
                  <article className="web-profile-coin-card">
                    <span>NAKTA Coin</span><strong>{profile.naktaCoins}</strong><small>начисляются за заказы</small>
                  </article>
                  <article className="web-profile-nft-balance">
                    <span>Ваши NFT</span><strong>{nfts.length}</strong><small>отдельно от NAKTA Coin</small>
                  </article>
                </div>
                <p className="web-profile-orders">Активных заказов: {profile.currentOrders.length} · Завершённых: {completedOrders}</p>
                <section className="web-profile-nfts">
                  <h2>Мои NFT</h2>
                  <p>NFT начисляются автоматически за установленное количество завершённых заказов и выводятся в выбранную криптосеть.</p>
                  {nfts.length ? nfts.map((nft) => {
                    const canWithdraw = nft.status === "owned" || nft.status === "failed";
                    return (
                      <article className="web-profile-nft-card" key={nft.id}>
                        <div className="web-profile-nft-header">
                          {nft.image ? <img src={resolveNftImage(nft.image)} alt={`NFT ${nft.name}`} /> : <span className="web-profile-nft-placeholder" aria-hidden="true">⬡</span>}
                          <div>
                            <strong>{nft.name}</strong>
                            <span>{networkLabels[nft.network]} · {statusLabels[nft.status]}</span>
                            <small>За {nft.milestoneOrderCount}-й завершённый заказ</small>
                          </div>
                        </div>
                        {nft.description ? <p>{nft.description}</p> : null}
                        {canWithdraw ? (
                          <div className="web-profile-wallet">
                            <input
                              aria-label={`Адрес кошелька для ${nft.name}`}
                              autoCapitalize="none"
                              autoCorrect="off"
                              onChange={(event) => setWalletDrafts((current) => ({ ...current, [nft.id]: event.target.value }))}
                              placeholder={`Адрес кошелька ${networkLabels[nft.network]}`}
                              value={walletDrafts[nft.id] || ""}
                            />
                            <button
                              disabled={!walletDrafts[nft.id]?.trim() || withdrawingNft === nft.id}
                              onClick={() => void withdrawNft(nft)}
                              type="button"
                            >
                              {withdrawingNft === nft.id ? "Отправляем…" : nft.status === "failed" ? "Повторить вывод" : "Вывести NFT"}
                            </button>
                          </div>
                        ) : null}
                        {nft.walletAddress ? <small className="web-profile-wallet-result">Кошелёк: {nft.walletAddress}</small> : null}
                        {nft.txHash ? <small className="web-profile-wallet-result">Транзакция: {nft.txHash}</small> : null}
                        {nft.withdrawalError ? <small className="web-profile-withdraw-error">{nft.withdrawalError}</small> : null}
                      </article>
                    );
                  }) : <div className="web-profile-empty">Пока NFT нет. Они появятся здесь после достижения ближайшего порога заказов.</div>}
                </section>
              </>
            ) : null}
            {error ? <p className="web-profile-error" role="alert">{error}</p> : null}
          </div>
        )}
      </section>
    </div>
  );
}
