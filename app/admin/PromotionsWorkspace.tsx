"use client";

import { Icon } from "@mdi/react";
import { mdiClose, mdiPlus } from "@mdi/js";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ImageUpload } from "./ImageUpload";
import type { AdminRequest, Dashboard, Promotion } from "./admin-types";

type PromotionsWorkspaceProps = {
  region: string;
  request: AdminRequest;
  onNotice: (message: string, tone?: "success" | "error") => void;
};

type PromotionEditor = {
  promotion?: Promotion;
  title: string;
  image: string;
  cta: string;
  ctaUrl: string;
  enabled: boolean;
  sortOrder: string;
};

const inputClass = "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100";
const labelClass = "grid gap-1.5 text-sm font-medium text-slate-700";

export function PromotionsWorkspace({ region, request, onNotice }: PromotionsWorkspaceProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [editor, setEditor] = useState<PromotionEditor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDashboard(await request<Dashboard>(`/admin/dashboard?region=${encodeURIComponent(region)}`));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить акции");
    } finally {
      setLoading(false);
    }
  }, [region, request]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!editor || saving) return;
    if (!editor.image) {
      onNotice("Загрузите изображение акции", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: editor.title.trim(),
        image: editor.image,
        cta: editor.cta.trim(),
        ctaUrl: editor.ctaUrl.trim(),
        enabled: editor.enabled,
        sortOrder: Number(editor.sortOrder),
      };
      if (editor.promotion) {
        await request(`/admin/promotions/${editor.promotion.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await request("/admin/promotions", {
          method: "POST",
          body: JSON.stringify({ ...payload, regionSlug: dashboard?.promotionRegionSlug || region }),
        });
      }
      onNotice(editor.promotion ? "Акция обновлена" : "Акция добавлена", "success");
      setEditor(null);
      await load();
    } catch (saveError) {
      onNotice(saveError instanceof Error ? saveError.message : "Не удалось сохранить акцию", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: Promotion) => {
    try {
      await request(`/admin/promotions/${item.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !item.enabled }) });
      onNotice(item.enabled ? "Акция выключена" : "Акция включена", "success");
      await load();
    } catch (toggleError) {
      onNotice(toggleError instanceof Error ? toggleError.message : "Не удалось изменить акцию", "error");
    }
  };

  if (loading && !dashboard) return <div className="grid min-h-56 place-items-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">Загружаем акции…</div>;
  if (error && !dashboard) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700" role="alert">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Показывайте клиентам только актуальные предложения.</p>
        <button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700" onClick={() => setEditor({ title: "", image: "", cta: "Подробнее", ctaUrl: "", enabled: true, sortOrder: String(dashboard?.promotions.length ?? 0) })}>
          <Icon path={mdiPlus} size={0.75} aria-hidden="true" />
          Добавить акцию
        </button>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {dashboard?.promotions.length ? (
          <div className="divide-y divide-slate-200">
            {dashboard.promotions.map((item) => (
              <article key={item.id} className="grid gap-4 p-4 sm:grid-cols-[72px_1fr_auto] sm:items-center sm:px-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" className="size-18 rounded-lg border border-slate-200 object-cover" />
                <div><div className="flex flex-wrap items-center gap-2"><strong className="text-slate-950">{item.title}</strong><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.enabled ? "Активна" : "Выключена"}</span></div><span className="mt-2 block text-sm text-slate-500">{item.cta || "Без кнопки"}</span></div>
                <div className="grid grid-cols-2 gap-2"><button type="button" className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700" onClick={() => void toggle(item)}>{item.enabled ? "Выключить" : "Включить"}</button><button type="button" className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700" onClick={() => setEditor({ promotion: item, title: item.title, image: item.image, cta: item.cta || "", ctaUrl: item.ctaUrl || "", enabled: item.enabled, sortOrder: String(item.sortOrder) })}>Редактировать</button></div>
              </article>
            ))}
          </div>
        ) : <div className="grid min-h-52 place-items-center p-8 text-center text-sm text-slate-500">Акций пока нет.</div>}
      </section>

      {editor ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-0 sm:p-5" role="presentation">
          <form className="flex min-h-dvh w-full max-w-2xl flex-col bg-white shadow-2xl sm:min-h-0 sm:rounded-xl" onSubmit={save}>
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4"><h2 className="text-lg font-semibold text-slate-950">{editor.promotion ? "Редактировать акцию" : "Добавить акцию"}</h2><button type="button" aria-label="Закрыть редактор акции" className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-600" onClick={() => setEditor(null)}><Icon path={mdiClose} size={0.78} aria-hidden="true" /></button></header>
            <div className="grid gap-5 overflow-y-auto p-5">
              <ImageUpload label="Баннер акции" value={editor.image} hint="Рекомендуемый размер — 1200×600 px." onChange={(image) => setEditor({ ...editor, image })} onError={(message) => onNotice(message, "error")} />
              <label className={labelClass}>Название<input required className={inputClass} value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })} /></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Текст кнопки<input className={inputClass} value={editor.cta} onChange={(event) => setEditor({ ...editor, cta: event.target.value })} /></label><label className={labelClass}>Порядок<input min="0" type="number" className={inputClass} value={editor.sortOrder} onChange={(event) => setEditor({ ...editor, sortOrder: event.target.value })} /></label></div>
              <label className={labelClass}>Ссылка<input type="url" className={inputClass} placeholder="https://…" value={editor.ctaUrl} onChange={(event) => setEditor({ ...editor, ctaUrl: event.target.value })} /></label>
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700"><input type="checkbox" className="size-4 accent-blue-600" checked={editor.enabled} onChange={(event) => setEditor({ ...editor, enabled: event.target.checked })} />Акция включена</label>
            </div>
            <footer className="grid gap-2 border-t border-slate-200 p-4 sm:grid-cols-2"><button type="button" className="min-h-11 rounded-lg border border-slate-300 text-sm font-medium text-slate-700" onClick={() => setEditor(null)}>Отменить</button><button type="submit" className="min-h-11 rounded-lg bg-blue-600 text-sm font-semibold text-white disabled:opacity-60" disabled={saving}>{saving ? "Сохраняем…" : editor.promotion ? "Сохранить изменения" : "Добавить акцию"}</button></footer>
          </form>
        </div>
      ) : null}
    </div>
  );
}
