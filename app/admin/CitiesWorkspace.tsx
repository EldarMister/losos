"use client";

import { Button } from "./ui/button";
import { DialogFooter } from "./ui/dialog";
import { Pencil, Plus } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

import { EditorDialog, WorkspaceHeading } from "./workspace-kit";
import { useAdminAccess } from "./admin-access";
import { useDraftEditor } from "./use-unsaved-changes";
import { type FormEvent, useState } from "react";
import type { AdminRequest, Region } from "./admin-types";

type CitiesWorkspaceProps = {
  regions: Region[];
  request: AdminRequest;
  onRegionUpdated: (region: Region) => void;
  onNotice: (message: string, tone?: "success" | "error") => void;
};

type ContentRegion = Region & { menuSourceRegionSlug?: string | null; promotionSourceRegionSlug?: string | null };
type CityDraft = {
  region?: ContentRegion;
  name: string;
  enabled: boolean;
  sortOrder: string;
  menuSourceRegionSlug: string;
  promotionSourceRegionSlug: string;
};

export function CitiesWorkspace({ regions, request, onRegionUpdated, onNotice }: CitiesWorkspaceProps) {
  const { can } = useAdminAccess();
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editor, setEditor, closeEditor] = useDraftEditor<CityDraft>();
  const [saving, setSaving] = useState(false);

  const openEditor = (region?: ContentRegion) => {
    if (region ? !can("cities.edit") && !can("settings.edit") : !can("cities.create")) return;
    setEditor({
      region,
      name: region?.name ?? "",
      enabled: region?.enabled ?? false,
      sortOrder: String(region?.sortOrder ?? (regions.length ? Math.max(...regions.map((item) => item.sortOrder)) + 1 : 0)),
      menuSourceRegionSlug: region?.menuSourceRegionSlug ?? "",
      promotionSourceRegionSlug: region?.promotionSourceRegionSlug ?? "",
    });
  };

  const saveCity = async (event: FormEvent) => {
    event.preventDefault();
    if (!editor || saving || (editor.region ? !can("cities.edit") && !can("settings.edit") : !can("cities.create"))) return;
    if (editor.region?.enabled && !editor.enabled && can("cities.edit") && !window.confirm(`Скрыть город «${editor.name}»? Клиенты не смогут выбрать его для новых заказов.`)) return;
    const payload: Record<string, string | number | boolean> = {};
    if (editor.region ? can("cities.edit") : can("cities.create")) {
      payload.name = editor.name.trim();
      payload.enabled = editor.enabled;
      payload.sortOrder = Number(editor.sortOrder);
      if (!payload.name || !Number.isInteger(payload.sortOrder) || Number(payload.sortOrder) < 0) {
        onNotice("Укажите название города и целое неотрицательное значение порядка", "error");
        return;
      }
    }
    if (can("settings.edit")) {
      if (editor.region ? editor.menuSourceRegionSlug !== (editor.region.menuSourceRegionSlug ?? "") : editor.menuSourceRegionSlug !== "") payload.menuSourceRegionSlug = editor.menuSourceRegionSlug;
      if (editor.region ? editor.promotionSourceRegionSlug !== (editor.region.promotionSourceRegionSlug ?? "") : editor.promotionSourceRegionSlug !== "") payload.promotionSourceRegionSlug = editor.promotionSourceRegionSlug;
    }
    if (!Object.keys(payload).length) { closeEditor(); return; }
    setSaving(true);
    try {
      const updated = await request<Region>(editor.region ? `/admin/regions/${editor.region.id}` : "/admin/regions", {
        method: editor.region ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      onRegionUpdated(updated);
      window.dispatchEvent(new CustomEvent("admin:regions-changed"));
      onNotice(editor.region ? "Город обновлён" : "Город добавлен. Настройте часы работы и доставку перед приёмом заказов.", "success");
      setEditor(null);
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Не удалось сохранить город", "error");
    } finally { setSaving(false); }
  };

  const changeVisibility = async (region: Region) => {
    if (savingId !== null || !can("cities.edit")) return;
    if (region.enabled && !window.confirm(`Скрыть город «${region.name}»? Новые клиенты не смогут выбрать его для заказа.`)) return;
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
    <div className="space-y-6"><WorkspaceHeading title="Города" action={can("cities.create") ? <Button onClick={() => openEditor()}><Plus className="size-4" />Добавить город</Button> : undefined} /><Card className="gap-0 px-4 py-0" aria-label="Города">
      {regions.length ? (
        <ul className="divide-y divide-border">
          {regions.map((region) => (
            <li key={region.id} className="flex flex-wrap items-center gap-3 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{region.name}</p>
              </div>
              <Badge variant={region.enabled ? "secondary" : "outline"}>{region.enabled ? "Виден" : "Скрыт"}</Badge>
              {can("cities.edit") || can("settings.edit") ? <Button variant="ghost" size="icon" aria-label={`Редактировать город ${region.name}`} title="Редактировать" disabled={saving || savingId !== null} onClick={() => openEditor(region)}><Pencil className="size-4" /></Button> : null}
              <Button variant="outline"
                type="button"
                aria-label={`${region.enabled ? "Скрыть" : "Показать"} город ${region.name}`}
                disabled={savingId !== null || !can("cities.edit")}
                onClick={() => void changeVisibility(region)}

              >
                {savingId === region.id ? "Сохраняем…" : region.enabled ? "Скрыть" : "Показать"}
              </Button>
            </li>
          ))}
        </ul>
      ) : <p className="py-6 text-sm text-muted-foreground">Городов пока нет.</p>}
    </Card>
    <EditorDialog open={Boolean(editor)} onClose={() => { if (!saving) closeEditor(); }} title={editor?.region ? "Редактировать город" : "Новый город"}>
      {editor ? <form className="grid min-h-0 gap-4 overflow-y-auto p-4" onSubmit={saveCity}>
        <fieldset disabled={saving || !(editor.region ? can("cities.edit") : can("cities.create"))} className="grid gap-4">
          <Label className="grid gap-2">Название города<Input required maxLength={100} value={editor.name} onChange={(event) => setEditor({...editor,name:event.target.value})} /></Label>
          <Label className="grid gap-2">Порядок в списке<Input required type="number" min="0" step="1" value={editor.sortOrder} onChange={(event) => setEditor({...editor,sortOrder:event.target.value})} /><span className="text-xs font-normal text-muted-foreground">Города с меньшим значением показаны первыми.</span></Label>
          <Label className="flex items-center gap-3 rounded-lg border border-border p-4"><Switch disabled={saving || !(editor.region ? can("cities.edit") : can("cities.create"))} checked={editor.enabled} onCheckedChange={(enabled) => setEditor({...editor,enabled})} />Показывать город клиентам</Label>
        </fieldset>
        {can("settings.edit") ? <fieldset disabled={saving} className="grid gap-4 rounded-xl border border-border p-4"><legend className="px-1 text-sm font-semibold">Меню и акции</legend><p className="text-sm text-muted-foreground">Можно использовать собственный каталог или содержимое другого города.</p>
          <Label className="grid gap-2">Меню<Select disabled={saving} value={editor.menuSourceRegionSlug || "own"} onValueChange={(value) => setEditor({...editor,menuSourceRegionSlug:value === "own" ? "" : String(value)})}><SelectTrigger className="w-full"><SelectValue>{editor.menuSourceRegionSlug ? regions.find((region) => region.slug === editor.menuSourceRegionSlug)?.name ?? "Выбранный город" : "Собственное меню"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="own">Собственное меню</SelectItem>{regions.filter((region) => region.id !== editor.region?.id).map((region) => <SelectItem key={region.id} value={region.slug}>{region.name}</SelectItem>)}</SelectContent></Select></Label>
          <Label className="grid gap-2">Акции<Select disabled={saving} value={editor.promotionSourceRegionSlug || "own"} onValueChange={(value) => setEditor({...editor,promotionSourceRegionSlug:value === "own" ? "" : String(value)})}><SelectTrigger className="w-full"><SelectValue>{editor.promotionSourceRegionSlug ? regions.find((region) => region.slug === editor.promotionSourceRegionSlug)?.name ?? "Выбранный город" : "Собственные акции"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="own">Собственные акции</SelectItem>{regions.filter((region) => region.id !== editor.region?.id).map((region) => <SelectItem key={region.id} value={region.slug}>{region.name}</SelectItem>)}</SelectContent></Select></Label>
        </fieldset> : null}
        <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={closeEditor}>Отменить</Button><Button type="submit" disabled={saving}>{saving ? "Сохраняем…" : editor.region ? "Сохранить город" : "Добавить город"}</Button></DialogFooter>
      </form> : null}
    </EditorDialog></div>
  );
}
