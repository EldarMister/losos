"use client";
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Region = { id: number; slug: "bishkek" | "osh"; name: string };
type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  description: string;
  composition: string;
  badge: string | null;
  available: boolean;
  sortOrder: number;
  weight: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};
type Category = { id: number; title: string; slug: string; sortOrder: number; products: Product[] };
type Promotion = { id: number; title: string; image: string; cta: string; ctaUrl: string; enabled: boolean; sortOrder: number };
type Dashboard = { region: Region; categories: Category[]; promotions: Promotion[] };
type Tab = "products" | "promotions" | "categories";
type EditorKind = "product" | "promotion" | "category";
type Editor = { kind: EditorKind; id?: number; values: Record<string, string | boolean> };

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;
const apiUrl = (configuredApiUrl || "http://localhost:4000/api").replace(/\/$/, "");
const regions = [
  { slug: "bishkek", name: "Бишкек" },
  { slug: "osh", name: "Ош" },
] as const;

const emptyProduct = (categoryId = ""): Editor => ({
  kind: "product",
  values: {
    name: "",
    slug: "",
    categoryId,
    price: "0",
    image: "",
    description: "",
    composition: "",
    badge: "",
    available: true,
    sortOrder: "0",
    weight: "0",
    calories: "0",
    protein: "0",
    fat: "0",
    carbs: "0",
  },
});

function fileToOptimizedDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать изображение"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Не удалось обработать изображение"));
      image.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function AdminApp() {
  const [token, setToken] = useState("");
  const [tokenDraft, setTokenDraft] = useState("");
  const [region, setRegion] = useState<"bishkek" | "osh">("bishkek");
  const [tab, setTab] = useState<Tab>("products");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    queueMicrotask(() => setToken(sessionStorage.getItem("losos-admin-token") || ""));
  }, []);

  const request = useCallback(async (path: string, init?: RequestInit) => {
    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
        ...init?.headers,
      },
    });
    if (response.status === 401) throw new Error("Неверный код администратора");
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const details = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
      throw new Error(details || "Не удалось сохранить изменения");
    }
    return response.json();
  }, [token]);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setMessage("");
    try {
      setDashboard(await request(`/admin/dashboard?region=${region}`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, [region, request, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const products = useMemo(() => dashboard?.categories.flatMap((category) =>
    category.products.map((product) => ({ ...product, categoryId: category.id, categoryTitle: category.title }))) || [], [dashboard]);

  const openProduct = (product?: Product & { categoryId: number }) => {
    if (!product) {
      setEditor(emptyProduct(String(dashboard?.categories[0]?.id || "")));
      return;
    }
    setEditor({
      kind: "product",
      id: product.id,
      values: {
        name: product.name,
        slug: product.slug,
        image: product.image,
        description: product.description,
        composition: product.composition,
        available: product.available,
        badge: product.badge || "",
        categoryId: String(product.categoryId),
        price: String(product.price),
        sortOrder: String(product.sortOrder),
        weight: String(product.weight),
        calories: String(product.calories),
        protein: String(product.protein),
        fat: String(product.fat),
        carbs: String(product.carbs),
      },
    });
  };

  const openPromotion = (promotion?: Promotion) => setEditor(promotion ? {
    kind: "promotion",
    id: promotion.id,
    values: {
      title: promotion.title,
      image: promotion.image,
      cta: promotion.cta,
      ctaUrl: promotion.ctaUrl,
      enabled: promotion.enabled,
      sortOrder: String(promotion.sortOrder),
    },
  } : {
    kind: "promotion",
    values: { title: "", image: "", cta: "", ctaUrl: "", enabled: true, sortOrder: "0" },
  });

  const openCategory = (category?: Category) => setEditor(category ? {
    kind: "category",
    id: category.id,
    values: { title: category.title, slug: category.slug, sortOrder: String(category.sortOrder) },
  } : {
    kind: "category",
    values: { title: "", slug: "", sortOrder: "0" },
  });

  const updateValue = (name: string, value: string | boolean) => {
    setEditor((current) => current ? { ...current, values: { ...current.values, [name]: value } } : current);
  };

  const saveEditor = async (event: FormEvent) => {
    event.preventDefault();
    if (!editor) return;
    const numberFields = ["categoryId", "price", "sortOrder", "weight", "calories", "protein", "fat", "carbs"];
    const payload = Object.fromEntries(Object.entries(editor.values).map(([key, value]) =>
      [key, numberFields.includes(key) ? Number(value) : value]));
    if (!editor.id) payload.regionSlug = region;
    const resource = editor.kind === "product" ? "products" : editor.kind === "promotion" ? "promotions" : "categories";
    setLoading(true);
    setMessage("");
    try {
      await request(`/admin/${resource}${editor.id ? `/${editor.id}` : ""}`, {
        method: editor.id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setEditor(null);
      setMessage("Изменения сохранены");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить изменения");
    } finally {
      setLoading(false);
    }
  };

  const deleteEditor = async () => {
    if (!editor?.id || !window.confirm("Удалить без возможности восстановления?")) return;
    const resource = editor.kind === "product" ? "products" : editor.kind === "promotion" ? "promotions" : "categories";
    setLoading(true);
    try {
      await request(`/admin/${resource}/${editor.id}`, { method: "DELETE" });
      setEditor(null);
      setMessage("Удалено");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить");
    } finally {
      setLoading(false);
    }
  };

  const authorize = (event: FormEvent) => {
    event.preventDefault();
    const nextToken = tokenDraft.trim();
    if (!nextToken) return;
    sessionStorage.setItem("losos-admin-token", nextToken);
    setToken(nextToken);
  };

  const logout = () => {
    sessionStorage.removeItem("losos-admin-token");
    setToken("");
    setDashboard(null);
  };

  if (!token) {
    return <main className="admin-login">
      <form onSubmit={authorize}>
        <div className="admin-mark">МЛ</div>
        <h1>Управление меню</h1>
        <p>Введите код администратора. Он хранится только в этом браузере.</p>
        <input type="password" value={tokenDraft} onChange={(event) => setTokenDraft(event.target.value)} placeholder="Код администратора" autoFocus />
        <button type="submit">Войти</button>
        {!configuredApiUrl ? <small>Для публикации нужно указать NEXT_PUBLIC_API_URL.</small> : null}
      </form>
    </main>;
  }

  return <main className="admin-shell">
    <header className="admin-header">
      <div><div className="admin-mark">МЛ</div><span><b>Управление меню</b><small>Блюда и акции по городам</small></span></div>
      <button className="admin-logout" onClick={logout}>Выйти</button>
    </header>

    <section className="admin-toolbar">
      <div className="admin-regions" aria-label="Регион">
        {regions.map((item) => <button key={item.slug} className={region === item.slug ? "active" : ""} onClick={() => { setRegion(item.slug); setEditor(null); }}>{item.name}</button>)}
      </div>
      <nav className="admin-tabs">
        <button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>Блюда</button>
        <button className={tab === "promotions" ? "active" : ""} onClick={() => setTab("promotions")}>Акции</button>
        <button className={tab === "categories" ? "active" : ""} onClick={() => setTab("categories")}>Категории</button>
      </nav>
    </section>

    {message ? <div className="admin-message">{message}</div> : null}
    {loading && !dashboard ? <div className="admin-loading">Загружаем…</div> : null}

    <section className="admin-content">
      <div className="admin-section-title">
        <div>
          <h1>{tab === "products" ? "Блюда" : tab === "promotions" ? "Акции" : "Категории"}</h1>
          <p>{dashboard?.region.name || regions.find((item) => item.slug === region)?.name}</p>
        </div>
        <button className="admin-add" onClick={() => tab === "products" ? openProduct() : tab === "promotions" ? openPromotion() : openCategory()}>+ Добавить</button>
      </div>

      {tab === "products" ? <div className="admin-grid">
        {products.map((product) => <button className="admin-product" key={product.id} onClick={() => openProduct(product)}>
          <img src={product.image} alt="" />
          <span><b>{product.name}</b><small>{product.categoryTitle}</small><strong>{product.price} сом</strong></span>
          <i className={product.available ? "available" : ""}>{product.available ? "В продаже" : "Недоступно"}</i>
        </button>)}
      </div> : null}

      {tab === "promotions" ? <div className="admin-grid admin-promotions">
        {dashboard?.promotions.map((promotion) => <button className="admin-promotion" key={promotion.id} onClick={() => openPromotion(promotion)}>
          <img src={promotion.image} alt="" />
          <span><b>{promotion.title}</b><small>{promotion.enabled ? "Показывается на сайте" : "Скрыта"}</small></span>
        </button>)}
      </div> : null}

      {tab === "categories" ? <div className="admin-categories">
        {dashboard?.categories.map((category) => <button key={category.id} onClick={() => openCategory(category)}>
          <span><b>{category.title}</b><small>{category.products.length} блюд · {category.slug}</small></span><strong>Изменить</strong>
        </button>)}
      </div> : null}
    </section>

    {editor ? <div className="admin-editor-overlay" role="dialog" aria-modal="true" aria-label="Редактирование" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditor(null); }}>
      <form className="admin-editor" onSubmit={saveEditor}>
        <div className="admin-editor-head">
          <span><small>{editor.id ? "Редактирование" : "Новая запись"}</small><b>{editor.kind === "product" ? "Блюдо" : editor.kind === "promotion" ? "Акция" : "Категория"}</b></span>
          <button type="button" onClick={() => setEditor(null)} aria-label="Закрыть">×</button>
        </div>

        <label>Название<input required value={String(editor.values.title || editor.values.name || "")} onChange={(event) => updateValue(editor.kind === "product" ? "name" : "title", event.target.value)} /></label>
        {editor.kind !== "promotion" ? <label>Адрес в ссылке<input required value={String(editor.values.slug || "")} onChange={(event) => updateValue("slug", event.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="filadelfiya" /></label> : null}
        {editor.kind === "product" ? <>
          <div className="admin-two-fields">
            <label>Категория<select value={String(editor.values.categoryId || "")} onChange={(event) => updateValue("categoryId", event.target.value)}>{dashboard?.categories.map((category) => <option value={category.id} key={category.id}>{category.title}</option>)}</select></label>
            <label>Цена, сом<input required type="number" min="0" value={String(editor.values.price)} onChange={(event) => updateValue("price", event.target.value)} /></label>
          </div>
          <ImageField value={String(editor.values.image || "")} onChange={(value) => updateValue("image", value)} />
          <label>Короткое описание<textarea value={String(editor.values.description || "")} onChange={(event) => updateValue("description", event.target.value)} /></label>
          <label>Состав<textarea value={String(editor.values.composition || "")} onChange={(event) => updateValue("composition", event.target.value)} /></label>
          <div className="admin-two-fields"><label>Бейдж<input value={String(editor.values.badge || "")} onChange={(event) => updateValue("badge", event.target.value)} placeholder="🌶️" /></label><label>Порядок<input type="number" min="0" value={String(editor.values.sortOrder)} onChange={(event) => updateValue("sortOrder", event.target.value)} /></label></div>
          <div className="admin-nutrition">
            {[["weight", "Граммы"], ["calories", "Ккал"], ["protein", "Белки"], ["fat", "Жиры"], ["carbs", "Углеводы"]].map(([name, label]) => <label key={name}>{label}<input type="number" min="0" value={String(editor.values[name])} onChange={(event) => updateValue(name, event.target.value)} /></label>)}
          </div>
          <label className="admin-switch"><span><b>В продаже</b><small>Можно заказать на сайте</small></span><input type="checkbox" checked={Boolean(editor.values.available)} onChange={(event) => updateValue("available", event.target.checked)} /></label>
        </> : null}
        {editor.kind === "promotion" ? <>
          <ImageField value={String(editor.values.image || "")} onChange={(value) => updateValue("image", value)} />
          <label>Ссылка кнопки<input type="url" required={Boolean(editor.values.cta)} value={String(editor.values.ctaUrl || "")} onChange={(event) => updateValue("ctaUrl", event.target.value)} placeholder="https://t.me/..." /></label>
          <div className="admin-two-fields"><label>Текст кнопки<input value={String(editor.values.cta || "")} onChange={(event) => updateValue("cta", event.target.value)} placeholder="Подробнее" /></label><label>Порядок<input type="number" min="0" value={String(editor.values.sortOrder)} onChange={(event) => updateValue("sortOrder", event.target.value)} /></label></div>
          <label className="admin-switch"><span><b>Показывать акцию</b><small>В ленте выбранного города</small></span><input type="checkbox" checked={Boolean(editor.values.enabled)} onChange={(event) => updateValue("enabled", event.target.checked)} /></label>
        </> : null}
        {editor.kind === "category" ? <label>Порядок<input type="number" min="0" value={String(editor.values.sortOrder)} onChange={(event) => updateValue("sortOrder", event.target.value)} /></label> : null}

        <div className="admin-editor-actions">
          {editor.id ? <button type="button" className="admin-delete" onClick={deleteEditor}>Удалить</button> : <span />}
          <button type="submit" className="admin-save" disabled={loading}>{loading ? "Сохраняем…" : "Сохранить"}</button>
        </div>
      </form>
    </div> : null}
  </main>;
}

function ImageField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [processing, setProcessing] = useState(false);
  const selectFile = async (file?: File) => {
    if (!file) return;
    setProcessing(true);
    try {
      onChange(await fileToOptimizedDataUrl(file));
    } finally {
      setProcessing(false);
    }
  };
  return <label className="admin-image-field">
    Фото
    {value ? <img src={value} alt="Предпросмотр" /> : null}
    <input required={!value} value={value.startsWith("data:") ? "" : value} onChange={(event) => onChange(event.target.value)} placeholder="Ссылка на изображение" />
    <span className="admin-upload">📷 {processing ? "Обрабатываем…" : "Выбрать фото с телефона"}<input type="file" accept="image/*" onChange={(event) => void selectFile(event.target.files?.[0])} /></span>
  </label>;
}
