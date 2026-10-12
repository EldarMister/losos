"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

import { ImageUpload } from "./ImageUpload";
import { useState } from "react";
import type { ModifierGroup, ModifierItem } from "./admin-types";

type ProductModifierEditorProps = {
  groups: ModifierGroup[];
  onChange: (groups: ModifierGroup[]) => void;
};

const inputClass = "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-ring/20";

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

export function ProductModifierEditor({ groups, onChange }: ProductModifierEditorProps) {
  const [imageError, setImageError] = useState("");
  const updateGroup = (index: number, patch: Partial<ModifierGroup>) => {
    onChange(groups.map((group, groupIndex) => groupIndex === index ? { ...group, ...patch } : group));
  };

  const updateItem = (groupIndex: number, itemIndex: number, patch: Partial<ModifierItem>) => {
    const group = groups[groupIndex];
    updateGroup(groupIndex, {
      items: group.items.map((item, currentIndex) => currentIndex === itemIndex ? { ...item, ...patch } : item),
    });
  };

  return (
    <div className="grid gap-4">
      {imageError ? <p role="alert" className="text-sm text-destructive">{imageError}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Группы выбора</h3>
        </div>
        <Button variant="ghost" type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-input px-3 text-sm font-medium text-foreground hover:bg-muted/50" onClick={() => onChange([...groups, emptyGroup()])}>
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
            <Button variant="ghost" type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-destructive/20 px-3 text-sm font-medium text-destructive hover:bg-destructive/10" onClick={() => { if (window.confirm(`Удалить группу «${group.title}» и все её варианты? Изменение применится после сохранения блюда.`)) onChange(groups.filter((_, index) => index !== groupIndex)); }}>
              <Trash2 className="size-4 shrink-0" aria-hidden="true" />
              Удалить группу
            </Button>
          </header>

          <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
              Выбор клиента
              <select className={inputClass} value={group.selectionType} onChange={(event) => updateGroup(groupIndex, { selectionType: event.target.value as ModifierGroup["selectionType"] })}>
                <option value="single">Один вариант</option>
                <option value="multiple">Несколько вариантов</option>
              </select>
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
              <input type="checkbox" className="size-4 accent-primary" checked={group.required} onChange={(event) => updateGroup(groupIndex, { required: event.target.checked })} />
              Обязательный выбор
            </Label>
          </div>

          <details className="border-b border-border px-4 py-3"><summary className="cursor-pointer text-sm font-medium">Дополнительные настройки группы</summary><div className="mt-4 grid gap-4 sm:grid-cols-2"><Label className="grid gap-1.5 text-sm">Как начислять доплату<select className={inputClass} value={group.priceScope ?? "per-line"} onChange={(event) => updateGroup(groupIndex,{priceScope:event.target.value as ModifierGroup["priceScope"]})}><option value="per-line">Один раз за позицию заказа</option><option value="per-product">За каждую порцию блюда</option></select></Label><Label className="grid gap-1.5 text-sm">Показывать варианты<select className={inputClass} value={group.presentation ?? "rows"} onChange={(event) => updateGroup(groupIndex,{presentation:event.target.value as ModifierGroup["presentation"]})}><option value="rows">Списком</option><option value="cards">Карточками с фото</option></select></Label></div></details>
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
                  <Button variant="ghost" type="button" aria-label={`Удалить вариант ${item.name || itemIndex + 1}`} className="grid size-10 place-items-center rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10" onClick={() => { if (window.confirm(`Удалить вариант «${item.name}»?`)) updateGroup(groupIndex, { items: group.items.filter((_, index) => index !== itemIndex) }); }}>
                    <Trash2 className="size-4 shrink-0" aria-hidden="true" />
                  </Button>
                </div>
                {group.presentation === "cards" ? <details className="mt-3 rounded-lg bg-muted/40 p-3"><summary className="cursor-pointer text-xs font-medium">Фотография варианта</summary><div className="mt-3"><ImageUpload compact label="Фото варианта" value={item.image} hint="Изображение для выбора в карточке блюда." onChange={(image) => updateItem(groupIndex,itemIndex,{image})} onError={setImageError} /></div></details> : null}
                <Label className="mt-3 flex items-center gap-3 text-sm text-foreground">
                  <input type="checkbox" className="size-4 accent-primary" checked={item.enabled !== false} onChange={(event) => updateItem(groupIndex, itemIndex, { enabled: event.target.checked })} />
                  Вариант доступен клиентам
                </Label>
              </article>
            ))}
            <Button variant="ghost" type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-card px-3 text-sm font-medium text-foreground hover:border-primary hover:text-primary" onClick={() => updateGroup(groupIndex, { items: [...group.items, emptyItem()] })}>
              <Plus className="size-4 shrink-0" aria-hidden="true" />
              Добавить вариант
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
