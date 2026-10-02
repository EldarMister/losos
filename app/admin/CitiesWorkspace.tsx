"use client";

import { useState } from "react";
import type { AdminRequest, Region } from "./admin-types";

type CitiesWorkspaceProps = {
  regions: Region[];
  request: AdminRequest;
  onRegionUpdated: (region: Region) => void;
  onNotice: (message: string, tone?: "success" | "error") => void;
};

export function CitiesWorkspace({ regions, request, onRegionUpdated, onNotice }: CitiesWorkspaceProps) {
  const [savingId, setSavingId] = useState<number | null>(null);

  const changeVisibility = async (region: Region) => {
    if (savingId !== null) return;
    setSavingId(region.id);
    try {
      const saved = await request<Region>(`/admin/regions/${region.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !region.enabled }),
      });
      const updated = { ...region, enabled: saved.enabled };
      onRegionUpdated(updated);
      onNotice(updated.enabled
        ? `Город «${updated.name}» показан на сайте и в приложении`
        : `Город «${updated.name}» скрыт на сайте и в приложении`, "success");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Не удалось изменить видимость города", "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="cities-title">
      <div className="border-b border-slate-200 pb-4">
        <h2 id="cities-title" className="font-semibold text-slate-950">Города на сайте и в приложении</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">Нажмите «Скрыть», чтобы убрать лишний город из выбора клиентов. Заказы, меню и настройки сохранятся. Вернуть город можно кнопкой «Показать».</p>
      </div>
      {regions.length ? (
        <ul className="divide-y divide-slate-200">
          {regions.map((region) => (
            <li key={region.id} className="flex flex-wrap items-center gap-3 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-950">{region.name}</p>
                <p className="mt-1 text-sm text-slate-500">{region.enabled ? "Виден на сайте и в приложении" : "Скрыт на сайте и в приложении"}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${region.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{region.enabled ? "Виден" : "Скрыт"}</span>
              <button
                type="button"
                aria-label={`${region.enabled ? "Скрыть" : "Показать"} город ${region.name}`}
                disabled={savingId !== null}
                onClick={() => void changeVisibility(region)}
                className="inline-flex min-h-11 min-w-25 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
              >
                {savingId === region.id ? "Сохраняем…" : region.enabled ? "Скрыть" : "Показать"}
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="py-6 text-sm text-slate-500">Городов пока нет.</p>}
    </section>
  );
}
