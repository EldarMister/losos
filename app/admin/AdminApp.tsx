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
  isNew: boolean;
  modifierGroups: ModifierGroup[];
  available: boolean;
  sortOrder: number;
  weight: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};
type ModifierItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  enabled?: boolean;
  maxQuantity?: number;
};
type ModifierGroup = {
  id: string;
  title: string;
  selectionType: "single" | "multiple";
  presentation?: "rows" | "cards";
  required: boolean;
  minSelections?: number;
  maxSelections?: number;
  priceScope?: "per-product" | "per-line";
  items: ModifierItem[];
};
type Category = { id: number; title: string; slug: string; sortOrder: number; products: Product[] };
type Promotion = { id: number; title: string; image: string; cta: string; ctaUrl: string; enabled: boolean; sortOrder: number };
type Dashboard = { region: Region; categories: Category[]; promotions: Promotion[] };
type OrderStatus = "new" | "confirmed" | "preparing" | "ready" | "delivering" | "completed" | "cancelled";
type OrderModifierSnapshot = {
  groupId: string;
  groupTitle: string;
  itemId: string;
  itemName: string;
  price: number;
  quantity: number;
  totalPrice: number;
  priceScope: "per-product" | "per-line";
};
type AdminOrderItem = {
  id: number;
  productId: number;
  productName: string;
  basePrice: number;
  baseTotal?: number;
  modifiersPrice: number;
  modifiersTotal?: number;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  pricingVersion?: string;
  modifierSnapshots: OrderModifierSnapshot[];
};
type AdminOrder = {
  id: string;
  regionSlug: string;
  deliveryType: "delivery" | "pickup";
  customerName: string;
  phone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  apartment: string;
  entrance: string;
  floor: string;
  intercom: string;
  comment: string;
  utensilsCount: number;
  noUtensils: boolean;
  paymentMethod: "cash" | "card" | "online";
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
};
type OrdersResponse = { items: AdminOrder[]; total: number; limit: number; offset: number };
type Tab = "orders" | "products" | "promotions" | "categories";
type EditorKind = "product" | "promotion" | "category";
type EditorValue = string | boolean | ModifierGroup[];
type Editor = { kind: EditorKind; id?: number; values: Record<string, EditorValue> };

const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:4000/api"
    : "https://losos-production.up.railway.app/api")
).replace(/\/$/, "");
const regions = [
  { slug: "bishkek", name: "Бишкек" },
  { slug: "osh", name: "Ош" },
] as const;
const orderStatusLabels: Record<OrderStatus, string> = {
  new: "Новый",
  confirmed: "Подтверждён",
  preparing: "Готовится",
  ready: "Готов",
  delivering: "В пути",
  completed: "Завершён",
  cancelled: "Отменён",
};
const orderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["delivering", "completed", "cancelled"],
  delivering: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const formatOrderDate = (value: string) => new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date(value));

