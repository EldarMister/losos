"use client";
/* eslint-disable @next/next/no-img-element */

import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

import { Icon } from "@mdi/react";
import {
  mdiCheckNetworkOutline,
  mdiDeleteOutline,
  mdiDownloadOutline,
  mdiPlus,
  mdiRefresh,
  mdiSwapHorizontal,
} from "@mdi/js";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { EditorDialog, ListPagination, WorkspaceHeading } from "./workspace-kit";
import { useDraftEditor, useUnsavedChanges, confirmAdminNavigation } from "./use-unsaved-changes";
import { useAdminAccess } from "./admin-access";
import { DeliveryZoneEditor } from "./DeliveryZoneEditor";
import { ImageUpload } from "./ImageUpload";
import { CitiesWorkspace } from "./CitiesWorkspace";
import { fallbackFreeKitItems } from "./kit-catalog";
import type {
  AdminRequest,
  DeliveryZonePoint,
  PickupLocation,
  Region,
  Category,
  Dashboard,
  FreeKitItem,
} from "./admin-types";

type SettingsWorkspaceProps = {
  region: string;
  initialTab?: SettingsTab;
  regions: Region[];
  request: AdminRequest;
  onRegionUpdated: (region: Region) => void;
  onSelectRegion: (regionSlug: string) => void;
  onNotice: (message: string, tone?: "success" | "error") => void;
};

export type SettingsTab = "basic" | "cities" | "delivery" | "hours" | "pickup" | "kit" | "edu-pos";

type SettingsDraft = {
  enabled: boolean;
  contactPhone: string;
  supportPhone: string;
  deliveryOpenTime: string;
  deliveryCloseTime: string;
  deliveryIs24Hours: boolean;
  deliveryWorkingDays: number[];
  freeDeliveryThreshold: string;
  deliveryFee: string;
  minimumOrderAmount: string;
  maximumOrderAmount: string;
  estimatedDeliveryMinutes: string;
  deliveryZone: DeliveryZonePoint[];
  freeKitItems: FreeKitItem[];
  toppingProductIds: number[];
};

type PickupEditor = {
  item?: PickupLocation;
  title: string;
  address: string;
  workingHours: string;
  latitude: string;
  longitude: string;
  yandexUrl: string;
  enabled: boolean;
  sortOrder: string;
};

type EduPosStatus = {
  configured: boolean;
  lastMenuSyncAt: string | null;
  lastStopListSyncAt: string | null;
  lastError: string | null;
  intervals: { menuSeconds: number; stopListSeconds: number; ordersSeconds: number };
};

type EduPosCheck = {
  connected: boolean;
  dishes: number;
  checkedAt: string;
};

type EduPosMenuSync = {
  configured: boolean;
  matched?: number;
  received?: number;
  unavailable?: number;
};

type EduPosExport = {
  categories: number;
  products: number;
};

const inputClass = "h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-3 focus:ring-ring/20";
const labelClass = "grid gap-1.5 text-sm font-medium text-foreground";
const primaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60";
const secondaryButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-input bg-card px-4 text-sm font-medium text-foreground hover:bg-muted/50 disabled:cursor-wait disabled:opacity-60";

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: "basic", label: "Основное" },
  { id: "cities", label: "Города" },
  { id: "delivery", label: "Доставка" },
  { id: "hours", label: "Часы работы" },
  { id: "pickup", label: "Самовывоз" },
  { id: "kit", label: "Комплектация" },
  { id: "edu-pos", label: "EDU POS" },
];

const toppingCategoryPattern = /топпинг|соус|добав|васаби|имбир/i;

function legacyToppingIds(categories: Category[]) {
  return categories
    .filter((category) => toppingCategoryPattern.test(`${category.title} ${category.slug}`))
    .flatMap((category) => category.products.map((product) => product.id));
}

const weekdays = [
  { value: 1, label: "Пн" }, { value: 2, label: "Вт" }, { value: 3, label: "Ср" },
  { value: 4, label: "Чт" }, { value: 5, label: "Пт" }, { value: 6, label: "Сб" },
  { value: 0, label: "Вс" },
];

function draftFromRegion(item: Region, categories: Category[]): SettingsDraft {
  return {
    enabled: item.enabled,
    contactPhone: item.contactPhone || "",
    supportPhone: item.supportPhone || "",
    deliveryOpenTime: item.deliveryOpenTime || "11:30",
    deliveryCloseTime: item.deliveryCloseTime || "22:30",
    deliveryIs24Hours: Boolean(item.deliveryIs24Hours),
    deliveryWorkingDays: item.deliveryWorkingDays || [0, 1, 2, 3, 4, 5, 6],
    freeDeliveryThreshold: String(item.freeDeliveryThreshold ?? 0),
    deliveryFee: String(item.deliveryFee ?? 0),
    minimumOrderAmount: String(item.minimumOrderAmount ?? 0),
    maximumOrderAmount: String(item.maximumOrderAmount ?? 0),
    estimatedDeliveryMinutes: String(item.estimatedDeliveryMinutes ?? 50),
    deliveryZone: item.deliveryZone || [],
    freeKitItems: (item.freeKitItems ?? fallbackFreeKitItems).map((kitItem) => ({ ...kitItem })),
    toppingProductIds: [...(item.toppingProductIds ?? legacyToppingIds(categories))],
  };
}

