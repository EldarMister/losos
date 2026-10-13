"use client";
import { translateAdmin as t, adminLocale } from "./i18n/store";
import { useAdminLanguage } from "./i18n/react";

import { confirmAdminAction } from "./AdminConfirmationDialog";
/* eslint-disable @next/next/no-img-element */
import { PlugZap, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { EditorDialog, ListPagination, WorkspaceHeading } from "./workspace-kit";
import { useDraftEditor, useUnsavedChanges, confirmAdminNavigation } from "./use-unsaved-changes";
import { useAdminAccess } from "./admin-access";
import { DeliveryZoneEditor } from "./DeliveryZoneEditor";
import { ImageUpload } from "./ImageUpload";
import { CitiesWorkspace } from "./CitiesWorkspace";
import { fallbackFreeKitItems } from "./kit-catalog";
import type { AdminRequest, DeliveryZonePoint, PickupLocation, Region, Category, Dashboard, FreeKitItem, } from "./admin-types";
type SettingsWorkspaceProps = {
    region: string;
    initialTab?: SettingsTab;
    regions: Region[];
    request: AdminRequest;
    onRegionUpdated: (region: Region) => void;
    onRegionRemoved: (id: number) => void;
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
    intervals: {
        menuSeconds: number;
        stopListSeconds: number;
        ordersSeconds: number;
    };
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
const inputClass = "w-full";
const labelClass = "grid gap-1.5 text-sm font-medium text-foreground";
const tabs: Array<{
    id: SettingsTab;
    label: string;
}> = [
    { id: "basic", get label() {
            return t("Основное");
        } },
    { id: "cities", get label() {
            return t("Города");
        } },
    { id: "delivery", get label() {
            return t("Доставка");
        } },
    { id: "hours", get label() {
            return t("Часы работы");
        } },
    { id: "pickup", get label() {
            return t("Самовывоз");
        } },
    { id: "kit", get label() {
            return t("Комплектация");
        } },
    { id: "edu-pos", get label() {
            return t("EDU POS");
        } },
];
const toppingCategoryPattern = /топпинг|соус|добав|васаби|имбир/i;
function legacyToppingIds(categories: Category[]) {
    return categories
        .filter((category) => toppingCategoryPattern.test(`${category.title} ${category.slug}`))
        .flatMap((category) => category.products.map((product) => product.id));
}
const weekdays = [
    { value: 1, get label() {
            return t("Пн");
        } }, { value: 2, get label() {
            return t("Вт");
        } }, { value: 3, get label() {
            return t("Ср");
        } },
    { value: 4, get label() {
            return t("Чт");
        } }, { value: 5, get label() {
            return t("Пт");
        } }, { value: 6, get label() {
            return t("Сб");
        } },
    { value: 0, get label() {
            return t("Вс");
        } },
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
    if (!value)
        return t("Ещё не выполнялась");
    return new Intl.DateTimeFormat(adminLocale(), {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    }).format(new Date(value));
}
export function SettingsWorkspace({ region, regions, request, onRegionUpdated, onRegionRemoved, onSelectRegion, onNotice, initialTab = "basic" }: SettingsWorkspaceProps) {
    useAdminLanguage();
    const { can } = useAdminAccess();
    const tabPermissions: Record<SettingsTab, string> = { basic: "cities", cities: "cities", delivery: "settings", hours: "hours", pickup: "cities", kit: "kits", "edu-pos": "integrations" };
    const [requestedTab, setTab] = useState<SettingsTab>(initialTab);
    const tab = can(`${tabPermissions[requestedTab]}.view`) ? requestedTab : tabs.find((entry) => can(`${tabPermissions[entry.id]}.view`))?.id ?? initialTab;
    const canEditTab = can(`${tabPermissions[tab]}.edit`);
    const [savedDraft, setSavedDraft] = useState("");
    const [productSearch, setProductSearch] = useState("");
    const [productPage, setProductPage] = useState(0);
    const [productTotal, setProductTotal] = useState(0);
    const canViewKits = can("kits.view");
    const canViewIntegrations = can("integrations.view");
    const needsCatalog = canViewKits && tab === "kit";
    const needsIntegrationStatus = canViewIntegrations && tab === "edu-pos";
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
                needsIntegrationStatus ? request<EduPosStatus>("/admin/edu-pos/status").catch(() => null) : Promise.resolve(null),
                needsCatalog ? request<{
                    items: (Dashboard["categories"][number]["products"][number] & {
                        categoryId: number;
                    })[];
                    categories: Category[];
                    total: number;
                    menuRegionSlug: string;
                    kitCatalog: FreeKitItem[];
                    effectiveToppingProductIds: number[];
                }>(`/admin/catalog-page?${new URLSearchParams({ region, limit: "25", offset: "0" })}`) : Promise.resolve(null),
            ]);
            const selected = regionItems.find((candidate) => candidate.slug === region) ?? regionItems[0] ?? null;
            const nextCategories = catalog?.categories.map((category) => ({ ...category, products: catalog.items.filter((product) => product.categoryId === category.id) })) ?? [];
            setItem(selected);
            setCategories(nextCategories);
            setMenuRegionSlug(catalog?.menuRegionSlug ?? region);
            setKitCatalog(catalog?.kitCatalog ?? []);
            setProductTotal(catalog?.total ?? 0);
            const nextDraft = selected ? draftFromRegion(selected, nextCategories) : null;
            if (nextDraft && catalog?.effectiveToppingProductIds && selected?.toppingProductIds == null)
                nextDraft.toppingProductIds = catalog.effectiveToppingProductIds;
            setDraft(nextDraft);
            setSavedDraft(JSON.stringify(nextDraft));
            setEduPosStatus(status);
        }
        catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : t("Не удалось загрузить настройки"));
        }
        finally {
            setLoading(false);
        }
    }, [region, request, needsCatalog, needsIntegrationStatus]);
    const settingsDirty = draft !== null && savedDraft !== JSON.stringify(draft);
    useUnsavedChanges(settingsDirty);
    const changeTab = async (next: SettingsTab) => {
        if (next === tab || saving || posAction)
            return;
        if (!await confirmAdminNavigation())
            return;
        if (settingsDirty && savedDraft)
            setDraft(JSON.parse(savedDraft) as SettingsDraft);
        setTab(next);
    };
    useEffect(() => {
        if (!canViewKits || tab !== "kit")
            return;
        let active = true;
        const timer = window.setTimeout(() => {
            void request<{
                items: (Dashboard["categories"][number]["products"][number] & {
                    categoryId: number;
                })[];
                categories: Category[];
                total: number;
            }>(`/admin/catalog-page?${new URLSearchParams({ region, search: productSearch, limit: "25", offset: String(productPage * 25) })}`).then((catalog) => {
                if (!active)
                    return;
                setCategories(catalog.categories.map((category) => ({ ...category, products: catalog.items.filter((product) => product.categoryId === category.id) })));
                setProductTotal(catalog.total);
            }).catch((error: unknown) => { if (active)
                onNotice(error instanceof Error ? error.message : t("Не удалось загрузить товары"), "error"); });
        }, 200);
        return () => { active = false; window.clearTimeout(timer); };
    }, [canViewKits, tab, region, productSearch, productPage, request, onNotice]);
    const usesSharedKitCatalog = menuRegionSlug !== region;
    const menuRegionName = regions.find((candidate) => candidate.slug === menuRegionSlug)?.name ?? t("общего каталога");
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
        if (!item || !draft || saving || !canEditTab)
            return;
        if (tab === "delivery" && draft.deliveryZone.length > 0 && draft.deliveryZone.length < 3) {
            onNotice(t("Для зоны доставки нужно минимум три точки"), "error");
            return;
        }
        setSaving(true);
        try {
            const updated = await request<Region>(`/admin/regions/${item.id}`, {
                method: "PATCH",
                body: JSON.stringify(tab === "basic" ? {
                    enabled: draft.enabled, contactPhone: draft.contactPhone.trim(), supportPhone: draft.supportPhone.trim(),
                } : tab === "hours" ? {
                    deliveryOpenTime: draft.deliveryOpenTime, deliveryCloseTime: draft.deliveryCloseTime, deliveryIs24Hours: draft.deliveryIs24Hours, deliveryWorkingDays: draft.deliveryWorkingDays,
                } : tab === "kit" ? {
                    ...(usesSharedKitCatalog ? {} : { freeKitItems: draft.freeKitItems }), toppingProductIds: draft.toppingProductIds,
                } : {
                    freeDeliveryThreshold: Number(draft.freeDeliveryThreshold), deliveryFee: Number(draft.deliveryFee), minimumOrderAmount: Number(draft.minimumOrderAmount), maximumOrderAmount: Number(draft.maximumOrderAmount), estimatedDeliveryMinutes: Number(draft.estimatedDeliveryMinutes), ...(draft.deliveryZone.length >= 3 ? { deliveryZone: draft.deliveryZone } : {}),
                }),
            });
            handleRegionUpdated(updated);
            onNotice(t("Настройки сохранены"), "success");
            await load();
        }
        catch (saveError) {
            onNotice(saveError instanceof Error ? saveError.message : t("Не удалось сохранить настройки"), "error");
        }
        finally {
            setSaving(false);
        }
    };
    const savePickup = async (event: FormEvent) => {
        event.preventDefault();
        if (!item || !pickupEditor || saving || !can(pickupEditor.item ? "cities.edit" : "cities.create"))
            return;
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
            }
            else {
                await request("/admin/pickup-locations", {
                    method: "POST",
                    body: JSON.stringify({ ...payload, regionId: item.id }),
                });
            }
            onNotice(pickupEditor.item ? t("Точка самовывоза обновлена") : t("Точка самовывоза добавлена"), "success");
            setPickupEditor(null);
            await load();
        }
        catch (saveError) {
            onNotice(saveError instanceof Error ? saveError.message : t("Не удалось сохранить точку"), "error");
        }
        finally {
            setSaving(false);
        }
    };
    const resolvePickupCoordinates = async () => {
        if (!pickupEditor || !can(pickupEditor.item ? "cities.edit" : "cities.create"))
            return;
        if (!pickupEditor?.yandexUrl) {
            onNotice(t("Сначала вставьте ссылку на Яндекс Карты"), "error");
            return;
        }
        try {
            const result = await request<{
                latitude: number;
                longitude: number;
                resolvedUrl: string;
            }>("/admin/pickup-locations/resolve-map-link", { method: "POST", body: JSON.stringify({ yandexUrl: pickupEditor.yandexUrl }) });
            setPickupEditor((current) => current && current.item?.id === pickupEditor.item?.id && current.yandexUrl === pickupEditor.yandexUrl ? {
                ...current,
                latitude: String(result.latitude),
                longitude: String(result.longitude),
                yandexUrl: result.resolvedUrl,
            } : current);
            onNotice(t("Координаты определены"), "success");
        }
        catch (resolveError) {
            onNotice(resolveError instanceof Error ? resolveError.message : t("Не удалось определить координаты"), "error");
        }
    };
    const deletePickup = async (location: PickupLocation) => {
        if (!can("cities.delete"))
            return;
        if (!await confirmAdminAction(t("Удалить точку \u00AB{0}\u00BB?", { "0": location.title || location.address })))
            return;
        try {
            await request(`/admin/pickup-locations/${location.id}`, { method: "DELETE" });
            onNotice(t("Точка самовывоза удалена"), "success");
            await load();
        }
        catch (deleteError) {
            onNotice(deleteError instanceof Error ? deleteError.message : t("Не удалось удалить точку"), "error");
        }
    };
    const checkEduPos = async () => {
        if (posAction || !can("integrations.edit"))
            return;
        setPosAction("check");
        try {
            const result = await request<EduPosCheck>("/admin/edu-pos/check", { method: "POST" });
            onNotice(t("EDU POS отвечает. Получено блюд: {0}", { "0": result.dishes }), "success");
            await load();
        }
        catch (checkError) {
            onNotice(checkError instanceof Error ? checkError.message : t("EDU POS не отвечает"), "error");
        }
        finally {
            setPosAction(null);
        }
    };
    const syncEduPosMenu = async () => {
        if (posAction || !canSyncMenu)
            return;
        setPosAction("sync");
        try {
            const [menu, stopList] = await Promise.all([
                request<EduPosMenuSync>("/admin/edu-pos/sync-menu", { method: "POST" }),
                request<EduPosMenuSync>("/admin/edu-pos/sync-stop-list", { method: "POST" }),
            ]);
            onNotice(t("Сверка завершена: сопоставлено {0} из {1}, недоступно {2}", { "0": menu.matched ?? 0, "1": menu.received ?? 0, "2": stopList.unavailable ?? 0 }), "success");
            await load();
        }
        catch (syncError) {
            onNotice(syncError instanceof Error ? syncError.message : t("Не удалось сверить меню"), "error");
        }
        finally {
            setPosAction(null);
        }
    };
    const exportEduPosMenu = async () => {
        if (posAction || !canExportMenu)
            return;
        setPosAction("export");
        try {
            const result = await request<EduPosExport>(`/admin/edu-pos/export-menu?region=${encodeURIComponent(region)}`, { method: "POST" });
            onNotice(t("В EDU POS отправлено: {0} категорий и {1} блюд", { "0": result.categories, "1": result.products }), "success");
            await load();
        }
        catch (exportError) {
            onNotice(exportError instanceof Error ? exportError.message : t("EDU POS не принял меню"), "error");
        }
        finally {
            setPosAction(null);
        }
    };
    if (loading && !draft) {
        return <div className="grid min-h-56 place-items-center rounded-xl border border-border bg-card text-sm text-muted-foreground">{t("Загружаем настройки\u2026")}</div>;
    }
    if (error && !draft) {
        return <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-5 text-sm text-destructive" role="alert">{error}</div>;
    }
    if (!item || !draft) {
        return <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">{t("Город не найден.")}</div>;
    }
    return (<div className="space-y-6">
      <WorkspaceHeading title={initialTab === "hours" ? t("Часы работы") : t("Настройки")}/>
      <div className={`grid items-start gap-5 ${initialTab === "hours" ? "" : "lg:grid-cols-[190px_minmax(0,1fr)]"}`}>
      {initialTab !== "hours" ? <Card className="gap-1 p-2 lg:sticky lg:top-20"><nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label={t("Разделы настроек")}>{tabs.filter((entry) => can(`${tabPermissions[entry.id]}.view`)).map((entry) => <Button key={entry.id} type="button" variant={tab === entry.id ? "secondary" : "ghost"} className="justify-start" aria-current={tab === entry.id ? "page" : undefined} onClick={() => changeTab(entry.id)}>{entry.label}</Button>)}</nav></Card> : null}
      <div className="min-w-0 space-y-4">
      {tab === "kit" ? <Card className="p-4"><Label className="grid gap-2 text-sm font-medium">{t("Поиск платных топпингов")}<Input type="search" placeholder={t("Найти товар для топпинга")} value={productSearch} onChange={(event) => { setProductSearch(event.target.value); setProductPage(0); }}/></Label></Card> : null}
      {tab === "cities" ? <CitiesWorkspace regions={regions} request={request} onRegionUpdated={handleRegionUpdated} onRegionRemoved={onRegionRemoved} onNotice={onNotice}/> : <form className="space-y-4" onSubmit={saveRegion}><fieldset disabled={!canEditTab || saving} className="space-y-4">
        {tab === "basic" ? (<Card className="rounded-xl border border-border bg-card p-5">
            <div className="border-b border-border pb-4">
              <h2 className="font-semibold text-foreground">{t("Основные настройки")}</h2>

            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Label className={labelClass}>{t("Телефон кухни")}<Input className={inputClass} value={draft.contactPhone} onChange={(event) => setDraft({ ...draft, contactPhone: event.target.value })}/></Label>
              <Label className={labelClass}>{t("Телефон поддержки")}<Input className={inputClass} value={draft.supportPhone} onChange={(event) => setDraft({ ...draft, supportPhone: event.target.value })}/></Label>
              <Label className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm font-medium text-foreground sm:col-span-2"><input type="checkbox" className="size-4 accent-primary" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })}/><span>{t("Показывать город клиентам")}<small className="mt-1 block text-xs text-muted-foreground">{t("Скрытый город недоступен для новых заказов.")}</small></span></Label>
            </div>
          </Card>) : null}

        {tab === "hours" ? (<Card className="p-5">
            <div><h2 className="font-semibold">{t("Расписание приёма заказов")}</h2><p className="mt-1 text-xs text-muted-foreground">{t("Время Бишкека \u00B7 UTC+6")}</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Label className={labelClass}>{t("Начало работы")}<Input required type="time" disabled={draft.deliveryIs24Hours} className={inputClass} value={draft.deliveryOpenTime} onChange={(event) => setDraft({ ...draft, deliveryOpenTime: event.target.value })}/></Label>
              <Label className={labelClass}>{t("Окончание работы")}<Input required type="time" disabled={draft.deliveryIs24Hours} className={inputClass} value={draft.deliveryCloseTime} onChange={(event) => setDraft({ ...draft, deliveryCloseTime: event.target.value })}/></Label>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <Label htmlFor="delivery-24-hours" className="cursor-pointer text-sm font-medium">{t("Круглосуточно")}</Label>
                <Switch id="delivery-24-hours" checked={draft.deliveryIs24Hours} onCheckedChange={(checked) => setDraft({ ...draft, deliveryIs24Hours: checked })}/>
              </div>
            </div>
            <fieldset><legend className="text-sm font-medium text-foreground">{t("Рабочие дни")}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {weekdays.map((day) => {
                    const selected = draft.deliveryWorkingDays.includes(day.value);
                    return <Button key={day.value} type="button" variant={selected ? "default" : "outline"} className="min-w-10" aria-pressed={selected} onClick={() => setDraft({ ...draft, deliveryWorkingDays: selected ? draft.deliveryWorkingDays.filter((value) => value !== day.value) : [...draft.deliveryWorkingDays, day.value] })}>
                    {day.label}
                  </Button>;
                })}
              </div>
            </fieldset>
          </Card>) : null}

        {tab === "delivery" ? (<div className="space-y-4">
            <Card className="rounded-xl border border-border bg-card p-5">
              <div className="border-b border-border pb-4"><h2 className="font-semibold text-foreground">{t("Условия доставки")}</h2></div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Label className={labelClass}>{t("Минимальный заказ")}<Input required min="0" type="number" className={inputClass} value={draft.minimumOrderAmount} onChange={(event) => setDraft({ ...draft, minimumOrderAmount: event.target.value })}/></Label>
                <Label className={labelClass}>{t("Максимальный заказ")}<Input required min="1" type="number" className={inputClass} value={draft.maximumOrderAmount} onChange={(event) => setDraft({ ...draft, maximumOrderAmount: event.target.value })}/></Label>
                <Label className={labelClass}>{t("Стоимость доставки")}<Input required min="0" type="number" className={inputClass} value={draft.deliveryFee} onChange={(event) => setDraft({ ...draft, deliveryFee: event.target.value })}/></Label>
                <Label className={labelClass}>{t("Бесплатная доставка от")}<Input required min="0" type="number" className={inputClass} value={draft.freeDeliveryThreshold} onChange={(event) => setDraft({ ...draft, freeDeliveryThreshold: event.target.value })}/></Label>
                <Label className={labelClass}>{t("Ожидаемое время, минут")}<Input required min="1" type="number" className={inputClass} value={draft.estimatedDeliveryMinutes} onChange={(event) => setDraft({ ...draft, estimatedDeliveryMinutes: event.target.value })}/></Label>
              </div>

            </Card>
            <Card className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4"><h2 className="font-semibold text-foreground">{t("Зона доставки")}</h2></div>
              <DeliveryZoneEditor cityName={item.name} regionSlug={item.slug} points={draft.deliveryZone} readOnly={!canEditTab} onChange={(deliveryZone) => setDraft({ ...draft, deliveryZone })}/>
            </Card>
          </div>) : null}

        {tab === "kit" ? (<div className="space-y-4">
            {usesSharedKitCatalog ? (<Card className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold text-foreground">{t("Справочник бесплатной комплектации")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("Меню этого города использует каталог города \u00AB")}{menuRegionName}{t("\u00BB. Комплектация блюд настраивается в меню, а бесплатные позиции справочника \u2014 в настройках города \u00AB")}{menuRegionName}».</p>
                <Button variant="outline" type="button" className="mt-4" onClick={() => onSelectRegion(menuRegionSlug)}>{t("Открыть настройки:")}{menuRegionName}</Button>
                {kitCatalog.length ? <ul className="mt-4 grid gap-2 sm:grid-cols-2">{kitCatalog.map((kitItem) => <li key={kitItem.id} className="flex min-w-0 items-center gap-3 rounded-lg border border-border p-3">{kitItem.image ? <img src={kitItem.image} alt="" className="size-12 shrink-0 rounded-lg object-contain"/> : null}<span className="min-w-0 break-words text-sm text-foreground">{kitItem.name}</span></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">{t("В справочнике пока нет бесплатных позиций.")}</p>}
              </Card>) : (<Card className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold text-foreground">{t("Справочник бесплатной комплектации")}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("Бесплатные позиции для комплектации блюд.")}</p>
                </div>
                <Button variant="outline" type="button" onClick={() => setDraft({
                        ...draft,
                        freeKitItems: [...draft.freeKitItems, {
                                id: `kit-${Date.now().toString(36)}`,
                                name: t("Новая позиция"),
                                image: "",
                                defaultQuantity: 1,
                                enabled: true,
                            }],
                    })}>
                  <Plus className="size-4 shrink-0" aria-hidden="true"/>{t("Добавить позицию")}</Button>
              </div>
              {draft.freeKitItems.length ? (<div className="mt-5 grid items-start gap-4 xl:grid-cols-2">
                  {draft.freeKitItems.map((kitItem, index) => (<article key={kitItem.id} aria-label={t("Комплектация: {0}", { "0": kitItem.name })} className="grid min-w-0 gap-5 rounded-xl border border-border p-4 sm:grid-cols-[160px_minmax(0,1fr)]">
                      <ImageUpload compact label={t("Изображение")} value={kitItem.image} hint={t("Фото для корзины и карточки товара.")} onChange={(image) => setDraft({
                                ...draft,
                                freeKitItems: draft.freeKitItems.map((entry, entryIndex) => entryIndex === index ? { ...entry, image } : entry),
                            })} onError={(message) => onNotice(message, "error")}/>
                      <div className="grid min-w-0 content-start gap-4">
                        <Label className={labelClass}>{t("Название")}<Input required maxLength={140} className={inputClass} value={kitItem.name} onChange={(event) => setDraft({ ...draft, freeKitItems: draft.freeKitItems.map((entry, entryIndex) => entryIndex === index ? { ...entry, name: event.target.value } : entry) })}/></Label>
                        <p className="text-xs text-muted-foreground">{t("Количество задаётся в комплектации каждого блюда.")}</p>
                        <Label className="flex items-center gap-3 text-sm font-medium text-foreground"><input type="checkbox" className="size-4 shrink-0 accent-primary" checked={kitItem.enabled !== false} onChange={(event) => setDraft({ ...draft, freeKitItems: draft.freeKitItems.map((entry, entryIndex) => entryIndex === index ? { ...entry, enabled: event.target.checked } : entry) })}/>{t("Доступно для выбора в блюдах")}</Label>
                        <Button variant="destructive" type="button" onClick={async () => { if (await confirmAdminAction(t("Удалить \u00AB{0}\u00BB из справочника? Проверьте комплектацию блюд после сохранения.", { "0": kitItem.name })))
                            setDraft({ ...draft, freeKitItems: draft.freeKitItems.filter((_, entryIndex) => entryIndex !== index) }); }}><Trash2 className="size-4 shrink-0" aria-hidden="true"/>{t("Удалить")}</Button>
                      </div>
                    </article>))}
                </div>) : <div className="mt-5 rounded-lg bg-muted/50 p-5 text-sm text-muted-foreground">{t("В справочнике пока нет бесплатных позиций. Добавьте их, чтобы настроить комплектацию блюд.")}</div>}
            </Card>)}

            <Card className="rounded-xl border border-border bg-card p-5">
              <div className="border-b border-border pb-4">
                <h2 className="font-semibold text-foreground">{t("Платные топпинги")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("Товары из меню, доступные как добавки.")}</p>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {categories.flatMap((category) => category.products.map((product) => (<Label key={product.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${draft.toppingProductIds.includes(product.id) ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                    <input type="checkbox" className="size-4 shrink-0 accent-primary" checked={draft.toppingProductIds.includes(product.id)} onChange={(event) => setDraft({
                        ...draft,
                        toppingProductIds: event.target.checked
                            ? [...draft.toppingProductIds, product.id]
                            : draft.toppingProductIds.filter((id) => id !== product.id),
                    })}/>
                    {product.image ? <img src={product.image} alt="" className="size-14 shrink-0 rounded-lg object-cover"/> : <span className="size-14 shrink-0 rounded-lg bg-muted"/>}
                    <span className="min-w-0"><strong className="block truncate text-sm text-foreground">{product.name}</strong><small className="mt-1 block text-xs text-muted-foreground">{category.title} · {product.price}{t("сом")}</small></span>
                  </Label>)))}
              </div>
            </Card>
          </div>) : null}

        {canEditTab && (["basic", "delivery", "hours", "kit"] as SettingsTab[]).includes(tab) ? (<div className="flex justify-end border-t pt-4"><Button variant="default" type="submit" className="w-full sm:w-auto" disabled={saving}>{saving ? t("Сохраняем\u2026") : t("Сохранить настройки")}</Button></div>) : null}
      </fieldset></form>}
      {tab === "kit" ? <ListPagination total={productTotal} page={productPage} onPageChange={setProductPage}/> : null}

      {tab === "pickup" ? (<Card className="gap-0 overflow-hidden rounded-md py-0">
          <header className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-foreground">{t("Точки самовывоза")}</h2></div><Button variant="default" type="button" disabled={!can("cities.create")} onClick={() => setPickupEditor(emptyPickup(item.pickupLocations?.length ?? 0))}><Plus className="size-4 shrink-0" aria-hidden="true"/>{t("Добавить точку")}</Button></header>
          {item.pickupLocations?.length ? <div className="divide-y divide-border">{item.pickupLocations.map((location) => <article key={location.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center lg:px-5"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-foreground">{location.title || t("Точка самовывоза")}</strong><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${location.enabled ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>{location.enabled ? t("Активна") : t("Выключена")}</span></div><p className="mt-2 text-sm text-foreground">{location.address}</p><p className="mt-1 text-xs text-muted-foreground">{location.workingHours || t("Время работы не указано")}</p></div><div className="grid grid-cols-2 gap-2"><Button variant="outline" type="button" disabled={!can("cities.edit")} onClick={() => setPickupEditor(pickupDraft(location))}>{t("Редактировать")}</Button><Button variant="destructive" type="button" disabled={!can("cities.delete")} onClick={() => void deletePickup(location)}><Trash2 className="size-4 shrink-0" aria-hidden="true"/>{t("Удалить")}</Button></div></article>)}</div> : <div className="grid min-h-52 place-items-center p-8 text-center text-sm text-muted-foreground">{t("Точек самовывоза пока нет.")}</div>}
        </Card>) : null}

      {tab === "edu-pos" ? (<div className="space-y-4">
          <Card className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-foreground">{t("Подключение EDU POS")}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${eduPosStatus?.configured ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>{eduPosStatus?.configured ? t("Настроено") : t("Не настроено")}</span></div><p className="mt-2 text-sm text-muted-foreground">{t("Заказы синхронизируются каждые")}{eduPosStatus?.intervals.ordersSeconds ?? 7.5}{t("сек.")}</p></div><Button variant="outline" type="button" disabled={Boolean(posAction) || !can("integrations.edit")} onClick={() => void checkEduPos()}><PlugZap className="size-4 shrink-0" aria-hidden="true"/>{posAction === "check" ? t("Проверяем\u2026") : t("Проверить подключение")}</Button></div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-muted/50 p-4"><dt className="text-xs text-muted-foreground">{t("Последняя сверка меню")}</dt><dd className="mt-1 text-sm font-medium text-foreground">{formatDate(eduPosStatus?.lastMenuSyncAt ?? null)}</dd></div><div className="rounded-lg bg-muted/50 p-4"><dt className="text-xs text-muted-foreground">{t("Последняя сверка стоп-листа")}</dt><dd className="mt-1 text-sm font-medium text-foreground">{formatDate(eduPosStatus?.lastStopListSyncAt ?? null)}</dd></div></dl>
            {eduPosStatus?.lastError ? <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"><strong className="block">{t("Последняя ошибка")}</strong><span className="mt-1 block break-words">{t("Проверьте подключение к EDU POS. Подробности доступны в журнале сервера.")}</span></div> : null}
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-border bg-card p-5"><RefreshCw className="size-4 shrink-0 text-primary" aria-hidden="true"/><h3 className="mt-4 font-semibold text-foreground">{t("Сверить меню из EDU POS")}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("Обновит цены, сопоставления блюд и стоп-лист на сайте.")}</p><Button variant="default" type="button" className="mt-5 w-full" disabled={Boolean(posAction) || !eduPosStatus?.configured || !canSyncMenu} onClick={() => void syncEduPosMenu()}>{posAction === "sync" ? t("Сверяем\u2026") : t("Сверить меню")}</Button></article>
            <article className="rounded-xl border border-border bg-card p-5"><Upload className="size-4 shrink-0 text-primary" aria-hidden="true"/><h3 className="mt-4 font-semibold text-foreground">{t("Экспортировать меню в EDU POS")}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("Отправит категории, блюда, цены, доступность и модификации выбранного города.")}</p><Button variant="default" type="button" className="mt-5 w-full" disabled={Boolean(posAction) || !eduPosStatus?.configured || !canExportMenu} onClick={() => void exportEduPosMenu()}>{posAction === "export" ? t("Экспортируем\u2026") : t("Экспортировать меню")}</Button></article>
          </div>
          <details className="rounded-xl border border-border p-4 text-sm"><summary className="cursor-pointer font-medium">{t("Как работает синхронизация")}</summary><p className="mt-3 text-muted-foreground">{t("Принятый заказ передаётся в EDU POS. Статусы кухни обновляются автоматически; устаревший ответ не возвращает заказ на предыдущий этап.")}</p></details>
        </div>) : null}

      </div></div>

      <EditorDialog open={Boolean(pickupEditor)} onClose={() => { if (!saving)
        closePickupEditor(); }} title={pickupEditor?.item ? t("Редактировать точку самовывоза") : t("Новая точка самовывоза")}>
      {pickupEditor ? <form className="flex min-h-0 flex-col" onSubmit={savePickup}><fieldset disabled={saving || !can(pickupEditor.item ? "cities.edit" : "cities.create")} className="contents">
            <div className="grid gap-4 overflow-y-auto p-4"><Label className={labelClass}>{t("Название точки")}<Input className={inputClass} placeholder={t("Например, Манаса")} value={pickupEditor.title} onChange={(event) => setPickupEditor({ ...pickupEditor, title: event.target.value })}/></Label><Label className={labelClass}>{t("Адрес")}<Input required className={inputClass} value={pickupEditor.address} onChange={(event) => setPickupEditor({ ...pickupEditor, address: event.target.value })}/></Label><Label className={labelClass}>{t("Время работы")}<Input className={inputClass} placeholder={t("Ежедневно, 11:00\u201323:00")} value={pickupEditor.workingHours} onChange={(event) => setPickupEditor({ ...pickupEditor, workingHours: event.target.value })}/></Label><div className="grid gap-2 sm:grid-cols-[1fr_auto]"><Label className={labelClass}>{t("Ссылка на Яндекс Карты")}<Input type="url" className={inputClass} placeholder="https://yandex.ru/maps/…" value={pickupEditor.yandexUrl} onChange={(event) => setPickupEditor({ ...pickupEditor, yandexUrl: event.target.value })}/></Label><Button variant="outline" type="button" className="self-end" onClick={() => void resolvePickupCoordinates()}><RefreshCw className="size-4 shrink-0" aria-hidden="true"/>{t("Определить координаты")}</Button></div><div className="grid gap-4 sm:grid-cols-2"><Label className={labelClass}>{t("Широта")}<Input type="number" step="any" className={inputClass} value={pickupEditor.latitude} onChange={(event) => setPickupEditor({ ...pickupEditor, latitude: event.target.value })}/></Label><Label className={labelClass}>{t("Долгота")}<Input type="number" step="any" className={inputClass} value={pickupEditor.longitude} onChange={(event) => setPickupEditor({ ...pickupEditor, longitude: event.target.value })}/></Label></div><div className="grid gap-4 sm:grid-cols-2"><Label className={labelClass}>{t("Порядок")}<Input min="0" type="number" className={inputClass} value={pickupEditor.sortOrder} onChange={(event) => setPickupEditor({ ...pickupEditor, sortOrder: event.target.value })}/></Label><Label className="flex items-center gap-3 self-end rounded-lg border border-border p-3 text-sm font-medium text-foreground"><input type="checkbox" className="size-4 accent-primary" checked={pickupEditor.enabled} onChange={(event) => setPickupEditor({ ...pickupEditor, enabled: event.target.checked })}/>{t("Точка активна")}</Label></div></div>
            <DialogFooter className="mx-0 mb-0 shrink-0"><Button variant="outline" type="button" onClick={closePickupEditor}>{t("Отменить")}</Button><Button variant="default" type="submit" disabled={saving}>{saving ? t("Сохраняем\u2026") : t("Сохранить точку")}</Button></DialogFooter>
          </fieldset></form> : null}
      </EditorDialog>
    </div>);
}