const formatOrderNumber = (id: string) => `№ ${id.slice(0, 8).toUpperCase()}`;

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
    isNew: false,
    modifierGroups: [],
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
  const [tab, setTab] = useState<Tab>("orders");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState<"all" | OrderStatus>("all");

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

  const loadOrders = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setOrdersLoading(true);
    try {
      const result = await request(`/admin/orders?regionSlug=${region}&limit=100`) as OrdersResponse;
      setOrders(result.items);
      setOrdersTotal(result.total);
      setSelectedOrder((current) => current
        ? result.items.find((order) => order.id === current.id) || current
        : null);
    } catch (error) {
      if (!silent) setMessage(error instanceof Error ? error.message : "Не удалось загрузить заказы");
    } finally {
      if (!silent) setOrdersLoading(false);
    }
  }, [region, request, token]);

  useEffect(() => {
    if (tab !== "orders" || !token) return;
    const initialTimer = window.setTimeout(() => void loadOrders(), 0);
    const refreshTimer = window.setInterval(() => void loadOrders(true), 15_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(refreshTimer);
    };
  }, [loadOrders, tab, token]);

  const products = useMemo(() => dashboard?.categories.flatMap((category) =>
    category.products.map((product) => ({ ...product, categoryId: category.id, categoryTitle: category.title }))) || [], [dashboard]);
  const normalizedSearch = search.trim().toLocaleLowerCase("ru");
  const visibleOrders = useMemo(() => orders.filter((order) => {
    const matchesStatus = orderFilter === "all" || order.status === orderFilter;
    const haystack = `${order.id} ${order.customerName} ${order.phone} ${order.address}`.toLocaleLowerCase("ru");
    return matchesStatus && (!normalizedSearch || haystack.includes(normalizedSearch));
  }), [normalizedSearch, orderFilter, orders]);
  const visibleProducts = useMemo(() => products.filter((product) =>
    !normalizedSearch || `${product.name} ${product.categoryTitle} ${product.id}`.toLocaleLowerCase("ru").includes(normalizedSearch)
  ), [normalizedSearch, products]);
  const visiblePromotions = useMemo(() => (dashboard?.promotions || []).filter((promotion) =>
    !normalizedSearch || promotion.title.toLocaleLowerCase("ru").includes(normalizedSearch)
  ), [dashboard?.promotions, normalizedSearch]);
  const visibleCategories = useMemo(() => (dashboard?.categories || []).filter((category) =>
    !normalizedSearch || `${category.title} ${category.slug}`.toLocaleLowerCase("ru").includes(normalizedSearch)
  ), [dashboard?.categories, normalizedSearch]);

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
        isNew: product.isNew,
        modifierGroups: product.modifierGroups || [],
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

  const updateValue = (name: string, value: EditorValue) => {
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
    setOrders([]);
    setSelectedOrder(null);
  };

  const updateOrderStatus = async (order: AdminOrder, status: OrderStatus) => {
    setOrdersLoading(true);
    setMessage("");
    try {
      const updated = await request(`/admin/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }) as AdminOrder;
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelectedOrder(updated);
      setMessage(`${formatOrderNumber(updated.id)}: ${orderStatusLabels[updated.status]}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось изменить статус");
    } finally {
      setOrdersLoading(false);
    }
  };

  if (!token) {
    return <main className="admin-login">
      <header className="admin-login-brand">
        <div className="admin-mark">МЛ</div>
        <span><b>Управление меню</b><small>Блюда и акции по городам</small></span>
      </header>
      <form onSubmit={authorize}>
        <h1>Вход в систему</h1>
        <p>Введите код администратора для доступа к панели управления.</p>
        <label>Код администратора
          <span className="admin-login-input"><i>♙</i><input type="password" value={tokenDraft} onChange={(event) => setTokenDraft(event.target.value)} placeholder="Введите код" autoFocus /></span>
        </label>
        <button type="submit">Войти</button>
        <small>▣&nbsp;&nbsp; Код сохраняется в этом браузере</small>
      </form>
      <div className="admin-login-regions" aria-label="Регион">
        {regions.map((item) => <button type="button" key={item.slug} className={region === item.slug ? "active" : ""} onClick={() => setRegion(item.slug)}>{item.name}</button>)}
      </div>
    </main>;
  }

  const tabTitle = tab === "orders" ? "Заказы" : tab === "products" ? "Блюда" : tab === "promotions" ? "Акции" : "Категории";
  const tabIcon: Record<Tab, string> = { orders: "▣", products: "♨", promotions: "✿", categories: "▦" };
  const filterOptions: { value: "all" | OrderStatus; label: string }[] = [
    { value: "all", label: "Все" },
    { value: "new", label: "Новые" },
    { value: "confirmed", label: "Подтверждены" },
    { value: "preparing", label: "Готовятся" },
    { value: "completed", label: "Доставлены" },
  ];

  return <main className={`admin-shell${selectedOrder ? " has-order" : ""}`}>
    <header className="admin-header">
      <div><div className="admin-mark">МЛ</div><span><b>Управление меню</b><small>Блюда и акции по городам</small></span></div>
      <div className="admin-account">
        <button className="admin-notifications" aria-label="Уведомления">♧<i>{orders.filter((order) => order.status === "new").length || 0}</i></button>
        <span className="admin-avatar">●</span>
        <span><b>Администратор</b><small>Супер-админ</small></span>
        <button className="admin-account-arrow" aria-label="Меню профиля">⌄</button>
      </div>
    </header>

    <aside className="admin-sidebar">
      <nav>
        {(["orders", "products", "promotions", "categories"] as Tab[]).map((item) =>
          <button key={item} className={tab === item ? "active" : ""} onClick={() => { setTab(item); setSearch(""); setEditor(null); }}>
            <i>{tabIcon[item]}</i><span>{item === "orders" ? "Заказы" : item === "products" ? "Блюда" : item === "promotions" ? "Акции" : "Категории"}</span>
          </button>)}
      </nav>
      <div>
        <button><i>⚙</i><span>Настройки</span></button>
        <button onClick={logout}><i>⇥</i><span>Выход</span></button>
      </div>
    </aside>

    <nav className="admin-mobile-nav">
      {(["orders", "products", "promotions", "categories"] as Tab[]).map((item) =>
        <button key={item} className={tab === item ? "active" : ""} onClick={() => { setTab(item); setSearch(""); setEditor(null); }}>
          <i>{tabIcon[item]}</i><span>{item === "orders" ? "Заказы" : item === "products" ? "Блюда" : item === "promotions" ? "Акции" : "Категории"}</span>
        </button>)}
      <button onClick={logout}><i>•••</i><span>Ещё</span></button>
    </nav>

    {message ? <div className="admin-message">{message}</div> : null}
    {loading && !dashboard ? <div className="admin-loading">Загружаем…</div> : null}

    <section className="admin-content">
      <div className="admin-mobile-title">
        <div className="admin-mark">МЛ</div>
        <h1>{tabTitle}</h1>
        <button onClick={() => setRegion(region === "bishkek" ? "osh" : "bishkek")}>{regions.find((item) => item.slug === region)?.name}⌄</button>
        <span>≡⌕</span>
      </div>
      <div className="admin-regions" aria-label="Регион">
        {regions.map((item) => <button key={item.slug} className={region === item.slug ? "active" : ""} onClick={() => { setRegion(item.slug); setEditor(null); }}>{item.name}</button>)}
      </div>
      <div className="admin-section-title">
        <div>
          <h1>{tabTitle}</h1>
          {tab === "orders" ? <p>{ordersTotal} заказов в выбранном городе</p> : null}
        </div>
        {tab === "orders"
          ? <button className="admin-refresh" disabled={ordersLoading} onClick={() => void loadOrders()} aria-label="Обновить заказы">↻</button>
          : <button className="admin-add" onClick={() => tab === "products" ? openProduct() : tab === "promotions" ? openPromotion() : openCategory()}>＋ Добавить {tab === "products" ? "блюдо" : tab === "promotions" ? "акцию" : "категорию"}</button>}
      </div>

      {tab === "orders" ? <>
        <div className="admin-order-filters">
          {filterOptions.map((option) => <button key={option.value} className={orderFilter === option.value ? "active" : ""} onClick={() => setOrderFilter(option.value)}>
            {option.label}{option.value !== "all" ? <i>{orders.filter((order) => order.status === option.value).length}</i> : null}
          </button>)}
        </div>
        <div className="admin-list-tools">
          <label><i>⌕</i><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по № заказа, клиенту или адресу..." /></label>
          <button>☷&nbsp; Фильтры</button>
        </div>
        <div className="admin-orders">
          <div className="admin-table-head"><span>№ заказа</span><span>Клиент</span><span>Адрес</span><span>Статус</span><span>Позиций</span><span>Сумма</span><span>Время</span></div>
        {visibleOrders.map((order) => <button className={`admin-order-card${selectedOrder?.id === order.id ? " selected" : ""}`} key={order.id} onClick={() => setSelectedOrder(order)}>
          <span className="admin-check">{selectedOrder?.id === order.id ? "✓" : ""}</span>
          <span className="admin-order-number"><b>{order.id.slice(0, 8).toUpperCase()}</b><small>{order.phone}</small></span>
          <span className="admin-order-customer"><b>{order.customerName}</b><small>{order.phone}</small></span>
          <span className="admin-order-address">{order.deliveryType === "pickup" ? "Самовывоз" : order.address}</span>
          <span className={`admin-order-status status-${order.status}`}>{orderStatusLabels[order.status]}</span>
          <span className="admin-order-count">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
          <span className="admin-order-total">{order.total.toLocaleString("ru-RU")} сом</span>
          <span className="admin-order-time">{formatOrderDate(order.createdAt)}</span>
          <span className="admin-order-open">›</span>
        </button>)}
        {!ordersLoading && orders.length === 0 ? <div className="admin-empty"><b>Заказов пока нет</b><span>Новые заказы появятся здесь автоматически.</span></div> : null}
        {!ordersLoading && orders.length > 0 && visibleOrders.length === 0 ? <div className="admin-empty"><b>Ничего не найдено</b><span>Попробуйте изменить поиск или фильтр.</span></div> : null}
        <footer><span>Показано {visibleOrders.length} из {ordersTotal}</span><b>‹</b><b className="active">1</b><b>2</b><b>›</b></footer>
      </div></> : null}

      {tab !== "orders" ? <div className="admin-list-tools">
        <label><i>⌕</i><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tab === "products" ? "Поиск по названию блюда" : tab === "promotions" ? "Поиск по акциям" : "Поиск по категориям"} /></label>
        <button>☷&nbsp; Фильтры</button>
      </div> : null}

      {tab === "products" ? <div className="admin-products-table">
        <div className="admin-products-head"><span>Блюдо</span><span>Категория</span><span>Цена</span><span>Статус</span><span>Действия</span></div>
        {visibleProducts.map((product) => <button className="admin-product" key={product.id} onClick={() => openProduct(product)}>
          <img src={product.image} alt="" />
          <span><b>{product.name}</b><small>ID: {product.id}</small></span>
          <span className="admin-product-category">{product.categoryTitle}</span>
          <strong>{product.price} сом</strong>
          <i className={product.available ? "available" : ""}>{product.available ? "В продаже" : "Недоступно"}</i>
          <span className="admin-row-actions">⌕&nbsp;&nbsp; ⋮</span>
        </button>)}
      </div> : null}

      {tab === "promotions" ? <div className="admin-grid admin-promotions">
        {visiblePromotions.map((promotion) => <button className="admin-promotion" key={promotion.id} onClick={() => openPromotion(promotion)}>
          <img src={promotion.image} alt="" />
          <span><b>{promotion.title}</b><small>{promotion.enabled ? "Показывается на сайте" : "Скрыта"}</small><strong>Изменить →</strong></span>
        </button>)}
      </div> : null}

      {tab === "categories" ? <div className="admin-categories">
        <div className="admin-categories-head"><span>Название</span><span>Блюд</span><span>Slug</span><span>Порядок</span><span>Видимость</span><span>Действия</span></div>
        {visibleCategories.map((category) => <button key={category.id} onClick={() => openCategory(category)}>
          <i>⁙</i><span><b>{category.title}</b></span><em>{category.products.length}</em><small>{category.slug}</small><em>{category.sortOrder}</em><strong>Видимая</strong><span className="admin-row-actions">⌕&nbsp;&nbsp; ⋮</span>
        </button>)}
      </div> : null}
    </section>

    {editor ? <div className="admin-editor-overlay admin-editor-page" role="dialog" aria-modal="true" aria-label="Редактирование" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditor(null); }}>
      <form className={`admin-editor admin-editor-${editor.kind}`} onSubmit={saveEditor}>
        <div className="admin-editor-head">
          <span><small>‹ &nbsp; Управление меню</small><b>{editor.id ? "Редактирование" : "Добавление"} {editor.kind === "product" ? "блюда" : editor.kind === "promotion" ? "акции" : "категории"}</b></span>
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
          <label>Порядок<input type="number" min="0" value={String(editor.values.sortOrder)} onChange={(event) => updateValue("sortOrder", event.target.value)} /></label>
          <ModifierGroupsEditor value={editor.values.modifierGroups as ModifierGroup[] || []} onChange={(value) => updateValue("modifierGroups", value)} />
          <div className="admin-nutrition">
            {[["weight", "Граммы"], ["calories", "Ккал"], ["protein", "Белки"], ["fat", "Жиры"], ["carbs", "Углеводы"]].map(([name, label]) => <label key={name}>{label}<input type="number" min="0" value={String(editor.values[name])} onChange={(event) => updateValue(name, event.target.value)} /></label>)}
          </div>
          <label className="admin-switch"><span><b>Бейдж «Новинка»</b><small>Фиксированно справа снизу на фото</small></span><input type="checkbox" checked={Boolean(editor.values.isNew)} onChange={(event) => updateValue("isNew", event.target.checked)} /></label>
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

    {selectedOrder ? <div className="admin-editor-overlay admin-order-overlay" role="dialog" aria-modal="true" aria-label={`Заказ ${formatOrderNumber(selectedOrder.id)}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedOrder(null); }}>
      <section className="admin-order-detail">
        <div className="admin-editor-head">
          <span><small>{formatOrderDate(selectedOrder.createdAt)}</small><b>{formatOrderNumber(selectedOrder.id)}</b></span>
          <button type="button" onClick={() => setSelectedOrder(null)} aria-label="Закрыть">×</button>
        </div>

        <div className="admin-order-detail-status">
          <span className={`admin-order-status status-${selectedOrder.status}`}>{orderStatusLabels[selectedOrder.status]}</span>
          <strong>{selectedOrder.total} сом</strong>
        </div>

        <div className="admin-order-contact">
          <span><small>Клиент</small><b>{selectedOrder.customerName}</b></span>
          <a href={`tel:${selectedOrder.phone}`}><small>Телефон</small><b>{selectedOrder.phone}</b></a>
          <span className="wide"><small>{selectedOrder.deliveryType === "pickup" ? "Самовывоз" : "Адрес доставки"}</small><b>{selectedOrder.address}</b></span>
          {typeof selectedOrder.latitude === "number" && typeof selectedOrder.longitude === "number" ? <a className="wide" href={`https://yandex.ru/maps/?pt=${selectedOrder.longitude},${selectedOrder.latitude}&z=17&l=map`} target="_blank" rel="noreferrer"><small>Координаты</small><b>Открыть точку на Яндекс Картах ↗</b></a> : null}
          {selectedOrder.deliveryType === "delivery" && (selectedOrder.apartment || selectedOrder.entrance || selectedOrder.floor || selectedOrder.intercom) ? <span className="wide"><small>Детали адреса</small><b>{[
            selectedOrder.apartment && `кв. ${selectedOrder.apartment}`,
            selectedOrder.entrance && `подъезд ${selectedOrder.entrance}`,
            selectedOrder.floor && `этаж ${selectedOrder.floor}`,
            selectedOrder.intercom && `домофон ${selectedOrder.intercom}`,
          ].filter(Boolean).join(" · ")}</b></span> : null}
        </div>

        <div className="admin-order-lines">
          {selectedOrder.items.map((item) => <article key={item.id}>
            <span className="admin-order-qty">{item.quantity}×</span>
            <span><b>{item.productName}</b>{item.modifierSnapshots.map((modifier) => {
              const contribution = modifier.totalPrice
                * (modifier.priceScope === "per-product" ? item.quantity : 1);
              const scopeLabel = modifier.priceScope === "per-line"
                ? "за строку"
                : `за ${item.quantity} шт.`;
              return <small key={`${modifier.groupId}:${modifier.itemId}`}>
                {modifier.groupTitle}: {modifier.itemName}
                {modifier.quantity > 1 ? ` ×${modifier.quantity}` : ""}
                {contribution ? ` (+${contribution} сом ${scopeLabel})` : ""}
              </small>;
            })}</span>
            <strong>{item.lineTotal} сом</strong>
          </article>)}
        </div>

        <div className="admin-order-notes">
          <span><small>Оплата</small><b>{selectedOrder.paymentMethod === "card" ? "Картой при получении" : selectedOrder.paymentMethod === "online" ? "Онлайн" : "Наличными"}</b></span>
          <span><small>Приборы</small><b>{selectedOrder.noUtensils ? "Не нужны" : `${selectedOrder.utensilsCount} компл.`}</b></span>
          {selectedOrder.comment ? <span className="wide"><small>Комментарий</small><b>{selectedOrder.comment}</b></span> : null}
        </div>

        {orderStatusTransitions[selectedOrder.status].length ? <div className="admin-order-actions">
          {orderStatusTransitions[selectedOrder.status].map((status) => <button
            type="button"
            className={status === "cancelled" ? "cancel" : ""}
            disabled={ordersLoading}
            key={status}
            onClick={() => void updateOrderStatus(selectedOrder, status)}
          >{status === "cancelled" ? "Отменить" : `→ ${orderStatusLabels[status]}`}</button>)}
        </div> : null}
      </section>
    </div> : null}
  </main>;
}

