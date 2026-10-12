"use client";
/* eslint-disable @next/next/no-img-element */

import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";

import { mdiPlus } from "@mdi/js";
import { Icon } from "@mdi/react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { EditorDialog, WorkspaceHeading } from "./workspace-kit";
import { useDraftEditor } from "./use-unsaved-changes";
import { useAdminAccess } from "./admin-access";
import { ImageUpload } from "./ImageUpload";
import { RowActions } from "./RowActions";
import { categoryImage, categoryProductImage } from "../lib/category-image";
import { notifyCatalogUpdated } from "../lib/catalog-sync";
import type { AdminRequest, Category } from "./admin-types";

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

const labelClass = "grid gap-1.5 text-sm font-medium text-foreground";

export function CategoriesView({ region, request, onNotice }: CategoriesViewProps) {
  const [categories, setCategories] = useState<Array<Category & {productCount:number;fallbackImage?:string}>>([]);
  const [menuRegionSlug, setMenuRegionSlug] = useState(region);
  const { can } = useAdminAccess();
  const [search, setSearch] = useState("");
  const [editor, setEditor, discardEditor] = useDraftEditor<CategoryEditor>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const closeEditor = () => { if (!saving) discardEditor(); };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await request<{items:Array<Category & {productCount:number;fallbackImage?:string}>;menuRegionSlug:string}>(`/admin/category-list?region=${encodeURIComponent(region)}`);
      setCategories(result.items.map((category) => ({...category,products:category.products ?? []})));
      setMenuRegionSlug(result.menuRegionSlug);
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
    if (!editor || saving || !can(editor.category ? "categories.edit" : "categories.create")) return;
    if (!editor.category && !editor.image.trim()) {
      onNotice("Загрузите изображение категории", "error");
      return;
    }
    setSaving(true);
    try {
      const common = {
        title: editor.title.trim(),
        ...(editor.category ? {slug:editor.category.slug} : {}),
        image: editor.image.trim(),
        sortOrder: Number(editor.sortOrder),
      };
      if (editor.category) {
        await request(`/admin/categories/${editor.category.id}`, { method: "PATCH", body: JSON.stringify(common) });
      } else {
        await request("/admin/categories", {
          method: "POST",
          body: JSON.stringify({ ...common, regionSlug: menuRegionSlug }),
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

  const deleteCategory = async (category: Category & {productCount:number}) => {
    if (deletingCategoryId !== null || !can("categories.delete")) return;
    const contents = category.productCount
      ? `Категория и все блюда в ней (${category.productCount}) будут удалены из меню всех городов, использующих этот каталог.`
      : "Категория будет удалена из меню всех городов, использующих этот каталог.";
    if (!window.confirm(`Удалить категорию «${category.title}» полностью? ${contents} История заказов сохранится. Отменить удаление нельзя.`)) return;
    setDeletingCategoryId(category.id);
    try {
      await request(`/admin/categories/${category.id}`, { method: "DELETE" });
      notifyCatalogUpdated();
      setCategories((current) => current.filter((item) => item.id !== category.id));
      if (editor?.category?.id === category.id) setEditor(null);
      onNotice("Категория удалена", "success");
      await load();
    } catch (deleteError) {
      onNotice(deleteError instanceof Error ? deleteError.message : "Не удалось удалить категорию", "error");
    } finally {
      setDeletingCategoryId(null);
    }
  };

  if (loading && !categories.length) return <Card className="p-12 text-center text-muted-foreground" role="status">Загружаем категории…</Card>;
  return <div className="space-y-6">
    <WorkspaceHeading title="Категории меню" description="Соберите понятную витрину: название, обложка и порядок категорий." action={can("categories.create") ? <Button className="min-h-10" onClick={() => setEditor({title:"",image:"",sortOrder:String(categories.length)})}><Icon path={mdiPlus} size={0.7} />Добавить категорию</Button> : undefined} />
    <Input type="search" placeholder="Найти категорию" aria-label="Поиск категорий" className="max-w-sm" value={search} onChange={(event) => setSearch(event.target.value)} />
    {error ? <Card className="p-5 text-destructive" role="alert">{error}<Button variant="outline" onClick={() => void load()}>Повторить загрузку</Button></Card> : null}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{categories.filter((category) => category.title.toLowerCase().includes(search.toLowerCase())).map((category) => <Card key={category.id} className="gap-0 overflow-hidden py-0"><div className="flex h-40 items-center justify-center bg-muted/40 p-5">{categoryImage(category) || category.fallbackImage ? <img src={categoryImage(category) || category.fallbackImage} alt="" loading="lazy" className="h-full w-full object-contain" /> : <span className="text-4xl" aria-hidden="true">🍣</span>}</div><CardContent className="space-y-1 pt-4"><h3 className="text-base font-semibold">{category.title}</h3><p className="text-sm text-muted-foreground">{category.productCount} блюд · позиция {category.sortOrder + 1}</p></CardContent><CardFooter className="mt-4 justify-between p-3"><span className="text-xs text-muted-foreground">Категория меню</span><RowActions label="категорию" name={category.title} deleting={deletingCategoryId === category.id} deletionDisabled={deletingCategoryId !== null} editAllowed={can("categories.edit")} deleteAllowed={can("categories.delete")} onEdit={() => setEditor({category,title:category.title,image:category.image,sortOrder:String(category.sortOrder)})} onDelete={() => void deleteCategory(category)} /></CardFooter></Card>)}</div>
    {!categories.length && !error ? <Card className="p-12 text-center"><h3 className="font-medium">Добавьте первую категорию</h3><p className="text-sm text-muted-foreground">После этого в неё можно будет добавить блюда.</p></Card> : null}
    <EditorDialog open={Boolean(editor)} onClose={closeEditor} title={editor?.category ? "Редактировать категорию" : "Новая категория"} description="Обложка и название видны клиентам в меню.">
      {editor ? <form className="grid min-h-0 gap-5 overflow-y-auto p-5" onSubmit={save}><fieldset disabled={saving || !can(editor.category ? "categories.edit" : "categories.create")} className="contents"><Label className={labelClass}>Название<Input required maxLength={140} value={editor.title} onChange={(event) => setEditor({...editor,title:event.target.value})} /></Label><ImageUpload label="Обложка категории" value={editor.image} fallbackValue={categoryProductImage(editor.category)} hint="Рекомендуемый размер — 1200 × 600 px." onChange={(image) => setEditor({...editor,image})} onError={(message) => onNotice(message,"error")} /><Label className={labelClass}>Порядок отображения<Input required type="number" min="0" value={editor.sortOrder} onChange={(event) => setEditor({...editor,sortOrder:event.target.value})} /><small className="font-normal text-muted-foreground">Категории с меньшим значением показаны первыми.</small></Label><div className="flex justify-between gap-3 border-t border-border pt-4"><Button type="button" variant="outline" onClick={closeEditor}>Отменить</Button><Button type="submit" disabled={saving}>{saving ? "Сохраняем…" : "Сохранить категорию"}</Button></div></fieldset></form> : null}
    </EditorDialog>
  </div>;
}
