"use client";
/* eslint-disable @next/next/no-img-element */

import { mdiClose, mdiPlus } from "@mdi/js";
import { Icon } from "@mdi/react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ImageUpload } from "./ImageUpload";
import { RowActions } from "./RowActions";
import { categoryImage, categoryProductImage } from "../lib/category-image";
import { notifyCatalogUpdated } from "../lib/catalog-sync";
import type { AdminRequest, Category, Dashboard } from "./admin-types";

type CategoriesViewProps = {
  region: string;
  request: AdminRequest;
  onNotice: (message: string, tone?: "success" | "error") => void;
};

type CategoryEditor = {
  category?: Category;
  title: string;
  image: string;
  sortOrder: string;
};

const inputClass = "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-100";
const labelClass = "grid gap-1.5 text-sm font-medium text-slate-700";
const primaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60";
const secondaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60";

function slugify(value: string) {
  const letters: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
    ң: "ng", ө: "o", ү: "u",
  };
  return value.toLowerCase().split("").map((letter) => letters[letter] ?? letter).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function categorySlug(title: string, categories: Category[]) {
  const base = (slugify(title) || "category").slice(0, 90).replace(/-+$/, "");
  const usedSlugs = new Set(categories.map((category) => category.slug));
  let slug = base;
  let suffix = 2;
  while (usedSlugs.has(slug)) slug = `${base}-${suffix++}`;
  return slug;
}

export function CategoriesView({ region, request, onNotice }: CategoriesViewProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [editor, setEditor] = useState<CategoryEditor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDashboard(await request<Dashboard>(`/admin/dashboard?region=${encodeURIComponent(region)}`));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить категории");
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
    if (!editor.category && !editor.image.trim()) {
      onNotice("Загрузите изображение категории", "error");
      return;
    }
    setSaving(true);
    try {
      const common = {
        title: editor.title.trim(),
        slug: editor.category?.slug || categorySlug(editor.title, dashboard?.categories ?? []),
        image: editor.image.trim(),
        sortOrder: Number(editor.sortOrder),
      };
      if (editor.category) {
        await request(`/admin/categories/${editor.category.id}`, { method: "PATCH", body: JSON.stringify(common) });
      } else {
        await request("/admin/categories", {
          method: "POST",
          body: JSON.stringify({ ...common, regionSlug: dashboard?.menuRegionSlug || region }),
        });
      }
      notifyCatalogUpdated();
      onNotice(editor.category ? "Категория обновлена" : "Категория добавлена", "success");
      setEditor(null);
      await load();
    } catch (saveError) {
      onNotice(saveError instanceof Error ? saveError.message : "Не удалось сохранить категорию", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category: Category) => {
    if (deletingCategoryId !== null) return;
    const contents = category.products.length
      ? `Категория и все блюда в ней (${category.products.length}) будут удалены из меню всех городов, использующих этот каталог.`
      : "Категория будет удалена из меню всех городов, использующих этот каталог.";
    if (!window.confirm(`Удалить категорию «${category.title}» полностью? ${contents} История заказов сохранится. Отменить удаление нельзя.`)) return;
    setDeletingCategoryId(category.id);
    try {
      await request(`/admin/categories/${category.id}`, { method: "DELETE" });
      notifyCatalogUpdated();
      setDashboard((current) => current ? {
        ...current,
        categories: current.categories.filter((item) => item.id !== category.id),
      } : current);
      if (editor?.category?.id === category.id) setEditor(null);
      onNotice("Категория удалена", "success");
      await load();
    } catch (deleteError) {
      onNotice(deleteError instanceof Error ? deleteError.message : "Не удалось удалить категорию", "error");
    } finally {
      setDeletingCategoryId(null);
    }
  };

  if (loading && !dashboard) {
    return <div className="grid min-h-56 place-items-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500" role="status">Загружаем данные…</div>;
  }

  if (error && !dashboard) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700" role="alert">
        <strong className="block">Не удалось загрузить данные</strong>
        <span className="mt-1 block">{error}</span>
        <button type="button" className="mt-3 font-semibold underline" onClick={() => void load()}>Повторить загрузку</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Категории показаны для выбранного города.</p>
        <button
          type="button"
          className={primaryButton}
          onClick={() => setEditor({ title: "", image: "", sortOrder: String(dashboard?.categories.length ?? 0) })}
        >
          <Icon path={mdiPlus} size={0.75} aria-hidden="true" />
          Добавить категорию
        </button>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {dashboard?.categories.length ? (
          <div className="divide-y divide-slate-200">
            {dashboard.categories.map((category) => (
              <article key={category.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-50 sm:size-14">
                    {categoryImage(category) ? <img src={categoryImage(category)} alt="" loading="lazy" className="size-full object-contain" /> : <span aria-hidden="true">🍣</span>}
                  </div>
                  <div className="min-w-0">
                    <strong className="block text-slate-950">{category.title}</strong>
                    <span className="mt-1 block text-sm text-slate-500">{category.products.length} блюд · порядок {category.sortOrder + 1}</span>
                  </div>
                </div>
                <RowActions
                    label="категорию"
                    name={category.title}
                    deleting={deletingCategoryId === category.id}
                    deletionDisabled={deletingCategoryId !== null}
                    onEdit={() => setEditor({
                      category,
                      title: category.title,
                      image: category.image,
                      sortOrder: String(category.sortOrder),
                    })}
                    onDelete={() => void deleteCategory(category)}
                />
              </article>
            ))}
          </div>
        ) : <div className="p-8 text-center text-sm text-slate-500">Категорий пока нет.</div>}
      </section>

      {editor ? (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-0 sm:p-5" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setEditor(null);
        }}>
          <section className="flex h-dvh w-full flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-40px)] sm:max-w-xl sm:rounded-xl" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <h2 id="category-modal-title" className="text-lg font-semibold text-slate-950">{editor.category ? "Редактировать категорию" : "Добавить категорию"}</h2>
              <button type="button" aria-label="Закрыть окно" className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => setEditor(null)}><Icon path={mdiClose} size={0.78} aria-hidden="true" /></button>
            </header>
            <form className="grid min-h-0 gap-5 overflow-y-auto p-5" onSubmit={save}>
              <label className={labelClass}>
                Название
                <input required className={inputClass} value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })} />
              </label>
              <ImageUpload label="Изображение категории" value={editor.image} fallbackValue={categoryProductImage(editor.category)} hint={!editor.image && categoryProductImage(editor.category) ? "На витрине используется фотография блюда из этой категории. Можно заменить её собственной фотографией." : "Рекомендуемый размер — 1200×600 px."} onChange={(image) => setEditor({ ...editor, image })} onError={(message) => onNotice(message, "error")} />
              <label className={labelClass}>Порядок<input required min="0" type="number" className={inputClass} value={editor.sortOrder} onChange={(event) => setEditor({ ...editor, sortOrder: event.target.value })} /></label>
              <div className="grid gap-2 border-t border-slate-200 pt-4 sm:grid-cols-2">
                <button type="button" className={secondaryButton} onClick={() => setEditor(null)}>Отменить</button>
                <button type="submit" className={primaryButton} disabled={saving}>{saving ? "Сохраняем…" : editor.category ? "Сохранить изменения" : "Добавить категорию"}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
