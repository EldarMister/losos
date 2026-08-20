"use client";

import { Icon } from "@mdi/react";
import { mdiClose, mdiMagnify, mdiPlus, mdiRefresh } from "@mdi/js";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ImageUpload } from "./ImageUpload";
import type {
  AdminRequest,
  Analytics,
  Category,
  CoinWithdrawal,
  CoinWithdrawalStatus,
  Customer,
  Dashboard,
  Product,
  Promotion,
  Region,
} from "./admin-types";

type ViewProps = {
  region: string;
  request: AdminRequest;
  onNotice: (message: string, tone?: "success" | "error") => void;
};

const inputClass = "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-100";
const labelClass = "grid gap-1.5 text-sm font-medium text-slate-700";
const primaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60";
const secondaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60";

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU")} сом`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
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

function LoadingBlock() {
  return <div className="grid min-h-56 place-items-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500" role="status">Загружаем данные…</div>;
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700" role="alert">
      <strong className="block">Не удалось загрузить данные</strong>
      <span className="mt-1 block">{message}</span>
      <button type="button" className="mt-3 font-semibold underline" onClick={onRetry}>Повторить загрузку</button>
    </div>
  );
}

function EmptyBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-52 place-items-center px-6 py-10 text-center">
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-0 sm:p-5" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="flex min-h-dvh w-full flex-col bg-white shadow-2xl sm:min-h-0 sm:max-w-xl sm:rounded-xl" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-950">{title}</h2>
          <button type="button" aria-label="Закрыть окно" className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" onClick={onClose}>
            <Icon path={mdiClose} size={0.78} aria-hidden="true" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function SectionToolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">{children}</div>;
}

function useInitialLoad(load: () => void | Promise<void>) {
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
}

export function AnalyticsView({ region, request }: ViewProps) {
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await request<Analytics>(`/admin/analytics?region=${encodeURIComponent(region)}&period=${period}`));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить аналитику");
    } finally {
      setLoading(false);
    }
  }, [period, region, request]);

  useInitialLoad(load);

  if (loading && !data) return <LoadingBlock />;
  if (error && !data) return <ErrorBlock message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-4">
      <SectionToolbar>
        <div>
          <strong className="block text-sm font-semibold text-slate-950">Период отчёта</strong>
          <span className="mt-1 block text-xs text-slate-500">Только три основных показателя без сложных графиков</span>
        </div>
        <div className="flex gap-2 overflow-x-auto" aria-label="Период аналитики">
          {([
            ["today", "Сегодня"], ["week", "7 дней"], ["month", "30 дней"],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={period === value} className={`min-h-10 shrink-0 rounded-lg px-3 text-sm font-medium ${period === value ? "bg-slate-950 text-white" : "border border-slate-300 bg-white text-slate-700"}`} onClick={() => setPeriod(value)}>
              {label}
            </button>
          ))}
        </div>
      </SectionToolbar>

      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          ["Заказы", data?.orders ?? 0, "шт."],
          ["Выручка", formatMoney(data?.revenue ?? 0), ""],
          ["Средний чек", formatMoney(data?.average ?? 0), ""],
        ].map(([label, value, suffix]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5">
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value} {suffix}</dd>
          </div>
        ))}
      </dl>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <header className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-950">Популярные блюда</h2></header>
        {data?.products.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Блюдо</th><th className="px-5 py-3">Продано</th><th className="px-5 py-3 text-right">Выручка</th></tr></thead>
              <tbody className="divide-y divide-slate-200">{data.products.slice(0, 5).map((product) => <tr key={product.name}><td className="px-5 py-4 font-medium text-slate-900">{product.name}</td><td className="px-5 py-4 text-slate-600">{product.count} шт.</td><td className="px-5 py-4 text-right font-semibold text-slate-900">{formatMoney(product.revenue)}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <EmptyBlock title="Продаж пока нет" description="Здесь появятся пять самых популярных блюд." />}
      </section>
    </div>
  );
}

type ProductEditor = { product?: Product; categoryId: string; name: string; slug: string; price: string; image: string; description: string; available: boolean };

