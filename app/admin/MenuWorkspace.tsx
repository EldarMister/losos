"use client";
/* eslint-disable @next/next/no-img-element */

import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

import { Icon } from "@mdi/react";
import { mdiMagnify, mdiPlus } from "@mdi/js";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { EditorDialog, ListPagination, WorkspaceHeading } from "./workspace-kit";
import { useDraftEditor } from "./use-unsaved-changes";
import { useAdminAccess } from "./admin-access";
import { ImageUpload } from "./ImageUpload";
import { RowActions } from "./RowActions";
import { notifyCatalogUpdated } from "../lib/catalog-sync";
import { ProductModifierEditor } from "./ProductModifierEditor";
import { fallbackFreeKitItems } from "./kit-catalog";
import type { AdminRequest, Category, Dashboard, ModifierGroup, Product, ProductKitItem } from "./admin-types";

type MenuWorkspaceProps = {
  region: string;
  mode?: "products" | "modifiers" | "kits";
  request: AdminRequest;
  onNotice: (message: string, tone?: "success" | "error") => void;
};

type ProductEditor = {
  product?: Product;
  categoryId: string;
  name: string;
  slug: string;
  price: string;
  oldPrice: string;
  image: string;
  description: string;
  composition: string;
  isNew: boolean;
  modifierGroups: ModifierGroup[];
  kitItems: ProductKitItem[];
  available: boolean;
  sortOrder: string;
  weight: string;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
};

const inputClass = "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-3 focus:ring-ring/20";
const labelClass = "grid gap-1.5 text-sm font-medium text-foreground";

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU")} сом`;
}

function emptyEditor(categoryId: string, sortOrder: number): ProductEditor {
  return {
    categoryId,
    name: "",
    slug: "",
    price: "0",
    oldPrice: "",
    image: "",
    description: "",
    composition: "",
    isNew: false,
    modifierGroups: [],
    kitItems: [],
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
    oldPrice: product.oldPrice == null ? "" : String(product.oldPrice),
    image: product.image,
    description: product.description || "",
    composition: product.composition || "",
    isNew: Boolean(product.isNew),
    modifierGroups: product.modifierGroups || [],
    kitItems: (product.kitItems ?? []).map((item) => ({ ...item })),
    available: product.available,
    sortOrder: String(product.sortOrder ?? 0),
    weight: String(product.weight ?? 0),
    calories: String(product.calories ?? 0),
    protein: String(product.protein ?? 0),
    fat: String(product.fat ?? 0),
    carbs: String(product.carbs ?? 0),
  };
}