function emptyPickup(sortOrder: number): PickupEditor {
  return {
    title: "",
    address: "",
    workingHours: "",
    latitude: "",
    longitude: "",
    yandexUrl: "",
    enabled: true,
    sortOrder: String(sortOrder),
  };
}

function pickupDraft(item: PickupLocation): PickupEditor {
  return {
    item,
    title: item.title || "",
    address: item.address,
    workingHours: item.workingHours || "",
    latitude: item.latitude == null ? "" : String(item.latitude),
    longitude: item.longitude == null ? "" : String(item.longitude),
    yandexUrl: item.yandexUrl || "",
    enabled: item.enabled,
    sortOrder: String(item.sortOrder),
  };
}

function formatDate(value: string | null) {
  if (!value) return "Ещё не выполнялась";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

export function SettingsWorkspace({ region, regions, request, onRegionUpdated, onSelectRegion, onNotice, initialTab = "basic" }: SettingsWorkspaceProps) {
  const { can } = useAdminAccess();
  const tabPermissions: Record<SettingsTab, string> = { basic:"cities",cities:"cities",delivery:"settings",hours:"hours",pickup:"cities",kit:"kits","edu-pos":"integrations" };
  const [requestedTab, setTab] = useState<SettingsTab>(initialTab);
  const tab = can(`${tabPermissions[requestedTab]}.view`) ? requestedTab : tabs.find((entry) => can(`${tabPermissions[entry.id]}.view`))?.id ?? initialTab;
  const canEditTab = can(`${tabPermissions[tab]}.edit`);
  const [savedDraft, setSavedDraft] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(0);
  const [productTotal, setProductTotal] = useState(0);
  const canViewKits = can("kits.view");
  const canViewIntegrations = can("integrations.view");
  const canSyncMenu = ["integrations.edit", "products.edit", "categories.edit", "modifiers.edit"].every(can);
  const canExportMenu = ["integrations.export", "products.view", "categories.view", "modifiers.view"].every(can);
  const [item, setItem] = useState<Region | null>(null);
  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuRegionSlug, setMenuRegionSlug] = useState(region);
  const [kitCatalog, setKitCatalog] = useState<FreeKitItem[]>([]);
  const [pickupEditor, setPickupEditor, closePickupEditor] = useDraftEditor<PickupEditor>();
  const [eduPosStatus, setEduPosStatus] = useState<EduPosStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [posAction, setPosAction] = useState<"check" | "sync" | "export" | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [regionItems, status, catalog] = await Promise.all([
        request<Region[]>("/admin/settings"),
        canViewIntegrations ? request<EduPosStatus>("/admin/edu-pos/status").catch(() => null) : Promise.resolve(null),
        canViewKits ? request<{items:(Dashboard["categories"][number]["products"][number] & {categoryId:number})[];categories:Category[];total:number;menuRegionSlug:string;kitCatalog:FreeKitItem[];effectiveToppingProductIds:number[]}>(`/admin/catalog-page?${new URLSearchParams({region,limit:"25",offset:"0"})}`) : Promise.resolve(null),
      ]);
      const selected = regionItems.find((candidate) => candidate.slug === region) ?? regionItems[0] ?? null;
      const nextCategories = catalog?.categories.map((category) => ({...category,products:catalog.items.filter((product) => product.categoryId === category.id)})) ?? [];
      setItem(selected);
      setCategories(nextCategories);
      setMenuRegionSlug(catalog?.menuRegionSlug ?? region);
      setKitCatalog(catalog?.kitCatalog ?? []);
      setProductTotal(catalog?.total ?? 0);
      const nextDraft = selected ? draftFromRegion(selected, nextCategories) : null;
      if (nextDraft && catalog?.effectiveToppingProductIds && selected?.toppingProductIds == null) nextDraft.toppingProductIds = catalog.effectiveToppingProductIds;
      setDraft(nextDraft);
      setSavedDraft(JSON.stringify(nextDraft));
      setEduPosStatus(status);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить настройки");
    } finally {
      setLoading(false);
    }
  }, [region, request, canViewKits, canViewIntegrations]);

  const settingsDirty = draft !== null && savedDraft !== JSON.stringify(draft);
  useUnsavedChanges(settingsDirty);
  const changeTab = (next: SettingsTab) => {
    if (next === tab || saving || posAction) return;
    if (!confirmAdminNavigation()) return;
    if (settingsDirty && savedDraft) setDraft(JSON.parse(savedDraft) as SettingsDraft);
    setTab(next);
  };
  useEffect(() => {
    if (!canViewKits || tab !== "kit") return;
    let active = true;
    const timer = window.setTimeout(() => {
      void request<{items:(Dashboard["categories"][number]["products"][number] & {categoryId:number})[];categories:Category[];total:number}>(`/admin/catalog-page?${new URLSearchParams({region,search:productSearch,limit:"25",offset:String(productPage * 25)})}`).then((catalog) => {
        if (!active) return;
        setCategories(catalog.categories.map((category) => ({...category,products:catalog.items.filter((product) => product.categoryId === category.id)})));
        setProductTotal(catalog.total);
      }).catch((error: unknown) => { if (active) onNotice(error instanceof Error ? error.message : "Не удалось загрузить товары", "error"); });
    }, 200);
    return () => {active = false;window.clearTimeout(timer);};
  }, [canViewKits, tab, region, productSearch, productPage, request, onNotice]);

  const usesSharedKitCatalog = menuRegionSlug !== region;
  const menuRegionName = regions.find((candidate) => candidate.slug === menuRegionSlug)?.name ?? "общего каталога";

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const refresh = () => void load();
    window.addEventListener("admin:regions-changed", refresh);
    return () => { window.clearTimeout(timer); window.removeEventListener("admin:regions-changed", refresh); };
  }, [load]);

  const handleRegionUpdated = (updated: Region) => {
    onRegionUpdated(updated);
    if (item?.id === updated.id) {
      setItem((current) => current ? { ...current, ...updated } : current);
      setDraft((current) => current ? { ...current, enabled: updated.enabled } : current);
      setSavedDraft((current) => current ? JSON.stringify({ ...JSON.parse(current), enabled: updated.enabled }) : current);
    }
  };

  const saveRegion = async (event: FormEvent) => {
    event.preventDefault();
    if (!item || !draft || saving || !canEditTab) return;
    if (tab === "delivery" && draft.deliveryZone.length > 0 && draft.deliveryZone.length < 3) {
      onNotice("Для зоны доставки нужно минимум три точки", "error");
      return;
    }
    setSaving(true);
    try {
      const updated = await request<Region>(`/admin/regions/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify(tab === "basic" ? {
          enabled:draft.enabled,contactPhone:draft.contactPhone.trim(),supportPhone:draft.supportPhone.trim(),
        } : tab === "hours" ? {
          deliveryOpenTime:draft.deliveryOpenTime,deliveryCloseTime:draft.deliveryCloseTime,deliveryIs24Hours:draft.deliveryIs24Hours,deliveryWorkingDays:draft.deliveryWorkingDays,
        } : tab === "kit" ? {
          ...(usesSharedKitCatalog ? {} : {freeKitItems:draft.freeKitItems}),toppingProductIds:draft.toppingProductIds,
        } : {
          freeDeliveryThreshold:Number(draft.freeDeliveryThreshold),deliveryFee:Number(draft.deliveryFee),minimumOrderAmount:Number(draft.minimumOrderAmount),maximumOrderAmount:Number(draft.maximumOrderAmount),estimatedDeliveryMinutes:Number(draft.estimatedDeliveryMinutes),...(draft.deliveryZone.length >= 3 ? {deliveryZone:draft.deliveryZone} : {}),
        }),
      });
      handleRegionUpdated(updated);
      onNotice("Настройки сохранены", "success");
      await load();
    } catch (saveError) {
      onNotice(saveError instanceof Error ? saveError.message : "Не удалось сохранить настройки", "error");
    } finally {
      setSaving(false);
    }
  };

  const savePickup = async (event: FormEvent) => {
    event.preventDefault();
    if (!item || !pickupEditor || saving || !can(pickupEditor.item ? "cities.edit" : "cities.create")) return;
    setSaving(true);
    try {
      const coordinates = pickupEditor.latitude === "" || pickupEditor.longitude === ""
        ? {}
        : {
            latitude: Number(pickupEditor.latitude),
            longitude: Number(pickupEditor.longitude),
          };
      const payload = {
        title: pickupEditor.title.trim(),
        address: pickupEditor.address.trim(),
        workingHours: pickupEditor.workingHours.trim(),
        ...coordinates,
        yandexUrl: pickupEditor.yandexUrl.trim(),
        enabled: pickupEditor.enabled,
        sortOrder: Number(pickupEditor.sortOrder),
      };
      if (pickupEditor.item) {
        await request(`/admin/pickup-locations/${pickupEditor.item.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await request("/admin/pickup-locations", {
          method: "POST",
          body: JSON.stringify({ ...payload, regionId: item.id }),
        });
      }
      onNotice(pickupEditor.item ? "Точка самовывоза обновлена" : "Точка самовывоза добавлена", "success");
      setPickupEditor(null);
      await load();
    } catch (saveError) {
      onNotice(saveError instanceof Error ? saveError.message : "Не удалось сохранить точку", "error");
    } finally {
      setSaving(false);
    }
  };

  const resolvePickupCoordinates = async () => {
    if (!pickupEditor || !can(pickupEditor.item ? "cities.edit" : "cities.create")) return;
    if (!pickupEditor?.yandexUrl) {
      onNotice("Сначала вставьте ссылку на Яндекс Карты", "error");
      return;
    }
    try {
      const result = await request<{ latitude: number; longitude: number; resolvedUrl: string }>(
        "/admin/pickup-locations/resolve-map-link",
        { method: "POST", body: JSON.stringify({ yandexUrl: pickupEditor.yandexUrl }) },
      );
      setPickupEditor((current) => current && current.item?.id === pickupEditor.item?.id && current.yandexUrl === pickupEditor.yandexUrl ? {
        ...current,
        latitude: String(result.latitude),
        longitude: String(result.longitude),
        yandexUrl: result.resolvedUrl,
      } : current);
      onNotice("Координаты определены", "success");
    } catch (resolveError) {
      onNotice(resolveError instanceof Error ? resolveError.message : "Не удалось определить координаты", "error");
    }
  };

  const deletePickup = async (location: PickupLocation) => {
    if (!can("cities.delete")) return;
    if (!window.confirm(`Удалить точку «${location.title || location.address}»?`)) return;
    try {
      await request(`/admin/pickup-locations/${location.id}`, { method: "DELETE" });
      onNotice("Точка самовывоза удалена", "success");
      await load();
    } catch (deleteError) {
      onNotice(deleteError instanceof Error ? deleteError.message : "Не удалось удалить точку", "error");
    }
  };

  const checkEduPos = async () => {
    if (posAction || !can("integrations.edit")) return;
    setPosAction("check");
    try {
      const result = await request<EduPosCheck>("/admin/edu-pos/check", { method: "POST" });
      onNotice(`EDU POS отвечает. Получено блюд: ${result.dishes}`, "success");
      await load();
    } catch (checkError) {
      onNotice(checkError instanceof Error ? checkError.message : "EDU POS не отвечает", "error");
    } finally {
      setPosAction(null);
    }
  };

  const syncEduPosMenu = async () => {
    if (posAction || !canSyncMenu) return;
    setPosAction("sync");
    try {
      const [menu, stopList] = await Promise.all([
        request<EduPosMenuSync>("/admin/edu-pos/sync-menu", { method: "POST" }),
        request<EduPosMenuSync>("/admin/edu-pos/sync-stop-list", { method: "POST" }),
      ]);
      onNotice(`Сверка завершена: сопоставлено ${menu.matched ?? 0} из ${menu.received ?? 0}, недоступно ${stopList.unavailable ?? 0}`, "success");
      await load();
    } catch (syncError) {
      onNotice(syncError instanceof Error ? syncError.message : "Не удалось сверить меню", "error");
    } finally {
      setPosAction(null);
    }
  };

  const exportEduPosMenu = async () => {
    if (posAction || !canExportMenu) return;
    setPosAction("export");
    try {
      const result = await request<EduPosExport>(`/admin/edu-pos/export-menu?region=${encodeURIComponent(region)}`, { method: "POST" });
      onNotice(`В EDU POS отправлено: ${result.categories} категорий и ${result.products} блюд`, "success");
      await load();
    } catch (exportError) {
      onNotice(exportError instanceof Error ? exportError.message : "EDU POS не принял меню", "error");
    } finally {
      setPosAction(null);
    }
  };

  if (loading && !draft) {
    return <div className="grid min-h-56 place-items-center rounded-xl border border-border bg-card text-sm text-muted-foreground">Загружаем настройки…</div>;
  }
  if (error && !draft) {
    return <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive" role="alert">{error}</div>;
  }
  if (!item || !draft) {
    return <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Город не найден.</div>;
  }

  return (
    <div className="space-y-6">
      <WorkspaceHeading title={initialTab === "hours" ? "Часы работы" : "Настройки"} description={initialTab === "hours" ? `Дни и время приёма заказов · ${item.name}` : `Работа ресторана, доставка и интеграции · ${item.name}`} />
      <div className={`grid items-start gap-5 ${initialTab === "hours" ? "" : "lg:grid-cols-[190px_minmax(0,1fr)]"}`}>
      {initialTab !== "hours" ? <Card className="gap-1 p-2 lg:sticky lg:top-20"><nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Разделы настроек">{tabs.filter((entry) => can(`${tabPermissions[entry.id]}.view`)).map((entry) => <Button key={entry.id} type="button" variant={tab === entry.id ? "secondary" : "ghost"} className="min-h-10 justify-start" aria-current={tab === entry.id ? "page" : undefined} onClick={() => changeTab(entry.id)}>{entry.label}</Button>)}</nav></Card> : null}
      <div className="min-w-0 space-y-4">
      {tab === "kit" ? <Card className="p-4"><Label className="grid gap-2 text-sm font-medium">Поиск платных топпингов<Input type="search" placeholder="Найти товар для топпинга" value={productSearch} onChange={(event) => {setProductSearch(event.target.value);setProductPage(0);}} /></Label></Card> : null}
      {tab === "cities" ? <CitiesWorkspace regions={regions} request={request} onRegionUpdated={handleRegionUpdated} onNotice={onNotice} /> : <form className="space-y-4" onSubmit={saveRegion}><fieldset disabled={!canEditTab || saving} className="space-y-4">
        {tab === "basic" ? (
          <Card className="rounded-xl border border-border bg-card p-5">
            <div className="border-b border-border pb-4">
              <h2 className="font-semibold text-foreground">Основные настройки</h2>
              <p className="mt-1 text-sm text-muted-foreground">Город: {item.name}</p>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Label className={labelClass}>Телефон кухни<Input className={inputClass} value={draft.contactPhone} onChange={(event) => setDraft({ ...draft, contactPhone: event.target.value })} /></Label>
              <Label className={labelClass}>Телефон поддержки<Input className={inputClass} value={draft.supportPhone} onChange={(event) => setDraft({ ...draft, supportPhone: event.target.value })} /></Label>
              <Label className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm font-medium text-foreground sm:col-span-2"><input type="checkbox" className="size-4 accent-primary" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} /><span>Показывать город на сайте и в приложении<small className="mt-1 block text-xs text-muted-foreground">Скрытый город недоступен для новых заказов.</small></span></Label>
            </div>
          </Card>
        ) : null}

        {tab === "hours" ? <Card className="p-5"><div><h2 className="font-semibold">Расписание приёма заказов</h2><p className="mt-1 text-sm text-muted-foreground">Укажите рабочие дни и время по часовому поясу города.</p></div><div className="grid gap-4 sm:grid-cols-2">                <Label className={labelClass}>Начало работы<Input required type="time" disabled={draft.deliveryIs24Hours} className={inputClass} value={draft.deliveryOpenTime} onChange={(event) => setDraft({ ...draft, deliveryOpenTime: event.target.value })} /></Label>
                <Label className={labelClass}>Окончание работы<Input required type="time" disabled={draft.deliveryIs24Hours} className={inputClass} value={draft.deliveryCloseTime} onChange={(event) => setDraft({ ...draft, deliveryCloseTime: event.target.value })} /></Label>
                <Label className="flex items-center gap-3 self-end rounded-lg border border-border p-3 text-sm font-medium text-foreground"><input type="checkbox" className="size-4 accent-primary" checked={draft.deliveryIs24Hours} onChange={(event) => setDraft({ ...draft, deliveryIs24Hours: event.target.checked })} />Круглосуточно</Label>
</div>              <fieldset className="mt-5"><legend className="text-sm font-medium text-foreground">Рабочие дни</legend><div className="mt-2 flex flex-wrap gap-2">{weekdays.map((day) => <Label key={day.value} className={`grid size-11 cursor-pointer place-items-center rounded-lg border text-sm font-medium ${draft.deliveryWorkingDays.includes(day.value) ? "border-primary bg-primary/5 text-primary" : "border-input text-muted-foreground"}`}><input type="checkbox" className="sr-only" checked={draft.deliveryWorkingDays.includes(day.value)} onChange={(event) => setDraft({ ...draft, deliveryWorkingDays: event.target.checked ? [...draft.deliveryWorkingDays, day.value] : draft.deliveryWorkingDays.filter((value) => value !== day.value) })} />{day.label}</Label>)}</div></fieldset></Card> : null}

        {tab === "delivery" ? (
          <div className="space-y-4">
            <Card className="rounded-xl border border-border bg-card p-5">
              <div className="border-b border-border pb-4"><h2 className="font-semibold text-foreground">Условия доставки</h2><p className="mt-1 text-sm text-muted-foreground">Стоимость, ограничения суммы заказа и зона обслуживания.</p></div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Label className={labelClass}>Минимальный заказ<Input required min="0" type="number" className={inputClass} value={draft.minimumOrderAmount} onChange={(event) => setDraft({ ...draft, minimumOrderAmount: event.target.value })} /></Label>
                <Label className={labelClass}>Максимальный заказ<Input required min="1" type="number" className={inputClass} value={draft.maximumOrderAmount} onChange={(event) => setDraft({ ...draft, maximumOrderAmount: event.target.value })} /></Label>
                <Label className={labelClass}>Стоимость доставки<Input required min="0" type="number" className={inputClass} value={draft.deliveryFee} onChange={(event) => setDraft({ ...draft, deliveryFee: event.target.value })} /></Label>
                <Label className={labelClass}>Бесплатная доставка от<Input required min="0" type="number" className={inputClass} value={draft.freeDeliveryThreshold} onChange={(event) => setDraft({ ...draft, freeDeliveryThreshold: event.target.value })} /></Label>
                <Label className={labelClass}>Ожидаемое время, минут<Input required min="1" type="number" className={inputClass} value={draft.estimatedDeliveryMinutes} onChange={(event) => setDraft({ ...draft, estimatedDeliveryMinutes: event.target.value })} /></Label>
              </div>

            </Card>
            <Card className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4"><h2 className="font-semibold text-foreground">Зона доставки</h2><p className="mt-1 text-sm text-muted-foreground">Нарисуйте или скорректируйте границу на карте.</p></div>
              <DeliveryZoneEditor cityName={item.name} regionSlug={item.slug} points={draft.deliveryZone} readOnly={!canEditTab} onChange={(deliveryZone) => setDraft({ ...draft, deliveryZone })} />
            </Card>
          </div>
        ) : null}

        {tab === "kit" ? (
          <div className="space-y-4">
            {usesSharedKitCatalog ? (
              <Card className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold text-foreground">Справочник бесплатной комплектации</h2>
                <p className="mt-1 text-sm text-muted-foreground">Меню этого города использует каталог города «{menuRegionName}». Комплектация блюд настраивается в меню, а бесплатные позиции справочника — в настройках города «{menuRegionName}».</p>
                <Button variant="ghost" type="button" className={`${secondaryButton} mt-4`} onClick={() => onSelectRegion(menuRegionSlug)}>Открыть настройки: {menuRegionName}</Button>
                {kitCatalog.length ? <ul className="mt-4 grid gap-2 sm:grid-cols-2">{kitCatalog.map((kitItem) => <li key={kitItem.id} className="flex min-w-0 items-center gap-3 rounded-lg border border-border p-3">{kitItem.image ? <img src={kitItem.image} alt="" className="size-12 shrink-0 rounded-lg object-contain" /> : null}<span className="min-w-0 break-words text-sm text-foreground">{kitItem.name}</span></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">В справочнике пока нет бесплатных позиций.</p>}
              </Card>
            ) : (
            <Card className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold text-foreground">Справочник бесплатной комплектации</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Добавьте соусы и другие бесплатные позиции. Их количество на одну порцию указывается отдельно в разделе «Меню» → «Комплектация» каждого блюда.</p>
                </div>
                <Button variant="ghost"
                  type="button"
                  className={secondaryButton}
                  onClick={() => setDraft({
                    ...draft,
                    freeKitItems: [...draft.freeKitItems, {
                      id: `kit-${Date.now().toString(36)}`,
                      name: "Новая позиция",
                      image: "",
                      defaultQuantity: 1,
                      enabled: true,
                    }],
                  })}
                >
                  <Icon path={mdiPlus} size={0.72} aria-hidden="true" />Добавить позицию
                </Button>
              </div>
              {draft.freeKitItems.length ? (
                <div className="mt-5 grid items-start gap-4 xl:grid-cols-2">
                  {draft.freeKitItems.map((kitItem, index) => (
                    <article key={kitItem.id} aria-label={`Комплектация: ${kitItem.name}`} className="grid min-w-0 gap-5 rounded-xl border border-border p-4 sm:grid-cols-[160px_minmax(0,1fr)]">
                      <ImageUpload
                        compact
                        label="Изображение"
                        value={kitItem.image}
                        hint="Фото для корзины и карточки товара."
                        onChange={(image) => setDraft({
                          ...draft,
                          freeKitItems: draft.freeKitItems.map((entry, entryIndex) => entryIndex === index ? { ...entry, image } : entry),
                        })}
                        onError={(message) => onNotice(message, "error")}
                      />
                      <div className="grid min-w-0 content-start gap-4">
                        <Label className={labelClass}>Название<Input required maxLength={140} className={inputClass} value={kitItem.name} onChange={(event) => setDraft({ ...draft, freeKitItems: draft.freeKitItems.map((entry, entryIndex) => entryIndex === index ? { ...entry, name: event.target.value } : entry) })} /></Label>
                        <p className="text-xs text-muted-foreground">Количество задаётся в комплектации каждого блюда.</p>
                        <Label className="flex items-center gap-3 text-sm font-medium text-foreground"><input type="checkbox" className="size-4 shrink-0 accent-primary" checked={kitItem.enabled !== false} onChange={(event) => setDraft({ ...draft, freeKitItems: draft.freeKitItems.map((entry, entryIndex) => entryIndex === index ? { ...entry, enabled: event.target.checked } : entry) })} />Доступно для выбора в блюдах</Label>
                        <Button variant="ghost" type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-destructive/20 px-4 text-sm font-medium text-destructive hover:bg-destructive/10" onClick={() => { if (window.confirm(`Удалить «${kitItem.name}» из справочника? Проверьте комплектацию блюд после сохранения.`)) setDraft({ ...draft, freeKitItems: draft.freeKitItems.filter((_, entryIndex) => entryIndex !== index) }); }}><Icon path={mdiDeleteOutline} size={0.7} aria-hidden="true" />Удалить из комплектации</Button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <div className="mt-5 rounded-lg bg-muted/50 p-5 text-sm text-muted-foreground">В справочнике пока нет бесплатных позиций. Добавьте их, чтобы настроить комплектацию блюд.</div>}
            </Card>
            )}

            <Card className="rounded-xl border border-border bg-card p-5">
              <div className="border-b border-border pb-4">
                <h2 className="font-semibold text-foreground">Платные топпинги</h2>
                <p className="mt-1 text-sm text-muted-foreground">Выберите товары из меню, которые сайт и приложение покажут в блоке «Дополнительно». Цена, фото и доступность редактируются в разделе «Меню».</p>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {categories.flatMap((category) => category.products.map((product) => (
                  <Label key={product.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${draft.toppingProductIds.includes(product.id) ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                    <input
                      type="checkbox"
                      className="size-4 shrink-0 accent-primary"
                      checked={draft.toppingProductIds.includes(product.id)}
                      onChange={(event) => setDraft({
                        ...draft,
                        toppingProductIds: event.target.checked
                          ? [...draft.toppingProductIds, product.id]
                          : draft.toppingProductIds.filter((id) => id !== product.id),
                      })}
                    />
                    {product.image ? <img src={product.image} alt="" className="size-14 shrink-0 rounded-lg object-cover" /> : <span className="size-14 shrink-0 rounded-lg bg-muted" />}
                    <span className="min-w-0"><strong className="block truncate text-sm text-foreground">{product.name}</strong><small className="mt-1 block text-xs text-muted-foreground">{category.title} · {product.price} сом</small></span>
                  </Label>
                )))}
              </div>
            </Card>
          </div>
        ) : null}

        {canEditTab && (["basic", "delivery", "hours", "kit"] as SettingsTab[]).includes(tab) ? (
          <div className="sticky bottom-3 flex justify-end rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur"><Button variant="ghost" type="submit" className={`${primaryButton} w-full sm:w-auto`} disabled={saving}>{saving ? "Сохраняем…" : "Сохранить настройки"}</Button></div>
        ) : null}
      </fieldset></form>}
      {tab === "kit" ? <ListPagination total={productTotal} page={productPage} onPageChange={setProductPage} /> : null}

      {tab === "pickup" ? (
        <Card className="overflow-hidden rounded-xl border border-border bg-card">
          <header className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-foreground">Точки самовывоза</h2><p className="mt-1 text-sm text-muted-foreground">Адреса, которые клиент может выбрать при оформлении.</p></div><Button variant="ghost" type="button" className={primaryButton} disabled={!can("cities.create")} onClick={() => setPickupEditor(emptyPickup(item.pickupLocations?.length ?? 0))}><Icon path={mdiPlus} size={0.72} aria-hidden="true" />Добавить точку самовывоза</Button></header>
          {item.pickupLocations?.length ? <div className="divide-y divide-border">{item.pickupLocations.map((location) => <article key={location.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center lg:px-5"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-foreground">{location.title || "Точка самовывоза"}</strong><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${location.enabled ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>{location.enabled ? "Активна" : "Выключена"}</span></div><p className="mt-2 text-sm text-foreground">{location.address}</p><p className="mt-1 text-xs text-muted-foreground">{location.workingHours || "Время работы не указано"}</p></div><div className="grid grid-cols-2 gap-2"><Button variant="ghost" type="button" className={secondaryButton} disabled={!can("cities.edit")} onClick={() => setPickupEditor(pickupDraft(location))}>Редактировать</Button><Button variant="ghost" type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-destructive/20 px-4 text-sm font-medium text-destructive hover:bg-destructive/10" disabled={!can("cities.delete")} onClick={() => void deletePickup(location)}><Icon path={mdiDeleteOutline} size={0.7} aria-hidden="true" />Удалить</Button></div></article>)}</div> : <div className="grid min-h-52 place-items-center p-8 text-center text-sm text-muted-foreground">Точек самовывоза пока нет.</div>}
        </Card>
      ) : null}

      {tab === "edu-pos" ? (
        <div className="space-y-4">
          <Card className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-foreground">Подключение EDU POS</h2><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${eduPosStatus?.configured ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>{eduPosStatus?.configured ? "Настроено" : "Не настроено"}</span></div><p className="mt-2 text-sm text-muted-foreground">Заказы синхронизируются каждые {eduPosStatus?.intervals.ordersSeconds ?? 7.5} сек.</p></div><Button variant="ghost" type="button" className={secondaryButton} disabled={Boolean(posAction) || !can("integrations.edit")} onClick={() => void checkEduPos()}><Icon path={mdiCheckNetworkOutline} size={0.75} aria-hidden="true" />{posAction === "check" ? "Проверяем…" : "Проверить подключение"}</Button></div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-muted/50 p-4"><dt className="text-xs text-muted-foreground">Последняя сверка меню</dt><dd className="mt-1 text-sm font-medium text-foreground">{formatDate(eduPosStatus?.lastMenuSyncAt ?? null)}</dd></div><div className="rounded-lg bg-muted/50 p-4"><dt className="text-xs text-muted-foreground">Последняя сверка стоп-листа</dt><dd className="mt-1 text-sm font-medium text-foreground">{formatDate(eduPosStatus?.lastStopListSyncAt ?? null)}</dd></div></dl>
            {eduPosStatus?.lastError ? <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"><strong className="block">Последняя ошибка</strong><span className="mt-1 block break-words">Проверьте подключение к EDU POS. Подробности доступны в журнале сервера.</span></div> : null}
          </Card>
          <Card className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-border bg-card p-5"><Icon path={mdiSwapHorizontal} size={1} aria-hidden="true" className="text-primary" /><h3 className="mt-4 font-semibold text-foreground">Сверить меню из EDU POS</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Обновит цены, сопоставления блюд и стоп-лист на сайте.</p><Button variant="ghost" type="button" className={`${primaryButton} mt-5 w-full`} disabled={Boolean(posAction) || !eduPosStatus?.configured || !canSyncMenu} onClick={() => void syncEduPosMenu()}>{posAction === "sync" ? "Сверяем…" : "Сверить меню"}</Button></article>
            <article className="rounded-xl border border-border bg-card p-5"><Icon path={mdiDownloadOutline} size={1} aria-hidden="true" className="text-primary" /><h3 className="mt-4 font-semibold text-foreground">Экспортировать меню в EDU POS</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Отправит категории, блюда, цены, доступность и модификации выбранного города.</p><Button variant="ghost" type="button" className={`${primaryButton} mt-5 w-full`} disabled={Boolean(posAction) || !eduPosStatus?.configured || !canExportMenu} onClick={() => void exportEduPosMenu()}>{posAction === "export" ? "Экспортируем…" : "Экспортировать меню"}</Button></article>
          </Card>
          <Card className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary"><strong className="block">Как синхронизируются заказы</strong><p className="mt-1 leading-6">После «Принять заказ» он отправляется в EDU POS. Статусы кухни автоматически переводят заказ в «Готовится» и «Готов». Более ранний ответ POS не может откатить уже продвинутый заказ назад.</p></Card>
        </div>
      ) : null}

      </div></div>

      <EditorDialog open={Boolean(pickupEditor)} onClose={() => { if (!saving) closePickupEditor(); }} title={pickupEditor?.item ? "Редактировать точку самовывоза" : "Новая точка самовывоза"} description="Адрес и время работы видны клиентам при оформлении заказа.">
      {pickupEditor ? <form className="flex min-h-0 flex-col" onSubmit={savePickup}><fieldset disabled={saving || !can(pickupEditor.item ? "cities.edit" : "cities.create")} className="contents">
            <div className="grid gap-4 overflow-y-auto p-5"><Label className={labelClass}>Название точки<Input className={inputClass} placeholder="Например, Манаса" value={pickupEditor.title} onChange={(event) => setPickupEditor({ ...pickupEditor, title: event.target.value })} /></Label><Label className={labelClass}>Адрес<Input required className={inputClass} value={pickupEditor.address} onChange={(event) => setPickupEditor({ ...pickupEditor, address: event.target.value })} /></Label><Label className={labelClass}>Время работы<Input className={inputClass} placeholder="Ежедневно, 11:00–23:00" value={pickupEditor.workingHours} onChange={(event) => setPickupEditor({ ...pickupEditor, workingHours: event.target.value })} /></Label><div className="grid gap-2 sm:grid-cols-[1fr_auto]"><Label className={labelClass}>Ссылка на Яндекс Карты<Input type="url" className={inputClass} placeholder="https://yandex.ru/maps/…" value={pickupEditor.yandexUrl} onChange={(event) => setPickupEditor({ ...pickupEditor, yandexUrl: event.target.value })} /></Label><Button variant="ghost" type="button" className={`${secondaryButton} self-end`} onClick={() => void resolvePickupCoordinates()}><Icon path={mdiRefresh} size={0.7} aria-hidden="true" />Определить координаты</Button></div><div className="grid gap-4 sm:grid-cols-2"><Label className={labelClass}>Широта<Input type="number" step="any" className={inputClass} value={pickupEditor.latitude} onChange={(event) => setPickupEditor({ ...pickupEditor, latitude: event.target.value })} /></Label><Label className={labelClass}>Долгота<Input type="number" step="any" className={inputClass} value={pickupEditor.longitude} onChange={(event) => setPickupEditor({ ...pickupEditor, longitude: event.target.value })} /></Label></div><div className="grid gap-4 sm:grid-cols-2"><Label className={labelClass}>Порядок<Input min="0" type="number" className={inputClass} value={pickupEditor.sortOrder} onChange={(event) => setPickupEditor({ ...pickupEditor, sortOrder: event.target.value })} /></Label><Label className="flex items-center gap-3 self-end rounded-lg border border-border p-3 text-sm font-medium text-foreground"><input type="checkbox" className="size-4 accent-primary" checked={pickupEditor.enabled} onChange={(event) => setPickupEditor({ ...pickupEditor, enabled: event.target.checked })} />Точка активна</Label></div></div>
            <footer className="grid gap-2 border-t border-border p-4 sm:grid-cols-2"><Button variant="ghost" type="button" className={secondaryButton} onClick={closePickupEditor}>Отменить</Button><Button variant="ghost" type="submit" className={primaryButton} disabled={saving}>{saving ? "Сохраняем…" : "Сохранить точку"}</Button></footer>
          </fieldset></form> : null}
      </EditorDialog>
    </div>
  );
}
