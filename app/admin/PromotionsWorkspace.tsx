"use client";
import { translateAdmin as t } from "./i18n/store";
import { useAdminLanguage } from "./i18n/react";

/* eslint-disable @next/next/no-img-element */
import { Plus, Power } from "lucide-react";
import { Button } from "./ui/button";
import { DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
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
    useAdminLanguage();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [promotionRegionSlug, setPromotionRegionSlug] = useState(region);
    const { can } = useAdminAccess();
    const [editor, setEditor, closeEditor] = useDraftEditor<PromotionEditor>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
    const [pendingAction, setPendingAction] = useState<{
        id: number;
        type: "toggle" | "delete";
    } | null>(null);
    const deleting = pendingAction?.type === "delete";
    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const result = await request<{
                items: Promotion[];
                promotionRegionSlug: string;
            }>(`/admin/promotion-list?region=${encodeURIComponent(region)}`);
            setPromotions(result.items);
            setPromotionRegionSlug(result.promotionRegionSlug);
        }
        catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : t("Не удалось загрузить акции"));
        }
        finally {
            setLoading(false);
        }
    }, [region, request]);
    useEffect(() => {
        const timer = window.setTimeout(() => void load(), 0);
        return () => window.clearTimeout(timer);
    }, [load]);
    const save = async (event: FormEvent) => {
        event.preventDefault();
        if (!editor || saving || !can(editor.promotion ? "promotions.edit" : "promotions.create"))
            return;
        if (!editor.image) {
            onNotice(t("Загрузите изображение акции"), "error");
            return;
        }
        const ctaUrl = editor.ctaUrl.trim();
        const linkChanged = !editor.promotion || ctaUrl !== (editor.promotion.ctaUrl || "");
        if (ctaUrl && linkChanged) {
            try {
                const link = new URL(ctaUrl);
                if (!["http:", "https:"].includes(link.protocol))
                    throw new Error("protocol");
            }
            catch {
                onNotice(t("Укажите полную ссылку, начинающуюся с https:// или http://"), "error");
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
            }
            else {
                await request("/admin/promotions", {
                    method: "POST",
                    body: JSON.stringify({ ...payload, regionSlug: promotionRegionSlug }),
                });
            }
            onNotice(editor.promotion ? t("Акция обновлена") : t("Акция добавлена"), "success");
            setEditor(null);
            await load();
        }
        catch (saveError) {
            onNotice(saveError instanceof Error ? saveError.message : t("Не удалось сохранить акцию"), "error");
        }
        finally {
            setSaving(false);
        }
    };
    const toggle = async (item: Promotion) => {
        if (pendingAction || !can("promotions.edit"))
            return;
        setPendingAction({ id: item.id, type: "toggle" });
        try {
            await request(`/admin/promotions/${item.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !item.enabled }) });
            onNotice(item.enabled ? t("Акция выключена") : t("Акция включена"), "success");
            await load();
        }
        catch (toggleError) {
            onNotice(toggleError instanceof Error ? toggleError.message : t("Не удалось изменить акцию"), "error");
        }
        finally {
            setPendingAction(null);
        }
    };
    const deletePromotion = async () => {
        if (!deleteTarget || pendingAction || !can("promotions.delete"))
            return;
        const item = deleteTarget;
        setPendingAction({ id: item.id, type: "delete" });
        try {
            await request(`/admin/promotions/${item.id}`, { method: "DELETE" });
            setPromotions((current) => current.filter((promotion) => promotion.id !== item.id));
            setDeleteTarget(null);
            setEditor(null);
            onNotice(t("Акция удалена полностью"), "success");
            await load();
        }
        catch (deleteError) {
            onNotice(deleteError instanceof Error ? deleteError.message : t("Не удалось удалить акцию"), "error");
        }
        finally {
            setPendingAction(null);
        }
    };
    if (loading && !promotions.length)
        return <Card className="p-12 text-center text-muted-foreground" role="status">{t("Загружаем акции\u2026")}</Card>;
    return <div className="space-y-6"><WorkspaceHeading title={t("Акции и предложения")} action={can("promotions.create") ? <Button onClick={() => setEditor({ title: "", image: "", cta: t("Подробнее"), ctaUrl: "", enabled: true, sortOrder: String(promotions.length) })}><Plus className="size-4 shrink-0" aria-hidden="true"/>{t("Добавить акцию")}</Button> : undefined}/>
    {error ? <Card className="p-5 text-destructive" role="alert">{error}<Button variant="outline" onClick={() => void load()}>{t("Повторить загрузку")}</Button></Card> : null}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{promotions.map((item) => <Card key={item.id} className="gap-0 overflow-hidden py-0">
      <img src={item.image} alt="" className="aspect-[2/1] w-full bg-muted object-cover"/>
      <CardContent className="space-y-3 pt-5"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{item.title}</h3><Badge variant={item.enabled ? "secondary" : "outline"}>{item.enabled ? t("Активна") : t("Выключена")}</Badge></div><p className="text-sm text-muted-foreground">{item.cta || t("Без кнопки")}{t("\u00B7 позиция")}{item.sortOrder + 1}</p></CardContent>
      <CardFooter className="mt-4 justify-between p-3">{can("promotions.edit") ? <Button variant="ghost" disabled={pendingAction !== null} onClick={() => void toggle(item)}><Power className="size-4 shrink-0" aria-hidden="true"/>{item.enabled ? t("Выключить") : t("Включить")}</Button> : <span />}<RowActions label={t("акцию")} name={item.title} deleting={pendingAction?.id === item.id && deleting} deletionDisabled={pendingAction !== null} editAllowed={can("promotions.edit")} deleteAllowed={can("promotions.delete")} onEdit={() => setEditor({ promotion: item, title: item.title, image: item.image, cta: item.cta || "", ctaUrl: item.ctaUrl || "", enabled: item.enabled, sortOrder: String(item.sortOrder) })} onDelete={() => setDeleteTarget(item)}/></CardFooter>
    </Card>)}</div>{!promotions.length && !error ? <Card className="p-12 text-center"><h3 className="font-medium">{t("Акций пока нет")}</h3><p className="text-sm text-muted-foreground">{t("Добавьте предложение, чтобы показать его клиентам.")}</p></Card> : null}
    <EditorDialog open={Boolean(editor) && !deleteTarget} onClose={() => { if (!saving)
        closeEditor(); }} title={editor?.promotion ? t("Редактировать акцию") : t("Новая акция")}>{editor ? <form onSubmit={save} className="grid min-h-0 gap-4 overflow-y-auto p-4"><fieldset disabled={saving || !can(editor.promotion ? "promotions.edit" : "promotions.create")} className="contents"><Label className={labelClass}>{t("Название")}<Input required maxLength={120} value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })}/></Label><ImageUpload label={t("Баннер акции")} value={editor.image} hint={t("Рекомендуемый размер \u2014 1200 \u00D7 600 px.")} onChange={(image) => setEditor({ ...editor, image })} onError={(message) => onNotice(message, "error")}/><div className="grid gap-4 sm:grid-cols-2"><Label className={labelClass}>{t("Текст кнопки")}<Input value={editor.cta} onChange={(event) => setEditor({ ...editor, cta: event.target.value })}/></Label><Label className={labelClass}>{t("Порядок показа")}<Input type="number" min="0" value={editor.sortOrder} onChange={(event) => setEditor({ ...editor, sortOrder: event.target.value })}/></Label></div><Label className={labelClass}>{t("Ссылка кнопки")}<Input type="text" inputMode="url" maxLength={500} placeholder="https://…" value={editor.ctaUrl} onChange={(event) => setEditor({ ...editor, ctaUrl: event.target.value })}/></Label><Label className="flex items-center gap-3 rounded-lg border border-border p-4"><input type="checkbox" className="size-4 accent-primary" checked={editor.enabled} onChange={(event) => setEditor({ ...editor, enabled: event.target.checked })}/>{t("Показывать предложение клиентам")}</Label><DialogFooter><Button variant="outline" type="button" disabled={saving} onClick={closeEditor}>{t("Отменить")}</Button><Button type="submit" disabled={saving}>{saving ? t("Сохраняем\u2026") : t("Сохранить акцию")}</Button></DialogFooter></fieldset></form> : null}</EditorDialog>
    <EditorDialog open={Boolean(deleteTarget)} onClose={() => { if (!deleting)
        setDeleteTarget(null); }} title={t("Удалить акцию?")} description={t("Удаление нельзя отменить.")}><div className="space-y-4 p-4"><p className="text-sm text-muted-foreground">{t("Акция \u00AB")}{deleteTarget?.title}{t("\u00BB исчезнет во всех городах, где она показывается.")}</p><div className="flex justify-end gap-3"><Button variant="outline" disabled={deleting} onClick={() => setDeleteTarget(null)}>{t("Отменить")}</Button><Button variant="destructive" disabled={pendingAction !== null} onClick={() => void deletePromotion()}>{deleting ? t("Удаляем\u2026") : t("Удалить акцию")}</Button></div></div></EditorDialog>
  </div>;
}
