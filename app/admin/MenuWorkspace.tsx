"use client";

import { Icon } from "@mdi/react";
import { mdiClose, mdiMagnify, mdiPlus } from "@mdi/js";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ImageUpload } from "./ImageUpload";
import { ProductModifierEditor } from "./ProductModifierEditor";
import type { AdminRequest, Category, Dashboard, ModifierGroup, Product } from "./admin-types";

type MenuWorkspaceProps = {
  region: string;
  request: AdminRequest;
  onNotice: (message: string, tone?: "success" | "error") => void;
};

type ProductEditor = {
  product?: Product;
  categoryId: string;
  name: string;
  slug: string;
  price: string;
  naktaCoins: string;
  oldPrice: string;
  image: string;
  description: string;
  composition: string;
  isNew: boolean;
  modifierGroups: ModifierGroup[];
  available: boolean;
  sortOrder: string;
  weight: string;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
};

const inputClass = "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100";
const labelClass = "grid gap-1.5 text-sm font-medium text-slate-700";
const secondaryButton = "inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50";

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU")} сом`;
}

function slugify(value: string) {
  const letters: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return value.toLowerCase().split("").map((letter) => letters[letter] ?? letter).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function emptyEditor(categoryId: string, sortOrder: number): ProductEditor {
  return {
    categoryId,
    name: "",
    slug: "",
    price: "0",
    naktaCoins: "0",
    oldPrice: "",
    image: "",
    description: "",
    composition: "",
    isNew: false,
    modifierGroups: [],
    available: true,
    sortOrder: String(sortOrder),
    weight: "0",
    calories: "0",
    protein: "0",
    fat: "0",
    carbs: "0",
  };
}

function editorFromProduct(product: Product, category: Category): ProductEditor {
  return {
    product,
    categoryId: String(category.id),
    name: product.name,
    slug: product.slug,
    price: String(product.price),
    naktaCoins: String(product.naktaCoins ?? 0),
    oldPrice: product.oldPrice == null ? "" : String(product.oldPrice),
    image: product.image,
    description: product.description || "",
    composition: product.composition || "",
    isNew: Boolean(product.isNew),
    modifierGroups: product.modifierGroups || [],
    available: product.available,
    sortOrder: String(product.sortOrder ?? 0),
    weight: String(product.weight ?? 0),
    calories: String(product.calories ?? 0),
    protein: String(product.protein ?? 0),
    fat: String(product.fat ?? 0),
    carbs: String(product.carbs ?? 0),
  };
}

export function MenuWorkspace({ region, request, onNotice }: MenuWorkspaceProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<ProductEditor | null>(null);
  const [editorSection, setEditorSection] = useState<"main" | "modifiers" | "nutrition">("main");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDashboard(await request<Dashboard>(`/admin/dashboard?region=${encodeURIComponent(region)}`));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить меню");
    } finally {
      setLoading(false);
    }
  }, [region, request]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const rows = useMemo(() => (dashboard?.categories ?? [])
    .flatMap((category) => category.products.map((product) => ({ product, category })))
    .filter(({ product }) => product.name.toLowerCase().includes(search.toLowerCase())), [dashboard, search]);

  const closeEditor = () => {
    setEditor(null);
    setEditorSection("main");
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!editor || saving) return;
    if (!editor.image) {
      onNotice("Загрузите фотографию блюда", "error");
      setEditorSection("main");
      return;
    }
    if (!editor.categoryId) {
      onNotice("Сначала создайте категорию", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        categoryId: Number(editor.categoryId),
        name: editor.name.trim(),
        slug: editor.slug.trim() || slugify(editor.name),
        price: Number(editor.price),
        naktaCoins: Number(editor.naktaCoins),
        oldPrice: editor.oldPrice === "" ? null : Number(editor.oldPrice),
        image: editor.image,
        description: editor.description.trim(),
        composition: editor.composition.trim(),
        isNew: editor.isNew,
        modifierGroups: editor.modifierGroups,
        available: editor.available,
        sortOrder: Number(editor.sortOrder),
        weight: Number(editor.weight),
        calories: Number(editor.calories),
        protein: Number(editor.protein),
        fat: Number(editor.fat),
        carbs: Number(editor.carbs),
      };
      if (editor.product) {
        await request(`/admin/products/${editor.product.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await request("/admin/products", {
          method: "POST",
          body: JSON.stringify({ ...payload, regionSlug: dashboard?.menuRegionSlug || region }),
        });
      }
      onNotice(editor.product ? "Изменения блюда сохранены" : "Блюдо добавлено", "success");
      closeEditor();
      await load();
    } catch (saveError) {
      onNotice(saveError instanceof Error ? saveError.message : "Не удалось сохранить блюдо", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleProduct = async (product: Product) => {
    try {
      await request(`/admin/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ available: !product.available }),
      });
      onNotice(product.available ? "Блюдо скрыто из меню" : "Блюдо доступно для заказа", "success");
      await load();
    } catch (toggleError) {
      onNotice(toggleError instanceof Error ? toggleError.message : "Не удалось изменить доступность", "error");
    }
  };

  if (loading && !dashboard) {
    return <div className="grid min-h-56 place-items-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">Загружаем меню…</div>;
  }

  if (error && !dashboard) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700" role="alert">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative min-w-0 flex-1 sm:max-w-md">
          <span className="sr-only">Найти блюдо</span>
          <Icon path={mdiMagnify} size={0.75} aria-hidden="true" className="absolute left-3 top-3 text-slate-400" />
          <input type="search" className={`${inputClass} pl-10`} placeholder="Найти блюдо" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700" onClick={() => {
          setEditor(emptyEditor(String(dashboard?.categories[0]?.id ?? ""), rows.length));
          setEditorSection("main");
        }}>
          <Icon path={mdiPlus} size={0.75} aria-hidden="true" />
          Добавить блюдо
        </button>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {rows.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-5 py-3">Блюдо</th><th className="px-5 py-3">Категория</th><th className="px-5 py-3">Цена</th><th className="px-5 py-3">NAKTA Coin</th><th className="px-5 py-3">Доступность</th><th className="px-5 py-3 text-right">Действия</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map(({ product, category }) => (
                    <tr key={product.id}>
                      <td className="px-5 py-4 font-medium text-slate-950">{product.name}</td>
                      <td className="px-5 py-4 text-slate-600">{category.title}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{formatMoney(product.price)}</td>
                      <td className="px-5 py-4 text-slate-700">{product.naktaCoins ?? 0}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${product.available ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{product.available ? "Доступно" : "Скрыто"}</span></td>
                      <td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" className={secondaryButton} onClick={() => void toggleProduct(product)}>{product.available ? "Скрыть" : "Показать"}</button><button type="button" className={secondaryButton} onClick={() => { setEditor(editorFromProduct(product, category)); setEditorSection("main"); }}>Редактировать</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-200 md:hidden">
              {rows.map(({ product, category }) => (
                <article key={product.id} className="p-4">
                  <div className="flex items-start justify-between gap-3"><div><strong className="block text-slate-950">{product.name}</strong><span className="mt-1 block text-sm text-slate-500">{category.title} · {product.naktaCoins ?? 0} NAKTA Coin</span></div><strong className="shrink-0 text-sm text-slate-950">{formatMoney(product.price)}</strong></div>
                  <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" className={secondaryButton} onClick={() => void toggleProduct(product)}>{product.available ? "Скрыть блюдо" : "Показать блюдо"}</button><button type="button" className={secondaryButton} onClick={() => { setEditor(editorFromProduct(product, category)); setEditorSection("main"); }}>Редактировать</button></div>
                </article>
              ))}
            </div>
          </>
        ) : <div className="grid min-h-52 place-items-center p-8 text-center text-sm text-slate-500">Блюда не найдены.</div>}
      </section>

      {editor ? (
        <div className="fixed inset-0 z-50 bg-slate-950/45 p-0 sm:p-5" role="presentation">
          <form className="mx-auto flex h-dvh w-full max-w-5xl flex-col bg-white shadow-2xl sm:h-[calc(100dvh-40px)] sm:rounded-xl" onSubmit={saveProduct}>
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div><h2 className="text-lg font-semibold text-slate-950">{editor.product ? "Редактировать блюдо" : "Добавить блюдо"}</h2><p className="mt-1 text-sm text-slate-500">Заполните только понятные клиенту параметры.</p></div>
              <button type="button" aria-label="Закрыть редактор блюда" className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-600" onClick={closeEditor}><Icon path={mdiClose} size={0.78} aria-hidden="true" /></button>
            </header>
            <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4" aria-label="Разделы формы блюда">
              {([['main', 'Основное'], ['modifiers', `Модификации · ${editor.modifierGroups.length}`], ['nutrition', 'Пищевая ценность']] as const).map(([value, label]) => <button key={value} type="button" aria-current={editorSection === value ? "page" : undefined} className={`min-h-12 shrink-0 border-b-2 px-3 text-sm font-medium ${editorSection === value ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500"}`} onClick={() => setEditorSection(value)}>{label}</button>)}
            </nav>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {editorSection === "main" ? (
                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                  <ImageUpload label="Фотография блюда" value={editor.image} hint="Рекомендуемый размер — 800×800 px." onChange={(image) => setEditor({ ...editor, image })} onError={(message) => onNotice(message, "error")} />
                  <div className="grid content-start gap-4">
                    <label className={labelClass}>Название<input required className={inputClass} value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value, slug: editor.product ? editor.slug : slugify(event.target.value) })} /></label>
                    <div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Категория<select required className={inputClass} value={editor.categoryId} onChange={(event) => setEditor({ ...editor, categoryId: event.target.value })}>{dashboard?.categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</select></label><label className={labelClass}>Порядок<input min="0" type="number" className={inputClass} value={editor.sortOrder} onChange={(event) => setEditor({ ...editor, sortOrder: event.target.value })} /></label></div>
                    <div className="grid gap-4 sm:grid-cols-3"><label className={labelClass}>Цена, сом<input required min="0" type="number" className={inputClass} value={editor.price} onChange={(event) => setEditor({ ...editor, price: event.target.value })} /></label><label className={labelClass}>Старая цена<input min="0" type="number" className={inputClass} value={editor.oldPrice} onChange={(event) => setEditor({ ...editor, oldPrice: event.target.value })} /></label><label className={labelClass}>NAKTA Coin<input min="0" type="number" className={inputClass} value={editor.naktaCoins} onChange={(event) => setEditor({ ...editor, naktaCoins: event.target.value })} /></label></div>
                    <label className={labelClass}>Описание<textarea className="min-h-24 rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100" value={editor.description} onChange={(event) => setEditor({ ...editor, description: event.target.value })} /></label>
                    <label className={labelClass}>Состав<textarea className="min-h-24 rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100" value={editor.composition} onChange={(event) => setEditor({ ...editor, composition: event.target.value })} /></label>
                    <label className={labelClass}>Вес, г<input min="0" step="0.01" type="number" className={inputClass} value={editor.weight} onChange={(event) => setEditor({ ...editor, weight: event.target.value })} /></label>
                    <div className="grid gap-3 sm:grid-cols-2"><label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700"><input type="checkbox" className="size-4 accent-blue-600" checked={editor.available} onChange={(event) => setEditor({ ...editor, available: event.target.checked })} />Доступно для заказа</label><label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700"><input type="checkbox" className="size-4 accent-blue-600" checked={editor.isNew} onChange={(event) => setEditor({ ...editor, isNew: event.target.checked })} />Показывать «Новинка»</label></div>
                  </div>
                </div>
              ) : null}

              {editorSection === "modifiers" ? <ProductModifierEditor groups={editor.modifierGroups} onChange={(modifierGroups) => setEditor({ ...editor, modifierGroups })} /> : null}

              {editorSection === "nutrition" ? (
                <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
                  {([['calories', 'Калории, ккал'], ['protein', 'Белки, г'], ['fat', 'Жиры, г'], ['carbs', 'Углеводы, г']] as const).map(([key, label]) => <label key={key} className={labelClass}>{label}<input min="0" type="number" className={inputClass} value={editor[key]} onChange={(event) => setEditor({ ...editor, [key]: event.target.value })} /></label>)}
                </div>
              ) : null}
            </div>
            <footer className="grid gap-2 border-t border-slate-200 bg-white p-4 sm:grid-cols-[auto_1fr] sm:px-6">
              <button type="button" className="min-h-11 rounded-lg border border-slate-300 px-5 text-sm font-medium text-slate-700" onClick={closeEditor}>Отменить</button>
              <button type="submit" className="min-h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:justify-self-end" disabled={saving}>{saving ? "Сохраняем…" : editor.product ? "Сохранить изменения" : "Добавить блюдо"}</button>
            </footer>
          </form>
        </div>
      ) : null}
    </div>
  );
}
