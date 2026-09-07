"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminRequest, Analytics } from "./admin-types";

type AnalyticsViewProps = {
  region: string;
  request: AdminRequest;
};

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU")} сом`;
}

export function AnalyticsView({ region, request }: AnalyticsViewProps) {
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await request<Analytics>(`/admin/analytics?region=${encodeURIComponent(region)}&period=${period}`));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить аналитику");
    } finally {
      setLoading(false);
    }
  }, [period, region, request]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (loading && !data) {
    return <div className="grid min-h-56 place-items-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500" role="status">Загружаем данные…</div>;
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700" role="alert">
        <strong className="block">Не удалось загрузить данные</strong>
        <span className="mt-1 block">{error}</span>
        <button type="button" className="mt-3 font-semibold underline" onClick={() => void load()}>Повторить загрузку</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <strong className="block text-sm font-semibold text-slate-950">Период отчёта</strong>
          <span className="mt-1 block text-xs text-slate-500">Основные показатели продаж</span>
        </div>
        <div className="flex gap-2 overflow-x-auto" aria-label="Период аналитики">
          {(["today", "week", "month"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={period === value}
              className={`min-h-10 shrink-0 rounded-lg px-3 text-sm font-medium ${period === value ? "bg-slate-950 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
              onClick={() => setPeriod(value)}
            >
              {value === "today" ? "Сегодня" : value === "week" ? "7 дней" : "30 дней"}
            </button>
          ))}
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          ["Заказы", data?.orders ?? 0, "шт."],
          ["Выручка", formatMoney(data?.revenue ?? 0), ""],
          ["Средний чек", formatMoney(data?.average ?? 0), ""],
        ].map(([label, value, suffix]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5">
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value} {suffix}</dd>
          </div>
        ))}
      </dl>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <header className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-950">Популярные блюда</h2></header>
        {data?.products.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Блюдо</th><th className="px-5 py-3">Продано</th><th className="px-5 py-3 text-right">Выручка</th></tr></thead>
              <tbody className="divide-y divide-slate-200">{data.products.slice(0, 5).map((product) => <tr key={product.name}><td className="px-5 py-4 font-medium text-slate-900">{product.name}</td><td className="px-5 py-4 text-slate-600">{product.count} шт.</td><td className="px-5 py-4 text-right font-semibold text-slate-900">{formatMoney(product.revenue)}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <div className="p-8 text-center text-sm text-slate-500">Продаж пока нет.</div>}
      </section>
    </div>
  );
}
