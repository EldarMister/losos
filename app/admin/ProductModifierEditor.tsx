"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";

import { ImageUpload } from "./ImageUpload";
import { useState, type Dispatch, type SetStateAction } from "react";
import { confirmAdminAction } from "./AdminConfirmationDialog";
import type { ModifierGroup, ModifierItem } from "./admin-types";

type ProductModifierEditorProps = {
  groups: ModifierGroup[];
  disabled?: boolean;
  onChange: Dispatch<SetStateAction<ModifierGroup[]>>;
};

const inputClass = "w-full";

function identifier(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyItem(): ModifierItem {
  return {
    id: identifier("option"),
    name: "",
    price: 0,
    image: "",
    enabled: true,
    maxQuantity: 1,
  };
}

function emptyGroup(): ModifierGroup {
  return {
    id: identifier("group"),
    title: "Новая группа",
    selectionType: "single",
    presentation: "rows",
    required: false,
    minSelections: 0,
    maxSelections: 1,
    priceScope: "per-line",
    items: [emptyItem()],
  };
}

export function ProductModifierEditor({ groups, onChange, disabled = false }: ProductModifierEditorProps) {
  const [imageError, setImageError] = useState("");
  const updateGroup = (index: number, patch: Partial<ModifierGroup>) => {
    const id = groups[index]?.id;
    onChange(current => current.map(group => group.id === id ? { ...group, ...patch } : group));
  };

  const updateItem = (groupIndex: number, itemIndex: number, patch: Partial<ModifierItem>) => {
    const groupId = groups[groupIndex]?.id;
    const itemId = groups[groupIndex]?.items[itemIndex]?.id;
    onChange(current => current.map(group => group.id === groupId ? {
      ...group, items: group.items.map(item => item.id === itemId ? { ...item, ...patch } : item),
    } : group));
  };

  return (
    <div className="grid gap-4">
      {imageError ? <p role="alert" className="text-sm text-destructive">{imageError}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Группы выбора</h3>
        </div>
        <Button variant="outline" type="button"  onClick={() => onChange([...groups, emptyGroup()])}>
          <Plus className="size-4 shrink-0" aria-hidden="true" />
          Добавить группу
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-input p-8 text-center text-sm text-muted-foreground">У блюда пока нет модификаций.</div>
      ) : null}

      {groups.map((group, groupIndex) => (
        <Card key={group.id} className="overflow-hidden rounded-xl border border-border bg-muted/30 gap-0 py-0">
          <header className="grid gap-3 border-b border-border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <Label className="grid gap-1.5 text-sm font-medium text-foreground">
              Название группы
              <Input required className={inputClass} value={group.title} onChange={(event) => updateGroup(groupIndex, { title: event.target.value })} />
            </Label>
            <Button variant="destructive" type="button" onClick={async () => { if (await confirmAdminAction(`Удалить группу «${group.title}» и все её варианты? Изменение применится после сохранения блюда.`)) onChange(current => current.filter(entry => entry.id !== group.id)); }}>
              <Trash2 className="size-4 shrink-0" aria-hidden="true" />
              Удалить группу
            </Button>
          </header>

          <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
              Выбор клиента
              <Select value={group.selectionType} disabled={disabled} onValueChange={(selectionType) => { if (selectionType) updateGroup(groupIndex, { selectionType: selectionType as ModifierGroup["selectionType"] }); }}><SelectTrigger className="w-full" aria-label="Выбор клиента"><SelectValue>{group.selectionType === "single" ? "Один вариант" : "Несколько вариантов"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="single">Один вариант</SelectItem><SelectItem value="multiple">Несколько вариантов</SelectItem></SelectContent></Select>
            </Label>
            <Label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
              Минимум
              <Input type="number" min="0" max="99" className={inputClass} value={group.minSelections ?? 0} onChange={(event) => updateGroup(groupIndex, { minSelections: Number(event.target.value) })} />
            </Label>
            <Label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
              Максимум
              <Input type="number" min="1" max="99" className={inputClass} value={group.maxSelections ?? 1} onChange={(event) => updateGroup(groupIndex, { maxSelections: Number(event.target.value) })} />
            </Label>
            <Label className="flex min-h-10 items-center gap-3 self-end rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground">
              <Switch disabled={disabled} checked={group.required} onCheckedChange={(required) => updateGroup(groupIndex, { required })} />
              Обязательный выбор
            </Label>
          </div>

          <details className="border-b border-border px-4 py-3"><summary className="cursor-pointer text-sm font-medium">Дополнительные настройки группы</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><Label className="grid gap-1.5 text-sm">Как начислять доплату<Select value={group.priceScope ?? "per-line"} disabled={disabled} onValueChange={(priceScope) => { if (priceScope) updateGroup(groupIndex, { priceScope: priceScope as ModifierGroup["priceScope"] }); }}><SelectTrigger className="w-full" aria-label="Как начислять доплату"><SelectValue>{group.priceScope === "per-product" ? "За каждую порцию блюда" : "Один раз за позицию заказа"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="per-line">Один раз за позицию заказа</SelectItem><SelectItem value="per-product">За каждую порцию блюда</SelectItem></SelectContent></Select></Label><Label className="grid gap-1.5 text-sm">Показывать варианты<Select value={group.presentation ?? "rows"} disabled={disabled} onValueChange={(presentation) => { if (presentation) updateGroup(groupIndex, { presentation: presentation as ModifierGroup["presentation"] }); }}><SelectTrigger className="w-full" aria-label="Показывать варианты"><SelectValue>{group.presentation === "cards" ? "Карточками с фото" : "Списком"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="rows">Списком</SelectItem><SelectItem value="cards">Карточками с фото</SelectItem></SelectContent></Select></Label></div></details>
          <div className="grid gap-3 p-4">
            {group.items.map((item, itemIndex) => (
              <article key={item.id} className="rounded-lg border border-border bg-card p-3">
                <div className="grid gap-3 md:grid-cols-[minmax(140px,1fr)_100px_100px_auto] md:items-end">
                  <Label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                    Название варианта
                    <Input required className={inputClass} placeholder="Например, дополнительный сыр" value={item.name} onChange={(event) => updateItem(groupIndex, itemIndex, { name: event.target.value })} />
                  </Label>
                  <Label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                    Цена, сом
                    <Input type="number" min="0" className={inputClass} value={item.price} onChange={(event) => updateItem(groupIndex, itemIndex, { price: Number(event.target.value) })} />
                  </Label>
                  <Label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                    Макс. кол-во
                    <Input type="number" min="1" max="99" className={inputClass} value={item.maxQuantity ?? 1} onChange={(event) => updateItem(groupIndex, itemIndex, { maxQuantity: Number(event.target.value) })} />
                  </Label>
                  <Button variant="destructive" type="button" aria-label={`Удалить вариант ${item.name || itemIndex + 1}`} onClick={async () => { if (await confirmAdminAction(`Удалить вариант «${item.name || `№${itemIndex + 1}`}»? Изменение применится после сохранения блюда.`)) onChange(current => current.map(entry => entry.id === group.id ? { ...entry, items: entry.items.filter(option => option.id !== item.id) } : entry)); }}>
                    <Trash2 className="size-4 shrink-0" aria-hidden="true" />
                  </Button>
                </div>
                {group.presentation === "cards" ? <details className="mt-3 rounded-lg bg-muted/40 p-3"><summary className="cursor-pointer text-xs font-medium">Фотография варианта</summary><div className="mt-3"><ImageUpload compact label="Фото варианта" value={item.image} hint="Изображение для выбора в карточке блюда." onChange={(image) => updateItem(groupIndex,itemIndex,{image})} onError={setImageError} /></div></details> : null}
                <Label className="mt-3 flex items-center gap-3 text-sm text-foreground">
                  <Switch disabled={disabled} checked={item.enabled !== false} onCheckedChange={(enabled) => updateItem(groupIndex, itemIndex, { enabled })} />
                  Вариант доступен клиентам
                </Label>
              </article>
            ))}
            <Button variant="outline" type="button"  onClick={() => updateGroup(groupIndex, { items: [...group.items, emptyItem()] })}>
              <Plus className="size-4 shrink-0" aria-hidden="true" />
              Добавить вариант
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
