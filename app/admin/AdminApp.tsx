"use client";

import { Icon } from "@mdi/react";
import { mdiClose, mdiMenu } from "@mdi/js";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AdminNavigation, adminSections } from "./AdminNavigation";
import {
  AnalyticsView,
  CategoriesView,
  FinanceView,
  MenuView,
  PromotionsView,
  SettingsView,
  UsersView,
} from "./AdminSections";
import OrdersWorkspace from "./OrdersWorkspace";
import type { AdminRequest, AdminSection, Region } from "./admin-types";

const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL
  || (process.env.NODE_ENV === "development"
    ? "http://localhost:4000/api"
    : "https://losos-production.up.railway.app/api")
).replace(/\/$/, "");

type Notice = { message: string; tone: "success" | "error" };

export function AdminApp() {
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState("");
  const [tokenDraft, setTokenDraft] = useState("");
  const [loginError, setLoginError] = useState("");
  const [authorizing, setAuthorizing] = useState(false);
  const [section, setSection] = useState<AdminSection>("orders");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [region, setRegion] = useState("bishkek");
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setToken(sessionStorage.getItem("losos-admin-token") || "");
      setHydrated(true);
    });
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("losos-admin-token");
    setToken("");
    setRegions([]);
    setMobileMenuOpen(false);
  }, []);

  const request = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "content-type": "application/json" } : {}),
        "x-admin-token": token,
        ...init?.headers,
      },
    });
    if (response.status === 401) {
      logout();
      throw new Error("Сессия завершена. Войдите снова.");
    }
    const text = await response.text();
    const payload = text ? JSON.parse(text) as unknown : undefined;
    if (!response.ok) {
      const serverMessage = typeof payload === "object" && payload && "message" in payload
        ? (payload as { message?: string | string[] }).message
        : undefined;
      throw new Error(Array.isArray(serverMessage) ? serverMessage.join(". ") : serverMessage || "Сервер не смог выполнить запрос");
    }
    return payload as T;
  }, [logout, token]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void request<Region[]>("/admin/settings")
        .then((items) => {
          if (!active) return;
          setRegions(items);
          setRegion((current) => items.some((item) => item.slug === current) ? current : items[0]?.slug || current);
        })
        .catch((error) => {
          if (active && error instanceof Error && !error.message.includes("Сессия завершена")) {
            setNotice({ message: error.message, tone: "error" });
          }
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [request, token]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4_000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const authorize = async (event: FormEvent) => {
    event.preventDefault();
    const nextToken = tokenDraft.trim();
    if (!nextToken || authorizing) return;
    setAuthorizing(true);
    setLoginError("");
    try {
      const response = await fetch(`${apiUrl}/admin/settings`, { headers: { "x-admin-token": nextToken } });
      if (!response.ok) throw new Error(response.status === 401 ? "Неверный код администратора" : "Сервер временно недоступен");
      const items = await response.json() as Region[];
      sessionStorage.setItem("losos-admin-token", nextToken);
      setRegions(items);
      setRegion(items.find((item) => item.slug === "bishkek")?.slug || items[0]?.slug || "bishkek");
      setToken(nextToken);
      setTokenDraft("");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Не удалось войти");
    } finally {
      setAuthorizing(false);
    }
  };

  const activeSection = useMemo(() => adminSections.find((item) => item.id === section) ?? adminSections[0], [section]);
  const onNotice = useCallback((message: string, tone: "success" | "error" = "success") => setNotice({ message, tone }), []);
  const selectSection = (nextSection: AdminSection) => {
    setSection(nextSection);
    setMobileMenuOpen(false);
  };

  if (!hydrated) return <div className="admin-root min-h-dvh bg-slate-50" />;

  if (!token) {
    return (
      <main className="admin-root grid min-h-dvh place-items-center bg-slate-50 px-4 py-10">
        <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="login-title">
          <span className="grid size-12 place-items-center rounded-xl bg-slate-950 text-base font-bold text-white">N</span>
          <h1 id="login-title" className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">Вход в админ-панель</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Введите код администратора, чтобы управлять заказами и меню.</p>
          <form className="mt-6 grid gap-4" onSubmit={authorize}>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Код администратора
              <input
                type="password"
                autoComplete="current-password"
                autoFocus
                required
                className="h-12 rounded-lg border border-slate-300 px-3 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                placeholder="Введите код"
                value={tokenDraft}
                aria-invalid={Boolean(loginError)}
                onChange={(event) => { setTokenDraft(event.target.value); setLoginError(""); }}
              />
            </label>
            {loginError ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{loginError}</p> : null}
            <button type="submit" disabled={authorizing} className="min-h-12 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
              {authorizing ? "Проверяем код…" : "Войти в систему"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  const viewProps = { region, request: request as AdminRequest, onNotice };

  return (
    <div className="admin-root min-h-dvh bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-800 lg:block">
        <AdminNavigation active={section} onSelect={selectSection} onLogout={logout} />
      </aside>

      {mobileMenuOpen ? (
        <div className="admin-mobile-menu-open fixed inset-0 z-50 bg-slate-950/45 lg:hidden" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setMobileMenuOpen(false);
        }}>
          <aside className="relative h-full w-[min(88vw,320px)] shadow-2xl" aria-label="Мобильное меню">
            <AdminNavigation active={section} onSelect={selectSection} onLogout={logout} />
            <button type="button" aria-label="Закрыть меню" className="absolute right-3 top-5 grid size-10 place-items-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              <Icon path={mdiClose} size={0.82} aria-hidden="true" />
            </button>
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-18 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 lg:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Icon path={mdiMenu} size={0.8} aria-hidden="true" />
              Меню
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold text-slate-950 sm:text-xl">{activeSection.label}</h1>
              <p className="hidden truncate text-xs text-slate-500 sm:block">{activeSection.description}</p>
            </div>
            <label className="grid gap-1 text-xs font-medium text-slate-500">
              <span className="hidden sm:block">Город</span>
              <select className="h-10 max-w-36 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 sm:max-w-48" value={region} onChange={(event) => setRegion(event.target.value)}>
                {regions.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
              </select>
            </label>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
          {section === "orders" ? <OrdersWorkspace {...viewProps} /> : null}
          {section === "analytics" ? <AnalyticsView {...viewProps} /> : null}
          {section === "menu" ? <MenuView {...viewProps} /> : null}
          {section === "categories" ? <CategoriesView {...viewProps} /> : null}
          {section === "users" ? <UsersView {...viewProps} /> : null}
          {section === "finance" ? <FinanceView {...viewProps} /> : null}
          {section === "promotions" ? <PromotionsView {...viewProps} /> : null}
          {section === "settings" ? <SettingsView {...viewProps} /> : null}
        </main>
      </div>

      {notice ? (
        <div className={`fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-md rounded-xl border px-4 py-3 text-sm font-medium shadow-lg sm:left-auto ${notice.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`} role="status" aria-live="polite">
          {notice.message}
        </div>
      ) : null}
    </div>
  );
}