function ModifierGroupsEditor({ value, onChange }: { value: ModifierGroup[]; onChange: (groups: ModifierGroup[]) => void }) {
  const updateGroup = (index: number, patch: Partial<ModifierGroup>) =>
    onChange(value.map((group, groupIndex) => groupIndex === index ? { ...group, ...patch } : group));
  const removeGroup = (index: number) => onChange(value.filter((_, groupIndex) => groupIndex !== index));
  const addGroup = () => onChange([...value, {
    id: `group-${Date.now()}`,
    title: "Новая группа",
    selectionType: "single",
    presentation: "rows",
    required: false,
    minSelections: 0,
    maxSelections: 1,
    priceScope: "per-line",
    items: [],
  }]);
  const updateItem = (groupIndex: number, itemIndex: number, patch: Partial<ModifierItem>) => {
    const group = value[groupIndex];
    updateGroup(groupIndex, {
      items: group.items.map((item, currentIndex) => currentIndex === itemIndex ? { ...item, ...patch } : item),
    });
  };
  const addItem = (groupIndex: number) => {
    const group = value[groupIndex];
    updateGroup(groupIndex, {
      items: [...group.items, {
        id: `option-${Date.now()}`,
        name: "Новый вариант",
        price: 0,
        image: "",
        enabled: true,
        maxQuantity: group.selectionType === "single" ? 1 : 20,
      }],
    });
  };
  const removeItem = (groupIndex: number, itemIndex: number) => {
    const group = value[groupIndex];
    updateGroup(groupIndex, { items: group.items.filter((_, currentIndex) => currentIndex !== itemIndex) });
  };

  return <section className="admin-modifiers">
    <div className="admin-modifiers-head">
      <span><b>Группы выбора и добавки</b><small>Название и назначение могут быть любыми</small></span>
      <button type="button" onClick={addGroup}>+ Группа</button>
    </div>
    {value.map((group, groupIndex) => <article className="admin-modifier-group" key={group.id}>
      <div className="admin-modifier-title">
        <input aria-label="Название группы" value={group.title} onChange={(event) => updateGroup(groupIndex, { title: event.target.value })} />
        <button type="button" onClick={() => removeGroup(groupIndex)} aria-label={`Удалить группу ${group.title}`}>×</button>
      </div>
      <div className="admin-modifier-rules">
        <label>Режим<select value={group.selectionType} onChange={(event) => {
          const selectionType = event.target.value as ModifierGroup["selectionType"];
          updateGroup(groupIndex, {
            selectionType,
            minSelections: selectionType === "single"
              ? Math.min(1, group.minSelections ?? (group.required ? 1 : 0))
              : group.minSelections,
            maxSelections: selectionType === "single" ? 1 : Math.max(1, group.maxSelections || 1),
            items: selectionType === "single"
              ? group.items.map((item) => ({ ...item, maxQuantity: 1 }))
              : group.items,
          });
        }}><option value="single">Один вариант</option><option value="multiple">Несколько вариантов</option></select></label>
        <label>Вид<select value={group.presentation || "rows"} onChange={(event) => updateGroup(groupIndex, { presentation: event.target.value as NonNullable<ModifierGroup["presentation"]> })}><option value="rows">Строки</option><option value="cards">Карточки</option></select></label>
        <label>Минимум<input type="number" min="0" max={group.selectionType === "single" ? 1 : 99} value={group.minSelections ?? (group.required ? 1 : 0)} onChange={(event) => {
          const minSelections = Number(event.target.value);
          updateGroup(groupIndex, { minSelections, required: minSelections > 0 });
        }} /></label>
        <label>Максимум<input type="number" min="0" max="99" disabled={group.selectionType === "single"} value={group.selectionType === "single" ? 1 : group.maxSelections ?? group.items.length} onChange={(event) => updateGroup(groupIndex, { maxSelections: Number(event.target.value) })} /></label>
        <label>Цена применяется<select value={group.priceScope || "per-product"} onChange={(event) => updateGroup(groupIndex, { priceScope: event.target.value as NonNullable<ModifierGroup["priceScope"]> })}><option value="per-product">К каждой порции</option><option value="per-line">Один раз в строке</option></select></label>
        <label className="admin-required"><span>Обязательно</span><input type="checkbox" checked={group.required} onChange={(event) => {
          const required = event.target.checked;
          updateGroup(groupIndex, {
            required,
            minSelections: required ? Math.max(1, group.minSelections || 0) : 0,
          });
        }} /></label>
      </div>
      <div className="admin-modifier-items">
        {group.items.map((item, itemIndex) => <div className="admin-modifier-item" key={item.id}>
          {item.image ? <img src={item.image} alt="" /> : <span className="admin-modifier-placeholder">Фото</span>}
          <div>
            <input aria-label="Название варианта" value={item.name} onChange={(event) => updateItem(groupIndex, itemIndex, { name: event.target.value })} />
            <input aria-label="Ссылка на фото варианта" value={item.image} onChange={(event) => updateItem(groupIndex, itemIndex, { image: event.target.value })} placeholder="Ссылка на фото" />
          </div>
          <label>Цена<input type="number" min="0" value={item.price} onChange={(event) => updateItem(groupIndex, itemIndex, { price: Number(event.target.value) })} /></label>
          <label>Макс. шт.<input type="number" min="1" max="99" disabled={group.selectionType === "single"} value={item.maxQuantity ?? (group.selectionType === "single" ? 1 : 20)} onChange={(event) => updateItem(groupIndex, itemIndex, { maxQuantity: Number(event.target.value) })} /></label>
          <label className="admin-modifier-enabled"><span>Доступен</span><input type="checkbox" checked={item.enabled !== false} onChange={(event) => updateItem(groupIndex, itemIndex, { enabled: event.target.checked })} /></label>
          <button type="button" onClick={() => removeItem(groupIndex, itemIndex)} aria-label={`Удалить ${item.name}`}>×</button>
        </div>)}
      </div>
      <button className="admin-add-option" type="button" onClick={() => addItem(groupIndex)}>+ Добавить вариант</button>
    </article>)}
  </section>;
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
