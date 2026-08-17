"use client";

import { Icon } from "@mdi/react";
import { mdiDeleteOutline, mdiPlus } from "@mdi/js";
import type { ModifierGroup, ModifierItem } from "./admin-types";

type ProductModifierEditorProps = {
  groups: ModifierGroup[];
  onChange: (groups: ModifierGroup[]) => void;
};

const inputClass = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100";

function identifier(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyItem(): ModifierItem {
  return {
    id: identifier("option"),
    name: "",
    price: 0,
    naktaCoins: 0,
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-950">Модификации блюда</h3>
          <p className="mt-1 text-sm text-slate-500">Добавки, размеры и другие варианты выбора клиента.</p>
        </div>
        <button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => onChange([...groups, emptyGroup()])}>
          <Icon path={mdiPlus} size={0.72} aria-hidden="true" />
          Добавить группу
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">У блюда пока нет модификаций.</div>
      ) : null}

      {groups.map((group, groupIndex) => (
        <section key={group.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60">
          <header className="grid gap-3 border-b border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Название группы
              <input required className={inputClass} value={group.title} onChange={(event) => updateGroup(groupIndex, { title: event.target.value })} />
            </label>
            <button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50" onClick={() => onChange(groups.filter((_, index) => index !== groupIndex))}>
              <Icon path={mdiDeleteOutline} size={0.7} aria-hidden="true" />
              Удалить группу
            </button>
          </header>

          <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1.5 text-xs font-medium text-slate-600">
              Выбор клиента
              <select className={inputClass} value={group.selectionType} onChange={(event) => updateGroup(groupIndex, { selectionType: event.target.value as ModifierGroup["selectionType"] })}>
                <option value="single">Один вариант</option>
                <option value="multiple">Несколько вариантов</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-600">
              Минимум
              <input type="number" min="0" max="99" className={inputClass} value={group.minSelections ?? 0} onChange={(event) => updateGroup(groupIndex, { minSelections: Number(event.target.value) })} />
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-600">
              Максимум
              <input type="number" min="1" max="99" className={inputClass} value={group.maxSelections ?? 1} onChange={(event) => updateGroup(groupIndex, { maxSelections: Number(event.target.value) })} />
            </label>
            <label className="flex min-h-10 items-center gap-3 self-end rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
              <input type="checkbox" className="size-4 accent-blue-600" checked={group.required} onChange={(event) => updateGroup(groupIndex, { required: event.target.checked })} />
              Обязательный выбор
            </label>
          </div>

          <div className="grid gap-3 p-4">
            {group.items.map((item, itemIndex) => (
              <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="grid gap-3 md:grid-cols-[minmax(180px,1fr)_110px_110px_100px_auto] md:items-end">
                  <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                    Название варианта
                    <input required className={inputClass} placeholder="Например, дополнительный сыр" value={item.name} onChange={(event) => updateItem(groupIndex, itemIndex, { name: event.target.value })} />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                    Цена, сом
                    <input type="number" min="0" className={inputClass} value={item.price} onChange={(event) => updateItem(groupIndex, itemIndex, { price: Number(event.target.value) })} />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                    NAKTA Coin
                    <input type="number" min="0" className={inputClass} value={item.naktaCoins ?? 0} onChange={(event) => updateItem(groupIndex, itemIndex, { naktaCoins: Number(event.target.value) })} />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium text-slate-600">
                    Макс. кол-во
                    <input type="number" min="1" max="99" className={inputClass} value={item.maxQuantity ?? 1} onChange={(event) => updateItem(groupIndex, itemIndex, { maxQuantity: Number(event.target.value) })} />
                  </label>
                  <button type="button" aria-label={`Удалить вариант ${item.name || itemIndex + 1}`} className="grid size-10 place-items-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50" onClick={() => updateGroup(groupIndex, { items: group.items.filter((_, index) => index !== itemIndex) })}>
                    <Icon path={mdiDeleteOutline} size={0.72} aria-hidden="true" />
                  </button>
                </div>
                <label className="mt-3 flex items-center gap-3 text-sm text-slate-700">
                  <input type="checkbox" className="size-4 accent-blue-600" checked={item.enabled !== false} onChange={(event) => updateItem(groupIndex, itemIndex, { enabled: event.target.checked })} />
                  Вариант доступен клиентам
                </label>
              </article>
            ))}
            <button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:border-blue-400 hover:text-blue-700" onClick={() => updateGroup(groupIndex, { items: [...group.items, emptyItem()] })}>
              <Icon path={mdiPlus} size={0.72} aria-hidden="true" />
              Добавить вариант
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}