export function MenuView({ region, request, onNotice }: ViewProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<ProductEditor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setDashboard(await request<Dashboard>(`/admin/dashboard?region=${encodeURIComponent(region)}`)); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить меню"); }
    finally { setLoading(false); }
  }, [region, request]);

  useInitialLoad(load);

  const rows = useMemo(() => (dashboard?.categories ?? []).flatMap((category) => category.products.map((product) => ({ product, category }))).filter(({ product }) => product.name.toLowerCase().includes(search.toLowerCase())), [dashboard, search]);

  const openCreate = () => setEditor({ categoryId: String(dashboard?.categories[0]?.id ?? ""), name: "", slug: "", price: "", image: "", description: "", available: true });
  const openEdit = (product: Product, category: Category) => setEditor({ product, categoryId: String(category.id), name: product.name, slug: product.slug, price: String(product.price), image: product.image, description: product.description || "", available: product.available });

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!editor || saving) return;
    setSaving(true);
    try {
      const common = { categoryId: Number(editor.categoryId), name: editor.name.trim(), slug: editor.slug.trim() || slugify(editor.name), price: Number(editor.price), image: editor.image.trim(), description: editor.description.trim(), available: editor.available };
      if (editor.product) await request(`/admin/products/${editor.product.id}`, { method: "PATCH", body: JSON.stringify(common) });
      else await request("/admin/products", { method: "POST", body: JSON.stringify({ ...common, regionSlug: dashboard?.menuRegionSlug || region, naktaCoins: 0, oldPrice: null, composition: "", isNew: false, modifierGroups: [], sortOrder: rows.length, weight: 0, calories: 0, protein: 0, fat: 0, carbs: 0 }) });
      onNotice(editor.product ? "Изменения блюда сохранены" : "Блюдо добавлено", "success");
      setEditor(null); await load();
    } catch (saveError) { onNotice(saveError instanceof Error ? saveError.message : "Не удалось сохранить блюдо", "error"); }
    finally { setSaving(false); }
  };

  const toggleProduct = async (product: Product) => {
    try { await request(`/admin/products/${product.id}`, { method: "PATCH", body: JSON.stringify({ available: !product.available }) }); onNotice(product.available ? "Блюдо скрыто из меню" : "Блюдо доступно для заказа", "success"); await load(); }
    catch (toggleError) { onNotice(toggleError instanceof Error ? toggleError.message : "Не удалось изменить доступность", "error"); }
  };

  if (loading && !dashboard) return <LoadingBlock />;
  if (error && !dashboard) return <ErrorBlock message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-4">
      <SectionToolbar>
        <label className="relative min-w-0 flex-1 sm:max-w-md"><span className="sr-only">Найти блюдо</span><Icon path={mdiMagnify} size={0.75} aria-hidden="true" className="absolute left-3 top-3 text-slate-400" /><input type="search" className={`${inputClass} pl-10`} placeholder="Найти блюдо" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <button type="button" className={primaryButton} onClick={openCreate}><Icon path={mdiPlus} size={0.75} aria-hidden="true" />Добавить блюдо</button>
      </SectionToolbar>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {rows.length ? <>
          <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Блюдо</th><th className="px-5 py-3">Категория</th><th className="px-5 py-3">Цена</th><th className="px-5 py-3">Доступность</th><th className="px-5 py-3 text-right">Действия</th></tr></thead><tbody className="divide-y divide-slate-200">{rows.map(({ product, category }) => <tr key={product.id}><td className="px-5 py-4 font-medium text-slate-950">{product.name}</td><td className="px-5 py-4 text-slate-600">{category.title}</td><td className="px-5 py-4 font-semibold text-slate-900">{formatMoney(product.price)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${product.available ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{product.available ? "Доступно" : "Скрыто"}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" className={secondaryButton} onClick={() => void toggleProduct(product)}>{product.available ? "Скрыть" : "Показать"}</button><button type="button" className={secondaryButton} onClick={() => openEdit(product, category)}>Редактировать</button></div></td></tr>)}</tbody></table></div>
          <div className="divide-y divide-slate-200 md:hidden">{rows.map(({ product, category }) => <article key={product.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><strong className="block text-slate-950">{product.name}</strong><span className="mt-1 block text-sm text-slate-500">{category.title}</span></div><strong className="shrink-0 text-sm text-slate-950">{formatMoney(product.price)}</strong></div><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" className={secondaryButton} onClick={() => void toggleProduct(product)}>{product.available ? "Скрыть блюдо" : "Показать блюдо"}</button><button type="button" className={secondaryButton} onClick={() => openEdit(product, category)}>Редактировать</button></div></article>)}</div>
        </> : <EmptyBlock title="Блюда не найдены" description="Добавьте первое блюдо или измените запрос поиска." />}
      </section>
      {editor ? <Modal title={editor.product ? "Редактировать блюдо" : "Добавить блюдо"} onClose={() => setEditor(null)}><form className="grid gap-4 overflow-y-auto p-5" onSubmit={saveProduct}><label className={labelClass}>Название<input required className={inputClass} value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value, slug: editor.product ? editor.slug : slugify(event.target.value) })} /></label><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Категория<select required className={inputClass} value={editor.categoryId} onChange={(event) => setEditor({ ...editor, categoryId: event.target.value })}>{dashboard?.categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</select></label><label className={labelClass}>Цена, сом<input required min="0" inputMode="numeric" type="number" className={inputClass} value={editor.price} onChange={(event) => setEditor({ ...editor, price: event.target.value })} /></label></div><label className={labelClass}>Адрес изображения<input required type="url" className={inputClass} placeholder="https://…" value={editor.image} onChange={(event) => setEditor({ ...editor, image: event.target.value })} /></label><label className={labelClass}>Описание<textarea className="min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100" value={editor.description} onChange={(event) => setEditor({ ...editor, description: event.target.value })} /></label><label className="flex items-center gap-3 text-sm font-medium text-slate-700"><input type="checkbox" className="size-4 accent-blue-600" checked={editor.available} onChange={(event) => setEditor({ ...editor, available: event.target.checked })} />Доступно для заказа</label><div className="grid gap-2 border-t border-slate-200 pt-4 sm:grid-cols-2"><button type="button" className={secondaryButton} onClick={() => setEditor(null)}>Отменить</button><button type="submit" className={primaryButton} disabled={saving}>{saving ? "Сохраняем…" : editor.product ? "Сохранить изменения" : "Добавить блюдо"}</button></div></form></Modal> : null}
    </div>
  );
}

type CategoryEditor = { category?: Category; title: string; slug: string; image: string; sortOrder: string };

export function CategoriesView({ region, request, onNotice }: ViewProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [editor, setEditor] = useState<CategoryEditor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { setDashboard(await request<Dashboard>(`/admin/dashboard?region=${encodeURIComponent(region)}`)); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить категории"); } finally { setLoading(false); } }, [region, request]);
  useInitialLoad(load);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!editor) return;
    if (!editor.image) {
      onNotice("Загрузите изображение категории", "error");
      return;
    }
    setSaving(true);
    try {
      const common = {
        title: editor.title.trim(),
        slug: editor.slug.trim() || slugify(editor.title),
        image: editor.image.trim(),
        sortOrder: Number(editor.sortOrder),
      };
      if (editor.category) {
        await request(`/admin/categories/${editor.category.id}`, {
          method: "PATCH",
          body: JSON.stringify(common),
        });
      } else {
        await request("/admin/categories", {
          method: "POST",
          body: JSON.stringify({
            ...common,
            regionSlug: dashboard?.menuRegionSlug || region,
          }),
        });
      }
      onNotice(editor.category ? "Категория обновлена" : "Категория добавлена", "success");
      setEditor(null);
      await load();
    } catch (saveError) {
      onNotice(saveError instanceof Error ? saveError.message : "Не удалось сохранить категорию", "error");
    } finally {
      setSaving(false);
    }
  };
  if (loading && !dashboard) return <LoadingBlock />;
  if (error && !dashboard) return <ErrorBlock message={error} onRetry={() => void load()} />;
  return (
    <div className="space-y-4">
      <SectionToolbar>
        <p className="text-sm text-slate-600">Категории показаны для выбранного города.</p>
        <button
          type="button"
          className={primaryButton}
          onClick={() => setEditor({
            title: "",
            slug: "",
            image: "",
            sortOrder: String(dashboard?.categories.length ?? 0),
          })}
        >
          <Icon path={mdiPlus} size={0.75} aria-hidden="true" />
          Добавить категорию
        </button>
      </SectionToolbar>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {dashboard?.categories.length ? (
          <div className="divide-y divide-slate-200">
            {dashboard.categories.map((category) => (
              <article key={category.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
                <div>
                  <strong className="block text-slate-950">{category.title}</strong>
                  <span className="mt-1 block text-sm text-slate-500">
                    {category.products.length} блюд · порядок {category.sortOrder + 1}
                  </span>
                </div>
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => setEditor({
                    category,
                    title: category.title,
                    slug: category.slug,
                    image: category.image,
                    sortOrder: String(category.sortOrder),
                  })}
                >
                  Редактировать категорию
                </button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyBlock title="Категорий пока нет" description="Создайте первую категорию для меню этого города." />
        )}
      </section>

      {editor ? (
        <Modal
          title={editor.category ? "Редактировать категорию" : "Добавить категорию"}
          onClose={() => setEditor(null)}
        >
          <form className="grid gap-5 overflow-y-auto p-5" onSubmit={save}>
            <label className={labelClass}>
              Название
              <input
                required
                className={inputClass}
                value={editor.title}
                onChange={(event) => setEditor({
                  ...editor,
                  title: event.target.value,
                  slug: editor.category ? editor.slug : slugify(event.target.value),
                })}
              />
            </label>

            <ImageUpload
              label="Изображение категории"
              value={editor.image}
              hint="Выберите фотографию с телефона или компьютера. Рекомендуемый размер — 1200×600 px."
              onChange={(image) => setEditor({ ...editor, image })}
              onError={(message) => onNotice(message, "error")}
            />

            <label className={labelClass}>
              Порядок
              <input
                required
                min="0"
                type="number"
                className={inputClass}
                value={editor.sortOrder}
                onChange={(event) => setEditor({ ...editor, sortOrder: event.target.value })}
              />
            </label>

            <details className="rounded-xl border border-slate-200 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                Дополнительные настройки
              </summary>
              <label className={`${labelClass} mt-4`}>
                Системное имя для ссылки
                <input
                  required
                  className={inputClass}
                  value={editor.slug}
                  onChange={(event) => setEditor({ ...editor, slug: slugify(event.target.value) })}
                />
                <small className="font-normal leading-5 text-slate-500">
                  Например, «Горячие роллы» станет «goryachie-rolly». Обычно менять это поле не нужно.
                </small>
              </label>
            </details>

            <div className="grid gap-2 border-t border-slate-200 pt-4 sm:grid-cols-2">
              <button type="button" className={secondaryButton} onClick={() => setEditor(null)}>
                Отменить
              </button>
              <button type="submit" className={primaryButton} disabled={saving}>
                {saving ? "Сохраняем…" : editor.category ? "Сохранить изменения" : "Добавить категорию"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

export function UsersView({ region, request }: ViewProps) {
  const [users, setUsers] = useState<Customer[]>([]);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const query = new URLSearchParams({ region, search, limit: "100", offset: "0" }); const result = await request<{ items: Customer[] }>(`/admin/customers?${query}`); setUsers(result.items); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить пользователей"); } finally { setLoading(false); } }, [region, request, search]);
  useInitialLoad(load);
  const submit = (event: FormEvent) => { event.preventDefault(); setSearch(searchDraft.trim()); };
  if (loading && !users.length) return <LoadingBlock />;
  if (error && !users.length) return <ErrorBlock message={error} onRetry={() => void load()} />;
  return <div className="space-y-4"><SectionToolbar><form className="flex min-w-0 flex-1 gap-2 sm:max-w-lg" onSubmit={submit}><label className="relative min-w-0 flex-1"><span className="sr-only">Найти пользователя</span><Icon path={mdiMagnify} size={0.75} aria-hidden="true" className="absolute left-3 top-3 text-slate-400" /><input type="search" className={`${inputClass} pl-10`} placeholder="Имя или телефон" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} /></label><button type="submit" className={primaryButton}>Найти пользователя</button></form><button type="button" className={secondaryButton} onClick={() => void load()}><Icon path={mdiRefresh} size={0.72} aria-hidden="true" />Обновить</button></SectionToolbar><section className="overflow-hidden rounded-xl border border-slate-200 bg-white">{users.length ? <><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Пользователь</th><th className="px-5 py-3">Заказы</th><th className="px-5 py-3">Завершено</th><th className="px-5 py-3">Потрачено</th><th className="px-5 py-3">Последний заказ</th></tr></thead><tbody className="divide-y divide-slate-200">{users.map((user) => <tr key={user.phone}><td className="px-5 py-4"><strong className="block text-slate-950">{user.customerName || "Без имени"}</strong><a href={`tel:${user.phone}`} className="mt-1 block text-xs text-blue-700">{user.phone}</a></td><td className="px-5 py-4 text-slate-700">{user.ordersCount}</td><td className="px-5 py-4 text-slate-700">{user.completedOrders}</td><td className="px-5 py-4 font-semibold text-slate-950">{formatMoney(user.revenue)}</td><td className="px-5 py-4 text-slate-500">{formatDate(user.lastOrderAt)}</td></tr>)}</tbody></table></div><div className="divide-y divide-slate-200 md:hidden">{users.map((user) => <article key={user.phone} className="p-4"><strong className="block text-slate-950">{user.customerName || "Без имени"}</strong><a href={`tel:${user.phone}`} className="mt-1 block text-sm text-blue-700">Позвонить: {user.phone}</a><dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm"><div><dt className="text-xs text-slate-500">Заказов</dt><dd className="mt-1 font-semibold text-slate-950">{user.ordersCount}</dd></div><div><dt className="text-xs text-slate-500">Потрачено</dt><dd className="mt-1 font-semibold text-slate-950">{formatMoney(user.revenue)}</dd></div></dl></article>)}</div></> : <EmptyBlock title="Пользователи не найдены" description="Измените запрос или дождитесь первого заказа." />}</section></div>;
}

const withdrawalLabels: Record<CoinWithdrawalStatus, string> = { pending: "Ожидает решения", submitted: "Перевод отправлен", withdrawn: "Завершён", failed: "Отклонён" };
const withdrawalStyles: Record<CoinWithdrawalStatus, string> = { pending: "bg-amber-50 text-amber-800", submitted: "bg-blue-50 text-blue-700", withdrawn: "bg-emerald-50 text-emerald-700", failed: "bg-red-50 text-red-700" };
type FinanceAction = { item: CoinWithdrawal; mode: "approve" | "reject"; value: string };

export function FinanceView({ region, request, onNotice }: ViewProps) {
  const [items, setItems] = useState<CoinWithdrawal[]>([]);
  const [filter, setFilter] = useState<"all" | CoinWithdrawalStatus>("pending");
  const [action, setAction] = useState<FinanceAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const query = new URLSearchParams({ region }); if (filter !== "all") query.set("status", filter); setItems(await request<CoinWithdrawal[]>(`/admin/coin-withdrawals?${query}`)); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить выводы"); } finally { setLoading(false); } }, [filter, region, request]);
  useInitialLoad(load);
  const submitAction = async (event: FormEvent) => { event.preventDefault(); if (!action) return; setSaving(true); try { await request(`/admin/coin-withdrawals/${action.item.id}`, { method: "PATCH", body: JSON.stringify(action.mode === "approve" ? { status: "submitted", txHash: action.value.trim() } : { status: "failed", error: action.value.trim() }) }); onNotice(action.mode === "approve" ? "Вывод одобрен и отмечен как отправленный" : "Вывод отклонён, средства возвращены", "success"); setAction(null); await load(); } catch (saveError) { onNotice(saveError instanceof Error ? saveError.message : "Не удалось обработать вывод", "error"); } finally { setSaving(false); } };
  const complete = async (item: CoinWithdrawal) => { try { await request(`/admin/coin-withdrawals/${item.id}`, { method: "PATCH", body: JSON.stringify({ status: "withdrawn", txHash: item.txHash }) }); onNotice("Вывод средств завершён", "success"); await load(); } catch (completeError) { onNotice(completeError instanceof Error ? completeError.message : "Не удалось завершить вывод", "error"); } };
  if (loading && !items.length) return <LoadingBlock />;
  if (error && !items.length) return <ErrorBlock message={error} onRetry={() => void load()} />;
  return <div className="space-y-4"><SectionToolbar><div className="flex gap-2 overflow-x-auto">{([['all','Все'],['pending','Ожидают'],['submitted','Отправлены'],['withdrawn','Завершены'],['failed','Отклонены']] as const).map(([value,label]) => <button key={value} type="button" aria-pressed={filter === value} className={`min-h-10 shrink-0 rounded-lg px-3 text-sm font-medium ${filter === value ? "bg-slate-950 text-white" : "border border-slate-300 text-slate-700"}`} onClick={() => setFilter(value)}>{label}</button>)}</div><button type="button" className={secondaryButton} onClick={() => void load()}><Icon path={mdiRefresh} size={0.72} aria-hidden="true" />Обновить</button></SectionToolbar><section className="overflow-hidden rounded-xl border border-slate-200 bg-white">{items.length ? <div className="divide-y divide-slate-200">{items.map((item) => <article key={item.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_1fr_auto] lg:items-center lg:px-5"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-slate-950">{formatMoney(item.amount)}</strong><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${withdrawalStyles[item.status]}`}>{withdrawalLabels[item.status]}</span></div><a href={`tel:${item.phone}`} className="mt-2 block text-sm text-blue-700">{item.phone}</a><span className="mt-1 block text-xs text-slate-500">Заявка от {formatDate(item.createdAt)}</span></div><div className="min-w-0"><small className="block text-xs text-slate-500">Кошелёк</small><code className="mt-1 block truncate text-sm text-slate-700">{item.walletAddress}</code>{item.txHash ? <code className="mt-1 block truncate text-xs text-slate-500">TX: {item.txHash}</code> : null}</div><div className="grid gap-2 sm:grid-cols-2 lg:flex">{item.status === "pending" ? <><button type="button" className={primaryButton} onClick={() => setAction({ item, mode: "approve", value: "" })}>Одобрить вывод</button><button type="button" className="min-h-11 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50" onClick={() => setAction({ item, mode: "reject", value: "" })}>Отклонить вывод</button></> : null}{item.status === "submitted" ? <button type="button" className={primaryButton} onClick={() => void complete(item)}>Подтвердить перевод</button> : null}</div></article>)}</div> : <EmptyBlock title="Заявок нет" description="Для выбранного статуса заявок на вывод средств нет." />}</section>{action ? <Modal title={action.mode === "approve" ? "Одобрить вывод" : "Отклонить вывод"} onClose={() => setAction(null)}><form className="grid gap-4 p-5" onSubmit={submitAction}><div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700"><strong className="block text-slate-950">{formatMoney(action.item.amount)}</strong><span className="mt-1 block">Пользователь: {action.item.phone}</span><code className="mt-2 block break-all text-xs">{action.item.walletAddress}</code></div><label className={labelClass}>{action.mode === "approve" ? "Хеш транзакции" : "Причина отказа"}<input required className={inputClass} value={action.value} onChange={(event) => setAction({ ...action, value: event.target.value })} placeholder={action.mode === "approve" ? "Введите хеш после отправки" : "Кратко укажите причину"} /></label><div className="grid gap-2 border-t border-slate-200 pt-4 sm:grid-cols-2"><button type="button" className={secondaryButton} onClick={() => setAction(null)}>Отменить</button><button type="submit" className={action.mode === "approve" ? primaryButton : "min-h-11 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"} disabled={saving}>{saving ? "Сохраняем…" : action.mode === "approve" ? "Одобрить вывод" : "Отклонить вывод"}</button></div></form></Modal> : null}</div>;
}

type PromotionEditor = { promotion?: Promotion; title: string; image: string; cta: string; ctaUrl: string; enabled: boolean };

export function PromotionsView({ region, request, onNotice }: ViewProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [editor, setEditor] = useState<PromotionEditor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { setDashboard(await request<Dashboard>(`/admin/dashboard?region=${encodeURIComponent(region)}`)); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить акции"); } finally { setLoading(false); } }, [region, request]);
  useInitialLoad(load);
  const save = async (event: FormEvent) => { event.preventDefault(); if (!editor) return; setSaving(true); try { const common = { title: editor.title.trim(), image: editor.image.trim(), cta: editor.cta.trim(), ctaUrl: editor.ctaUrl.trim(), enabled: editor.enabled }; if (editor.promotion) await request(`/admin/promotions/${editor.promotion.id}`, { method: "PATCH", body: JSON.stringify(common) }); else await request("/admin/promotions", { method: "POST", body: JSON.stringify({ ...common, regionSlug: dashboard?.promotionRegionSlug || region, sortOrder: dashboard?.promotions.length ?? 0 }) }); onNotice(editor.promotion ? "Акция обновлена" : "Акция добавлена", "success"); setEditor(null); await load(); } catch (saveError) { onNotice(saveError instanceof Error ? saveError.message : "Не удалось сохранить акцию", "error"); } finally { setSaving(false); } };
  const toggle = async (item: Promotion) => { try { await request(`/admin/promotions/${item.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !item.enabled }) }); onNotice(item.enabled ? "Акция выключена" : "Акция включена", "success"); await load(); } catch (toggleError) { onNotice(toggleError instanceof Error ? toggleError.message : "Не удалось изменить акцию", "error"); } };
  if (loading && !dashboard) return <LoadingBlock />;
  if (error && !dashboard) return <ErrorBlock message={error} onRetry={() => void load()} />;
  return <div className="space-y-4"><SectionToolbar><p className="text-sm text-slate-600">Показывайте клиентам только актуальные предложения.</p><button type="button" className={primaryButton} onClick={() => setEditor({ title: "", image: "", cta: "Подробнее", ctaUrl: "", enabled: true })}><Icon path={mdiPlus} size={0.75} aria-hidden="true" />Добавить акцию</button></SectionToolbar><section className="overflow-hidden rounded-xl border border-slate-200 bg-white">{dashboard?.promotions.length ? <div className="divide-y divide-slate-200">{dashboard.promotions.map((item) => <article key={item.id} className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-slate-950">{item.title}</strong><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.enabled ? "Активна" : "Выключена"}</span></div><span className="mt-2 block text-sm text-slate-500">{item.cta || "Без кнопки"}</span></div><div className="grid grid-cols-2 gap-2"><button type="button" className={secondaryButton} onClick={() => void toggle(item)}>{item.enabled ? "Выключить" : "Включить"}</button><button type="button" className={secondaryButton} onClick={() => setEditor({ promotion: item, title: item.title, image: item.image, cta: item.cta || "", ctaUrl: item.ctaUrl || "", enabled: item.enabled })}>Редактировать</button></div></article>)}</div> : <EmptyBlock title="Акций пока нет" description="Создайте первое предложение для выбранного города." />}</section>{editor ? <Modal title={editor.promotion ? "Редактировать акцию" : "Добавить акцию"} onClose={() => setEditor(null)}><form className="grid gap-4 p-5" onSubmit={save}><label className={labelClass}>Название<input required className={inputClass} value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })} /></label><label className={labelClass}>Адрес изображения<input required type="url" className={inputClass} value={editor.image} onChange={(event) => setEditor({ ...editor, image: event.target.value })} /></label><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Текст кнопки<input className={inputClass} value={editor.cta} onChange={(event) => setEditor({ ...editor, cta: event.target.value })} /></label><label className={labelClass}>Ссылка<input type="url" className={inputClass} placeholder="https://…" value={editor.ctaUrl} onChange={(event) => setEditor({ ...editor, ctaUrl: event.target.value })} /></label></div><label className="flex items-center gap-3 text-sm font-medium text-slate-700"><input type="checkbox" className="size-4 accent-blue-600" checked={editor.enabled} onChange={(event) => setEditor({ ...editor, enabled: event.target.checked })} />Акция включена</label><div className="grid gap-2 border-t border-slate-200 pt-4 sm:grid-cols-2"><button type="button" className={secondaryButton} onClick={() => setEditor(null)}>Отменить</button><button type="submit" className={primaryButton} disabled={saving}>{saving ? "Сохраняем…" : editor.promotion ? "Сохранить изменения" : "Добавить акцию"}</button></div></form></Modal> : null}</div>;
}

type SettingsDraft = { enabled: boolean; contactPhone: string; supportPhone: string; deliveryOpenTime: string; deliveryCloseTime: string; deliveryFee: string; minimumOrderAmount: string; estimatedDeliveryMinutes: string };

export function SettingsView({ region, request, onNotice }: ViewProps) {
  const [item, setItem] = useState<Region | null>(null);
  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const regions = await request<Region[]>("/admin/settings"); const selected = regions.find((candidate) => candidate.slug === region) ?? regions[0] ?? null; setItem(selected); setDraft(selected ? { enabled: selected.enabled, contactPhone: selected.contactPhone || "", supportPhone: selected.supportPhone || "", deliveryOpenTime: selected.deliveryOpenTime, deliveryCloseTime: selected.deliveryCloseTime, deliveryFee: String(selected.deliveryFee), minimumOrderAmount: String(selected.minimumOrderAmount), estimatedDeliveryMinutes: String(selected.estimatedDeliveryMinutes) } : null); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить настройки"); } finally { setLoading(false); } }, [region, request]);
  useInitialLoad(load);
  const save = async (event: FormEvent) => { event.preventDefault(); if (!item || !draft) return; setSaving(true); try { await request(`/admin/regions/${item.id}`, { method: "PATCH", body: JSON.stringify({ ...draft, deliveryFee: Number(draft.deliveryFee), minimumOrderAmount: Number(draft.minimumOrderAmount), estimatedDeliveryMinutes: Number(draft.estimatedDeliveryMinutes) }) }); onNotice("Настройки сохранены", "success"); await load(); } catch (saveError) { onNotice(saveError instanceof Error ? saveError.message : "Не удалось сохранить настройки", "error"); } finally { setSaving(false); } };
  if (loading && !draft) return <LoadingBlock />;
  if (error && !draft) return <ErrorBlock message={error} onRetry={() => void load()} />;
  if (!item || !draft) return <EmptyBlock title="Город не найден" description="Добавьте город через серверную конфигурацию." />;
  return <form className="space-y-4" onSubmit={save}><section className="rounded-xl border border-slate-200 bg-white p-5"><div className="border-b border-slate-200 pb-4"><h2 className="font-semibold text-slate-950">Работа кухни</h2><p className="mt-1 text-sm text-slate-500">Базовые параметры для города {item.name}</p></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className={labelClass}>Начало работы<input required type="time" className={inputClass} value={draft.deliveryOpenTime} onChange={(event) => setDraft({ ...draft, deliveryOpenTime: event.target.value })} /></label><label className={labelClass}>Окончание работы<input required type="time" className={inputClass} value={draft.deliveryCloseTime} onChange={(event) => setDraft({ ...draft, deliveryCloseTime: event.target.value })} /></label><label className={labelClass}>Минимальная сумма заказа<input required min="0" type="number" className={inputClass} value={draft.minimumOrderAmount} onChange={(event) => setDraft({ ...draft, minimumOrderAmount: event.target.value })} /></label><label className={labelClass}>Стоимость доставки<input required min="0" type="number" className={inputClass} value={draft.deliveryFee} onChange={(event) => setDraft({ ...draft, deliveryFee: event.target.value })} /></label><label className={labelClass}>Время доставки, минут<input required min="1" type="number" className={inputClass} value={draft.estimatedDeliveryMinutes} onChange={(event) => setDraft({ ...draft, estimatedDeliveryMinutes: event.target.value })} /></label><label className="flex items-center gap-3 self-end rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"><input type="checkbox" className="size-4 accent-blue-600" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} />Принимать заказы в этом городе</label></div></section><section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="border-b border-slate-200 pb-4 font-semibold text-slate-950">Контакты</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className={labelClass}>Телефон кухни<input className={inputClass} placeholder="+996…" value={draft.contactPhone} onChange={(event) => setDraft({ ...draft, contactPhone: event.target.value })} /></label><label className={labelClass}>Телефон поддержки<input className={inputClass} placeholder="+996…" value={draft.supportPhone} onChange={(event) => setDraft({ ...draft, supportPhone: event.target.value })} /></label></div></section><div className="flex justify-end"><button type="submit" className={`${primaryButton} w-full sm:w-auto`} disabled={saving}>{saving ? "Сохраняем…" : "Сохранить настройки"}</button></div></form>;
}