export function MenuWorkspace({ region, request, onNotice, mode = "products" }: MenuWorkspaceProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [search, setSearch] = useState("");
  const [editor, setEditor, discardEditor] = useDraftEditor<ProductEditor>();
  const { can } = useAdminAccess();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [editorSection, setEditorSection] = useState<"main" | "modifiers" | "nutrition" | "kit">("main");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({region, search, limit:"25",offset:String(page * 25)});
      if (categoryFilter !== "all") query.set("categoryId", categoryFilter);
      const result = await request<{items: (Product & {categoryId: number})[];total: number; categories: Category[]; region: Dashboard["region"]; menuRegionSlug: string; kitCatalog: Dashboard["kitCatalog"]}>(`/admin/catalog-page?${query}`);
      if (sequence !== requestSequence.current) return;
      setTotal(result.total);
      setDashboard({region:result.region,menuRegionSlug:result.menuRegionSlug,kitCatalog:result.kitCatalog,promotionRegionSlug:region,promotions:[],categories:result.categories.map((category) => ({...category,products:result.items.filter((product) => product.categoryId === category.id)}))});
    } catch (loadError) {
      if (sequence !== requestSequence.current) return;
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить меню");
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [region, request, search, categoryFilter, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timer);
  }, [load]);

  const rows = useMemo(() => (dashboard?.categories ?? [])
    .flatMap((category) => category.products.map((product) => ({ product, category })))
    .filter(({ product }) => product.name.toLowerCase().includes(search.toLowerCase())), [dashboard, search]);
  const canEdit = can(mode === "modifiers" ? "modifiers.edit" : mode === "kits" ? "kits.edit" : "products.edit");
  const openProduct = (product: Product, category: Category) => { setEditor(editorFromProduct(product, category)); setEditorSection(mode === "modifiers" ? "modifiers" : mode === "kits" ? "kit" : "main"); };

  const kitCatalog = dashboard?.kitCatalog ?? dashboard?.region.freeKitItems ?? fallbackFreeKitItems;
  const availableKitItems = kitCatalog.filter((item) => item.enabled !== false);
  const unavailableKitItems = editor?.kitItems.filter((item) => !availableKitItems.some((entry) => entry.id === item.id)) ?? [];

  const setKitQuantity = (id: string, quantity: number) => {
    const nextQuantity = Number.isFinite(quantity) ? Math.max(0, Math.min(20, Math.trunc(quantity))) : 0;
    setEditor((current) => current ? {
      ...current,
      kitItems: nextQuantity > 0
        ? [...current.kitItems.filter((item) => item.id !== id), { id, quantity: nextQuantity }]
        : current.kitItems.filter((item) => item.id !== id),
    } : current);
  };

  const closeEditor = () => {
    if (!saving && discardEditor()) setEditorSection("main");
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!editor || saving || !(editor.product ? canEdit : can("products.create"))) return;
    if (mode === "products" && !editor.image) {
      onNotice("Загрузите фотографию блюда", "error");
      setEditorSection("main");
      return;
    }
    if (mode === "products" && !editor.categoryId) {
      onNotice("Сначала создайте категорию", "error");
      return;
    }
    if (mode !== "modifiers" && can("kits.edit") && unavailableKitItems.length) {
      onNotice("Удалите недоступные позиции из комплектации блюда или включите их в настройках", "error");
      setEditorSection("kit");
      return;
    }
    if (mode !== "modifiers" && can("kits.edit") && editor.kitItems.length > 20) {
      onNotice("В комплектации одного блюда может быть не более 20 позиций", "error");
      setEditorSection("kit");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        categoryId: Number(editor.categoryId),
        name: editor.name.trim(),
        ...(editor.product ? { slug: editor.product.slug } : {}),
        price: Number(editor.price),
        oldPrice: editor.oldPrice === "" ? null : Number(editor.oldPrice),
        image: editor.image,
        description: editor.description.trim(),
        composition: editor.composition.trim(),
        isNew: editor.isNew,
        ...(can("modifiers.edit") ? {modifierGroups: editor.modifierGroups} : {}),
        ...(can("kits.edit") ? {kitItems: editor.kitItems.filter((item) => item.quantity > 0)} : {}),
        available: editor.available,
        sortOrder: Number(editor.sortOrder),
        weight: Number(editor.weight),
        calories: Number(editor.calories),
        protein: Number(editor.protein),
        fat: Number(editor.fat),
        carbs: Number(editor.carbs),
      };
      if (editor.product) {
        await request(`/admin/products/${editor.product.id}`, { method: "PATCH", body: JSON.stringify(mode === "modifiers" ? { modifierGroups: editor.modifierGroups } : mode === "kits" ? { kitItems: editor.kitItems } : payload) });
      } else {
        await request("/admin/products", {
          method: "POST",
          body: JSON.stringify({ ...payload, regionSlug: dashboard?.menuRegionSlug || region }),
        });
      }
      notifyCatalogUpdated();
      onNotice(editor.product ? "Изменения блюда сохранены" : "Блюдо добавлено", "success");
      setEditor(null);
      setEditorSection("main");
      await load();
    } catch (saveError) {
      onNotice(saveError instanceof Error ? saveError.message : "Не удалось сохранить блюдо", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product: Product) => {
    if (deletingProductId !== null || !can("products.delete") || mode !== "products") return;
    if (!window.confirm(`Удалить блюдо «${product.name}» полностью? Блюдо исчезнет из меню всех городов, использующих этот каталог. История заказов сохранится. Отменить удаление нельзя.`)) return;
    setDeletingProductId(product.id);
    try {
      await request(`/admin/products/${product.id}`, { method: "DELETE" });
      notifyCatalogUpdated();
      setDashboard((current) => current ? {
        ...current,
        categories: current.categories.map((category) => ({
          ...category,
          products: category.products.filter((item) => item.id !== product.id),
        })),
      } : current);
      if (editor?.product?.id === product.id) closeEditor();
      onNotice("Блюдо полностью удалено из меню", "success");
      await load();
    } catch (deleteError) {
      onNotice(deleteError instanceof Error ? deleteError.message : "Не удалось удалить блюдо", "error");
    } finally {
      setDeletingProductId(null);
    }
  };

  if (loading && !dashboard) return <Card className="p-12 text-center text-muted-foreground" role="status">Загружаем каталог…</Card>;
  if (error && !dashboard) return <Card className="p-6 text-destructive" role="alert">{error}<Button variant="outline" onClick={() => void load()}>Повторить</Button></Card>;
  return <div className="space-y-6">
    <WorkspaceHeading title={mode === "modifiers" ? "Модификаторы" : mode === "kits" ? "Комплектации блюд" : "Каталог блюд"} description={mode === "modifiers" ? "Группы выбора, добавки и доплаты. Откройте блюдо, чтобы настроить варианты." : mode === "kits" ? "Бесплатные позиции в каждой порции. Состав настраивается отдельно от платных добавок." : "Фотографии, цены и доступность вашего меню."} action={mode === "products" && can("products.create") ? <Button className="min-h-10" onClick={() => { setEditor(emptyEditor(String(dashboard?.categories[0]?.id ?? ""), total)); setEditorSection("main"); }}><Icon path={mdiPlus} size={0.7} />Добавить блюдо</Button> : undefined} />
    <Card className="gap-0 py-0">
      <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-[1fr_220px]">
        <Label className="relative"><span className="sr-only">Поиск блюд</span><Icon path={mdiMagnify} size={0.75} className="pointer-events-none absolute left-3 top-3 text-muted-foreground" /><Input type="search" className="h-10 pl-10" placeholder="Поиск по названию" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /></Label>
        <select aria-label="Категория" className={inputClass} value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(0); }}><option value="all">Все категории</option>{dashboard?.categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</select>
      </div>
      {error ? <p role="alert" className="p-4 text-sm text-destructive">{error}</p> : null}
      {rows.length ? <>
        <div className="hidden overflow-x-auto md:block"><Table><TableHeader><TableRow><TableHead className="pl-5">Блюдо</TableHead><TableHead>Категория</TableHead><TableHead>{mode === "modifiers" ? "Группы выбора" : mode === "kits" ? "Комплектация" : "Цена"}</TableHead><TableHead>Доступность</TableHead><TableHead className="pr-5 text-right">Действия</TableHead></TableRow></TableHeader><TableBody>{rows.map(({product,category}) => <TableRow key={product.id}><TableCell className="pl-5"><div className="flex items-center gap-3"><img src={product.image} alt="" className="size-12 rounded-lg bg-muted object-contain" /><div><button type="button" className="text-left font-medium hover:underline" onClick={() => openProduct(product,category)}>{product.name}</button>{product.weight > 0 ? <p className="mt-1 text-xs text-muted-foreground">{product.weight} г</p> : null}</div></div></TableCell><TableCell className="text-muted-foreground">{category.title}</TableCell><TableCell className="font-medium">{mode === "modifiers" ? `${product.modifierGroups?.length ?? 0} групп` : mode === "kits" ? `${product.kitItems?.length ?? 0} позиций` : formatMoney(product.price)}</TableCell><TableCell><Badge variant={product.available ? "secondary" : "outline"}>{product.available ? "Доступно" : "Скрыто"}</Badge></TableCell><TableCell className="pr-4"><RowActions label="блюдо" name={product.name} deleting={deletingProductId === product.id} deletionDisabled={deletingProductId !== null} editAllowed={canEdit} deleteAllowed={mode === "products" && can("products.delete")} onEdit={() => openProduct(product,category)} onDelete={() => void deleteProduct(product)} /></TableCell></TableRow>)}</TableBody></Table></div>
        <div className="divide-y divide-border md:hidden">{rows.map(({product,category}) => <article key={product.id} className="p-4"><div className="flex gap-3"><img src={product.image} alt="" className="size-16 shrink-0 rounded-lg bg-muted object-contain" /><div className="min-w-0 flex-1"><button type="button" className="text-left font-medium" onClick={() => openProduct(product,category)}>{product.name}</button><p className="mt-1 text-xs text-muted-foreground">{category.title}</p><p className="mt-2 text-sm font-semibold">{formatMoney(product.price)}</p></div><Badge variant="outline" className="self-start">{product.available ? "В меню" : "Скрыто"}</Badge></div><RowActions label="блюдо" name={product.name} deleting={deletingProductId === product.id} deletionDisabled={deletingProductId !== null} editAllowed={canEdit} deleteAllowed={mode === "products" && can("products.delete")} onEdit={() => openProduct(product,category)} onDelete={() => void deleteProduct(product)} /></article>)}</div>
      </> : <div className="p-12 text-center"><h3 className="font-medium">Блюда не найдены</h3><p className="mt-2 text-sm text-muted-foreground">Измените поиск или добавьте первое блюдо.</p></div>}
      <ListPagination total={total} page={page} loading={loading} onPageChange={setPage} />
    </Card>
    <EditorDialog open={Boolean(editor)} onClose={closeEditor} title={editor?.product ? editor.product.name : "Новое блюдо"} description="Изменения появятся в меню после сохранения." wide>
      {editor ? <form onSubmit={saveProduct} className="flex min-h-0 flex-1 flex-col">
        {mode === "products" ? <Tabs value={editorSection} onValueChange={(value) => setEditorSection(value as typeof editorSection)} className="shrink-0 border-b border-border px-5 py-3"><TabsList className="h-auto w-full justify-start overflow-x-auto"><TabsTrigger value="main">Основное</TabsTrigger>{can("modifiers.view") ? <TabsTrigger value="modifiers">Модификаторы · {editor.modifierGroups.length}</TabsTrigger> : null}{can("kits.view") ? <TabsTrigger value="kit">Комплектация · {editor.kitItems.length}</TabsTrigger> : null}<TabsTrigger value="nutrition">Дополнительно</TabsTrigger></TabsList></Tabs> : null}
        <fieldset disabled={saving || (editor.product ? !canEdit : !can("products.create"))} className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {editorSection === "main" ? <div className="grid gap-6 lg:grid-cols-[minmax(220px,0.8fr)_1.2fr]"><Card><CardHeader><CardTitle>Фото в меню</CardTitle></CardHeader><CardContent><ImageUpload label="Фотография блюда" value={editor.image} hint="800 × 800 px, до 5 МБ." onChange={(image) => setEditor({...editor,image})} onError={(message) => onNotice(message,"error")} /></CardContent></Card><div className="grid content-start gap-5"><Label className={labelClass}>Название<Input required maxLength={140} value={editor.name} onChange={(event) => setEditor({...editor,name:event.target.value})} /></Label><Label className={labelClass}>Категория<select required className={inputClass} value={editor.categoryId} onChange={(event) => setEditor({...editor,categoryId:event.target.value})}>{dashboard?.categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</select></Label><div className="grid grid-cols-2 gap-4"><Label className={labelClass}>Цена, сом<Input required type="number" min="0" value={editor.price} onChange={(event) => setEditor({...editor,price:event.target.value})} /></Label><Label className={labelClass}>Вес, г<Input type="number" min="0" step="0.01" value={editor.weight} onChange={(event) => setEditor({...editor,weight:event.target.value})} /></Label></div><Label className={labelClass}>Описание<Textarea rows={3} value={editor.description} onChange={(event) => setEditor({...editor,description:event.target.value})} /></Label><Label className={labelClass}>Состав<Textarea rows={3} value={editor.composition} onChange={(event) => setEditor({...editor,composition:event.target.value})} /></Label><Label className="flex items-center gap-3 rounded-lg border border-border p-4"><input type="checkbox" checked={editor.available} onChange={(event) => setEditor({...editor,available:event.target.checked})} className="size-4 accent-primary" /><span><strong className="block text-sm font-medium">Доступно для заказа</strong><small className="text-muted-foreground">Скрытое блюдо остаётся в каталоге</small></span></Label></div></div> : null}
          {editorSection === "modifiers" && can("modifiers.view") ? <fieldset disabled={!can("modifiers.edit")}><ProductModifierEditor groups={editor.modifierGroups} onChange={(modifierGroups) => setEditor({...editor,modifierGroups})} /></fieldset> : null}
          {editorSection === "kit" && can("kits.view") ? <fieldset disabled={!can("kits.edit")} className="mx-auto grid max-w-3xl gap-4"><div className="rounded-xl bg-muted p-4"><h3 className="font-medium">Комплектация одной порции</h3><p className="mt-1 text-sm text-muted-foreground">Укажите бесплатные позиции. Количество умножается на число порций в заказе.</p></div>{availableKitItems.map((item) => <Label key={item.id} className="flex items-center gap-4 rounded-xl border border-border p-4">{item.image ? <img src={item.image} alt="" className="size-12 rounded-lg object-contain" /> : null}<span className="min-w-0 flex-1 font-medium">{item.name}</span><Input aria-label={`Количество: ${item.name}`} type="number" min="0" max="20" className="w-24" value={editor.kitItems.find((selected) => selected.id === item.id)?.quantity ?? 0} onChange={(event) => setKitQuantity(item.id,Number(event.target.value))} /></Label>)}{!availableKitItems.length ? <p className="text-sm text-muted-foreground">Добавьте бесплатные позиции в настройках комплектации.</p> : null}{unavailableKitItems.map((item,index) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive"><span>Недоступная позиция {index+1} · {item.quantity} шт.</span><Button variant="destructive" type="button" onClick={() => setKitQuantity(item.id,0)}>Удалить</Button></div>)}</fieldset> : null}
          {editorSection === "nutrition" ? <div className="mx-auto grid max-w-3xl gap-6"><Card><CardHeader><CardTitle>Отображение в меню</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><Label className={labelClass}>Старая цена, сом<Input type="number" min="0" value={editor.oldPrice} onChange={(event) => setEditor({...editor,oldPrice:event.target.value})} /></Label><Label className={labelClass}>Порядок в категории<Input type="number" min="0" value={editor.sortOrder} onChange={(event) => setEditor({...editor,sortOrder:event.target.value})} /></Label><Label className="flex items-center gap-3"><input type="checkbox" className="size-4 accent-primary" checked={editor.isNew} onChange={(event) => setEditor({...editor,isNew:event.target.checked})} />Отметка «Новинка»</Label></CardContent></Card><Card><CardHeader><CardTitle>Пищевая ценность</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">{([['calories','Калории, ккал'],['protein','Белки, г'],['fat','Жиры, г'],['carbs','Углеводы, г']] as const).map(([key,label]) => <Label key={key} className={labelClass}>{label}<Input type="number" min="0" value={editor[key]} onChange={(event) => setEditor({...editor,[key]:event.target.value})} /></Label>)}</CardContent></Card></div> : null}
        </fieldset>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 p-4"><Button variant="outline" type="button" onClick={closeEditor}>Отменить</Button>{(editor.product ? canEdit : can("products.create")) ? <Button type="submit" className="min-h-10" disabled={saving}>{saving ? "Сохраняем…" : "Сохранить блюдо"}</Button> : <span className="text-xs text-muted-foreground">Доступ только для просмотра</span>}</footer>
      </form> : null}
    </EditorDialog>
  </div>;
}
