"use client";

import { Icon } from "@mdi/react";
import { mdiClose, mdiDeleteOutline, mdiLoading, mdiPlus, mdiPower } from "@mdi/js";
import { FormEvent, KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { ImageUpload } from "./ImageUpload";
import { RowActions } from "./RowActions";
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

const inputClass = "h-11 min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100";
const labelClass = "grid min-w-0 gap-1.5 text-sm font-medium text-slate-700";
const iconButtonClass = "inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60";

function trapDialogFocus(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== "Tab") return;
  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), [tabindex='0']"))
    .filter((element) => element.getClientRects().length > 0 && !element.classList.contains("sr-only"));
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

export function PromotionsWorkspace({ region, request, onNotice }: PromotionsWorkspaceProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [editor, setEditor] = useState<PromotionEditor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [pendingAction, setPendingAction] = useState<{ id: number; type: "toggle" | "delete" } | null>(null);
  const dialogTitleId = useId();
  const deleteDescriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const modalOpen = Boolean(editor || deleteTarget);
  const modalMode = deleteTarget ? "delete" : editor ? "editor" : null;
  const deleting = pendingAction?.type === "delete";

  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("button:not(:disabled)")?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [modalOpen, modalMode]);

  useEffect(() => {
    if (!modalOpen) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || saving || deleting) return;
      if (deleteTarget) setDeleteTarget(null);
      else setEditor(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [modalOpen, deleteTarget, saving, deleting]);

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
    if (pendingAction) return;
    setPendingAction({ id: item.id, type: "toggle" });
    try {
      await request(`/admin/promotions/${item.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !item.enabled }) });
      onNotice(item.enabled ? "Акция выключена" : "Акция включена", "success");
      await load();
    } catch (toggleError) {
      onNotice(toggleError instanceof Error ? toggleError.message : "Не удалось изменить акцию", "error");
    } finally {
      setPendingAction(null);
    }
  };

  const deletePromotion = async () => {
    if (!deleteTarget || pendingAction) return;
    const item = deleteTarget;
    setPendingAction({ id: item.id, type: "delete" });
    try {
      await request(`/admin/promotions/${item.id}`, { method: "DELETE" });
      setDashboard((current) => current ? { ...current, promotions: current.promotions.filter((promotion) => promotion.id !== item.id) } : current);
      setDeleteTarget(null);
      setEditor(null);
      onNotice("Акция удалена полностью", "success");
      await load();
    } catch (deleteError) {
      onNotice(deleteError instanceof Error ? deleteError.message : "Не удалось удалить акцию", "error");
    } finally {
      setPendingAction(null);
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
              <article key={item.id} className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] items-center gap-3 p-4 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:gap-4 sm:px-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" className="size-16 rounded-lg border border-slate-200 object-cover sm:size-18" />
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="break-words text-slate-950">{item.title}</strong><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.enabled ? "Активна" : "Выключена"}</span></div><span className="mt-2 block break-words text-sm text-slate-500">{item.cta || "Без кнопки"}</span></div>
                <div className="col-span-2 flex items-center justify-end gap-1 sm:col-span-1">
                  <button type="button" className={`${iconButtonClass} ${item.enabled ? "text-emerald-600 hover:text-slate-700" : "hover:text-emerald-600"}`} aria-label={`${item.enabled ? "Выключить" : "Включить"} акцию «${item.title}»`} title={item.enabled ? "Выключить акцию" : "Включить акцию"} aria-pressed={item.enabled} disabled={pendingAction !== null} onClick={() => void toggle(item)}>
                    <Icon path={pendingAction?.id === item.id && pendingAction.type === "toggle" ? mdiLoading : mdiPower} size={0.83} className={pendingAction?.id === item.id && pendingAction.type === "toggle" ? "animate-spin" : undefined} aria-hidden="true" />
                  </button>
                  <RowActions label="акцию" name={item.title} deleting={pendingAction?.id === item.id && deleting} deletionDisabled={pendingAction !== null} onEdit={() => setEditor({ promotion: item, title: item.title, image: item.image, cta: item.cta || "", ctaUrl: item.ctaUrl || "", enabled: item.enabled, sortOrder: String(item.sortOrder) })} onDelete={() => setDeleteTarget(item)} />
                </div>
              </article>
            ))}
          </div>
        ) : <div className="grid min-h-52 place-items-center p-8 text-center text-sm text-slate-500">Акций пока нет.</div>}
      </section>

      {editor && !deleteTarget ? (
        <div ref={dialogRef} className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/45 sm:p-5" role="dialog" aria-modal="true" aria-labelledby={dialogTitleId} onKeyDown={trapDialogFocus}>
          <form className="flex max-h-dvh min-h-0 min-w-0 w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-xl" onSubmit={save} aria-busy={saving}>
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4"><h2 id={dialogTitleId} className="min-w-0 text-lg font-semibold text-slate-950">{editor.promotion ? "Редактировать акцию" : "Добавить акцию"}</h2><button type="button" aria-label="Закрыть редактор акции" className={`${iconButtonClass} border border-slate-200`} disabled={saving} onClick={() => setEditor(null)}><Icon path={mdiClose} size={0.78} aria-hidden="true" /></button></header>
            <div className="grid min-h-0 min-w-0 gap-5 overflow-y-auto overscroll-contain p-4 sm:p-5">
              <ImageUpload label="Баннер акции" value={editor.image} hint="Рекомендуемый размер — 1200×600 px." onChange={(image) => setEditor({ ...editor, image })} onError={(message) => onNotice(message, "error")} />
              <label className={labelClass}>Название<input required className={inputClass} value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })} /></label>
              <div className="grid min-w-0 gap-4 sm:grid-cols-2"><label className={labelClass}>Текст кнопки<input className={inputClass} value={editor.cta} onChange={(event) => setEditor({ ...editor, cta: event.target.value })} /></label><label className={labelClass}>Порядок<input min="0" type="number" className={inputClass} value={editor.sortOrder} onChange={(event) => setEditor({ ...editor, sortOrder: event.target.value })} /></label></div>
              <label className={labelClass}>Ссылка<input type="url" className={inputClass} placeholder="https://…" value={editor.ctaUrl} onChange={(event) => setEditor({ ...editor, ctaUrl: event.target.value })} /></label>
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700"><input type="checkbox" className="size-4 accent-blue-600" checked={editor.enabled} onChange={(event) => setEditor({ ...editor, enabled: event.target.checked })} />Акция включена</label>
            </div>
            <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
              <button type="button" className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 disabled:opacity-60" disabled={saving} onClick={() => setEditor(null)}>Отменить</button>
              <button type="submit" className="min-h-11 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white disabled:opacity-60" disabled={saving}>{saving ? "Сохраняем…" : editor.promotion ? "Сохранить изменения" : "Добавить акцию"}</button>
              {editor.promotion ? <button type="button" className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60" disabled={saving || pendingAction !== null} onClick={() => { if (editor.promotion) setDeleteTarget(editor.promotion); }}><Icon path={mdiDeleteOutline} size={0.78} aria-hidden="true" />Удалить полностью</button> : null}
            </footer>
          </form>
        </div>
      ) : null}

      {deleteTarget ? (
        <div ref={dialogRef} className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/45 p-3 sm:p-5" role="alertdialog" aria-modal="true" aria-labelledby={dialogTitleId} aria-describedby={deleteDescriptionId} onKeyDown={trapDialogFocus}>
          <div className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 min-w-0 w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2.5rem)]" aria-busy={deleting}>
            <div className="min-h-0 overflow-y-auto p-5"><h2 id={dialogTitleId} className="text-lg font-semibold text-slate-950">Удалить акцию полностью?</h2><p id={deleteDescriptionId} className="mt-3 break-words text-sm leading-6 text-slate-600">Акция «{deleteTarget.title}» исчезнет с сайта и из панели управления во всех городах, где она показывается. Восстановить её после удаления нельзя.</p></div>
            <footer className="grid shrink-0 gap-2 border-t border-slate-200 p-4 sm:grid-cols-2"><button type="button" className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 disabled:opacity-60" disabled={deleting} onClick={() => setDeleteTarget(null)}>Отменить</button><button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60" disabled={pendingAction !== null} onClick={() => void deletePromotion()}><Icon path={deleting ? mdiLoading : mdiDeleteOutline} size={0.78} className={deleting ? "animate-spin" : undefined} aria-hidden="true" />{deleting ? "Удаляем…" : "Удалить полностью"}</button></footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
