"use client";
/* eslint-disable @next/next/no-img-element */

import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";

import { Icon } from "@mdi/react";
import { mdiPlus, mdiPower } from "@mdi/js";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { EditorDialog, WorkspaceHeading } from "./workspace-kit";
import { useDraftEditor } from "./use-unsaved-changes";
import { useAdminAccess } from "./admin-access";
import { Badge } from "./ui/badge";
import { ImageUpload } from "./ImageUpload";
import { RowActions } from "./RowActions";
import type { AdminRequest, Promotion } from "./admin-types";

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

const labelClass = "grid min-w-0 gap-1.5 text-sm font-medium text-foreground";

export function PromotionsWorkspace({ region, request, onNotice }: PromotionsWorkspaceProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionRegionSlug, setPromotionRegionSlug] = useState(region);
  const { can } = useAdminAccess();
  const [editor, setEditor, closeEditor] = useDraftEditor<PromotionEditor>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [pendingAction, setPendingAction] = useState<{ id: number; type: "toggle" | "delete" } | null>(null);
  const deleting = pendingAction?.type === "delete";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await request<{items:Promotion[];promotionRegionSlug:string}>(`/admin/promotion-list?region=${encodeURIComponent(region)}`);
      setPromotions(result.items);
      setPromotionRegionSlug(result.promotionRegionSlug);
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
    if (!editor || saving || !can(editor.promotion ? "promotions.edit" : "promotions.create")) return;
    if (!editor.image) {
      onNotice("Загрузите изображение акции", "error");
      return;
    }
    const ctaUrl = editor.ctaUrl.trim();
    const linkChanged = !editor.promotion || ctaUrl !== (editor.promotion.ctaUrl || "");
    if (ctaUrl && linkChanged) {
      try {
        const link = new URL(ctaUrl);
        if (!["http:", "https:"].includes(link.protocol)) throw new Error("protocol");
      } catch {
        onNotice("Укажите полную ссылку, начинающуюся с https:// или http://", "error");
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        title: editor.title.trim(),
        image: editor.image,
        cta: editor.cta.trim(),
        ...(linkChanged ? { ctaUrl } : {}),
        enabled: editor.enabled,
        sortOrder: Number(editor.sortOrder),
      };
      if (editor.promotion) {
        await request(`/admin/promotions/${editor.promotion.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await request("/admin/promotions", {
          method: "POST",
          body: JSON.stringify({ ...payload, regionSlug: promotionRegionSlug }),
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
    if (pendingAction || !can("promotions.edit")) return;
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
    if (!deleteTarget || pendingAction || !can("promotions.delete")) return;
    const item = deleteTarget;
    setPendingAction({ id: item.id, type: "delete" });
    try {
      await request(`/admin/promotions/${item.id}`, { method: "DELETE" });
      setPromotions((current) => current.filter((promotion) => promotion.id !== item.id));
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

  if (loading && !promotions.length) return <Card className="p-12 text-center text-muted-foreground" role="status">Загружаем акции…</Card>;
  return <div className="space-y-6"><WorkspaceHeading title="Акции и предложения" description="Баннеры на витрине: актуальные предложения, ссылки и порядок показа." action={can("promotions.create") ? <Button className="min-h-10" onClick={() => setEditor({title:"",image:"",cta:"Подробнее",ctaUrl:"",enabled:true,sortOrder:String(promotions.length)})}><Icon path={mdiPlus} size={0.7} />Добавить акцию</Button> : undefined} />
    {error ? <Card className="p-5 text-destructive" role="alert">{error}<Button variant="outline" onClick={() => void load()}>Повторить загрузку</Button></Card> : null}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{promotions.map((item) => <Card key={item.id} className="gap-0 overflow-hidden py-0">
      <img src={item.image} alt="" className="aspect-[2/1] w-full bg-muted object-cover" />
      <CardContent className="space-y-3 pt-5"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{item.title}</h3><Badge variant={item.enabled ? "secondary" : "outline"}>{item.enabled ? "Активна" : "Выключена"}</Badge></div><p className="text-sm text-muted-foreground">{item.cta || "Без кнопки"} · позиция {item.sortOrder + 1}</p></CardContent>
      <CardFooter className="mt-4 justify-between p-3">{can("promotions.edit") ? <Button variant="ghost" className="min-h-10" disabled={pendingAction !== null} onClick={() => void toggle(item)}><Icon path={mdiPower} size={0.75} />{item.enabled ? "Выключить" : "Включить"}</Button> : <span />}<RowActions label="акцию" name={item.title} deleting={pendingAction?.id === item.id && deleting} deletionDisabled={pendingAction !== null} editAllowed={can("promotions.edit")} deleteAllowed={can("promotions.delete")} onEdit={() => setEditor({promotion:item,title:item.title,image:item.image,cta:item.cta || "",ctaUrl:item.ctaUrl || "",enabled:item.enabled,sortOrder:String(item.sortOrder)})} onDelete={() => setDeleteTarget(item)} /></CardFooter>
    </Card>)}</div>{!promotions.length && !error ? <Card className="p-12 text-center"><h3 className="font-medium">Акций пока нет</h3><p className="text-sm text-muted-foreground">Добавьте предложение, чтобы показать его клиентам.</p></Card> : null}
    <EditorDialog open={Boolean(editor) && !deleteTarget} onClose={() => { if (!saving) closeEditor(); }} title={editor?.promotion ? "Редактировать акцию" : "Новая акция"} description="Настройте баннер и переход по кнопке.">{editor ? <form onSubmit={save} className="grid min-h-0 gap-5 overflow-y-auto p-5"><fieldset disabled={saving || !can(editor.promotion ? "promotions.edit" : "promotions.create")} className="contents"><ImageUpload label="Баннер акции" value={editor.image} hint="Рекомендуемый размер — 1200 × 600 px." onChange={(image) => setEditor({...editor,image})} onError={(message) => onNotice(message,"error")} /><Label className={labelClass}>Название<Input required maxLength={120} value={editor.title} onChange={(event) => setEditor({...editor,title:event.target.value})} /></Label><div className="grid gap-4 sm:grid-cols-2"><Label className={labelClass}>Текст кнопки<Input value={editor.cta} onChange={(event) => setEditor({...editor,cta:event.target.value})} /></Label><Label className={labelClass}>Порядок показа<Input type="number" min="0" value={editor.sortOrder} onChange={(event) => setEditor({...editor,sortOrder:event.target.value})} /></Label></div><Label className={labelClass}>Ссылка кнопки<Input type="text" inputMode="url" maxLength={500} placeholder="https://…" value={editor.ctaUrl} onChange={(event) => setEditor({...editor,ctaUrl:event.target.value})} /></Label><Label className="flex items-center gap-3 rounded-lg border border-border p-4"><input type="checkbox" className="size-4 accent-primary" checked={editor.enabled} onChange={(event) => setEditor({...editor,enabled:event.target.checked})} />Показывать предложение клиентам</Label><div className="flex justify-between gap-3 border-t border-border pt-4"><Button variant="outline" type="button" disabled={saving} onClick={closeEditor}>Отменить</Button><Button type="submit" disabled={saving}>{saving ? "Сохраняем…" : "Сохранить акцию"}</Button></div></fieldset></form> : null}</EditorDialog>
    <EditorDialog open={Boolean(deleteTarget)} onClose={() => { if (!deleting) setDeleteTarget(null); }} title="Удалить акцию?" description="Удаление нельзя отменить."><div className="space-y-5 p-5"><p className="text-sm text-muted-foreground">Акция «{deleteTarget?.title}» исчезнет во всех городах, где она показывается.</p><div className="flex justify-end gap-3"><Button variant="outline" disabled={deleting} onClick={() => setDeleteTarget(null)}>Отменить</Button><Button variant="destructive" disabled={pendingAction !== null} onClick={() => void deletePromotion()}>{deleting ? "Удаляем…" : "Удалить акцию"}</Button></div></div></EditorDialog>
  </div>;
}
