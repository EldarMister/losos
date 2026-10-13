"use client";
import { translateAdmin as t } from "./i18n/store";
import { useAdminLanguage } from "./i18n/react";

import Image from "next/image";
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Layers3, SlidersHorizontal, Package, MapPin, Clock3, Users, UserCog, ChartNoAxesCombined, Settings2, BadgePercent, LogOut, UserRound, EllipsisVertical, type LucideIcon } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "./ui/sidebar";
import { useAdminAccess } from "./admin-access";
import type { AdminSection } from "./admin-types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
export const adminSections: Array<{
    id: AdminSection;
    label: string;
    description: string;
    permission: string;
    group: string;
    icon: LucideIcon;
}> = [
    { id: "dashboard", get label() {
            return t("Обзор");
        }, get description() {
            return t("Сегодня в вашем бизнесе");
        }, permission: "dashboard.view", group: "Работа", icon: LayoutDashboard },
    { id: "orders", get label() {
            return t("Заказы");
        }, get description() {
            return t("Приём и обработка заказов");
        }, permission: "orders.view", group: "Работа", icon: ShoppingBag },
    { id: "users", get label() {
            return t("Пользователи");
        }, get description() {
            return t("Клиенты и история заказов");
        }, permission: "customers.view", group: "Работа", icon: Users },
    { id: "menu", get label() {
            return t("Товары");
        }, get description() {
            return t("Блюда, цены и доступность");
        }, permission: "products.view", group: "Каталог", icon: UtensilsCrossed },
    { id: "categories", get label() {
            return t("Категории");
        }, get description() {
            return t("Организация меню");
        }, permission: "categories.view", group: "Каталог", icon: Layers3 },
    { id: "modifiers", get label() {
            return t("Модификаторы");
        }, get description() {
            return t("Варианты выбора и дополнения");
        }, permission: "modifiers.view", group: "Каталог", icon: SlidersHorizontal },
    { id: "kits", get label() {
            return t("Комплектации");
        }, get description() {
            return t("Что входит в каждое блюдо");
        }, permission: "kits.view", group: "Каталог", icon: Package },
    { id: "promotions", get label() {
            return t("Акции");
        }, get description() {
            return t("Предложения для покупателей");
        }, permission: "promotions.view", group: "Каталог", icon: BadgePercent },
    { id: "analytics", get label() {
            return t("Аналитика");
        }, get description() {
            return t("Продажи и показатели бизнеса");
        }, permission: "analytics.view", group: "Управление", icon: ChartNoAxesCombined },
    { id: "cities", get label() {
            return t("Города");
        }, get description() {
            return t("Города и доступность сервиса");
        }, permission: "cities.view", group: "Управление", icon: MapPin },
    { id: "hours", get label() {
            return t("Время работы");
        }, get description() {
            return t("Расписание и условия доставки");
        }, permission: "hours.view", group: "Управление", icon: Clock3 },
    { id: "staff", get label() {
            return t("Персонал");
        }, get description() {
            return t("Сотрудники и права доступа");
        }, permission: "staff.view", group: "Управление", icon: UserCog },
    { id: "settings", get label() {
            return t("Настройки");
        }, get description() {
            return t("Параметры сервиса и интеграции");
        }, permission: "settings.view", group: "Управление", icon: Settings2 },
    { id: "profile", get label() {
            return t("Мой профиль");
        }, get description() {
            return t("Учётная запись и устройства");
        }, permission: "", group: "Аккаунт", icon: UserRound },
];
export function AdminNavigation({ active, onSelect, onLogout }: {
    active: AdminSection;
    onSelect: (section: AdminSection) => void;
    onLogout: () => void;
}) {
    useAdminLanguage();
    const { can, staff } = useAdminAccess();
    const { setOpenMobile, isMobile } = useSidebar();
    return <Sidebar variant="inset" collapsible="icon">
    <SidebarHeader><SidebarMenu><SidebarMenuItem><SidebarMenuButton size="lg" onClick={() => { onSelect(can("dashboard.view") ? "dashboard" : "orders"); setOpenMobile(false); }}>
      <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-white"><Image src="/admin/app-icon.png" alt={t("Накта суши")} width={32} height={32} style={{ width: 32, height: 32 }}/></span><span className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-medium">NAKTA</span><span className="truncate text-xs text-muted-foreground">{t("Панель управления")}</span></span>
    </SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarHeader>
    <SidebarContent>{["Работа", "Каталог", "Управление"].map(group => {
            const items = adminSections.filter(item => item.group === group && can(item.permission));
            if (!items.length)
                return null;
            return <SidebarGroup key={group}><SidebarGroupLabel>{t(group)}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{items.map(item => <SidebarMenuItem key={item.id}><SidebarMenuButton isActive={active === item.id} tooltip={item.label} onClick={() => { onSelect(item.id); setOpenMobile(false); }}><item.icon className="size-4 shrink-0" aria-hidden="true"/><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup>;
        })}</SidebarContent>
    <SidebarFooter><SidebarMenu><SidebarMenuItem><DropdownMenu>
      <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground" aria-label={t("Меню аккаунта")}/>}>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted font-medium">{staff?.name?.slice(0, 1)}</span><span className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-medium">{staff?.name}</span><span className="truncate text-xs text-muted-foreground">{staff?.role === "OWNER" ? t("Владелец") : staff?.role === "ADMIN" ? t("Администратор") : t("Менеджер")}</span></span><EllipsisVertical className="ml-auto size-4" aria-hidden="true"/>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
        <DropdownMenuGroup><DropdownMenuLabel>{staff?.name}</DropdownMenuLabel><DropdownMenuItem onClick={() => { onSelect("profile"); setOpenMobile(false); }}><UserRound className="size-4"/>{t("Мой профиль")}</DropdownMenuItem></DropdownMenuGroup><DropdownMenuSeparator />
        <DropdownMenuGroup><DropdownMenuItem onClick={onLogout}><LogOut className="size-4"/>{t("Выйти")}</DropdownMenuItem></DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu></SidebarMenuItem></SidebarMenu></SidebarFooter>
  </Sidebar>;
}
