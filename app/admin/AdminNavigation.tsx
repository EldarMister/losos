"use client";
import Image from "next/image";
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Layers3, SlidersHorizontal, Package, MapPin, Clock3, Users, UserCog, ChartNoAxesCombined, Settings2, BadgePercent, LogOut, UserRound, EllipsisVertical, type LucideIcon } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "./ui/sidebar";
import { useAdminAccess } from "./admin-access";
import type { AdminSection } from "./admin-types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

export const adminSections: Array<{id:AdminSection;label:string;description:string;permission:string;group:string;icon:LucideIcon}> = [
  {id:"dashboard",label:"Обзор",description:"Сегодня в вашем бизнесе",permission:"dashboard.view",group:"Работа",icon:LayoutDashboard},
  {id:"orders",label:"Заказы",description:"Приём и обработка заказов",permission:"orders.view",group:"Работа",icon:ShoppingBag},
  {id:"users",label:"Пользователи",description:"Клиенты и история заказов",permission:"customers.view",group:"Работа",icon:Users},
  {id:"menu",label:"Товары",description:"Блюда, цены и доступность",permission:"products.view",group:"Каталог",icon:UtensilsCrossed},
  {id:"categories",label:"Категории",description:"Организация меню",permission:"categories.view",group:"Каталог",icon:Layers3},
  {id:"modifiers",label:"Модификаторы",description:"Варианты выбора и дополнения",permission:"modifiers.view",group:"Каталог",icon:SlidersHorizontal},
  {id:"kits",label:"Комплектации",description:"Что входит в каждое блюдо",permission:"kits.view",group:"Каталог",icon:Package},
  {id:"promotions",label:"Акции",description:"Предложения для покупателей",permission:"promotions.view",group:"Каталог",icon:BadgePercent},
  {id:"analytics",label:"Аналитика",description:"Продажи и показатели бизнеса",permission:"analytics.view",group:"Управление",icon:ChartNoAxesCombined},
  {id:"cities",label:"Города",description:"Города и доступность сервиса",permission:"cities.view",group:"Управление",icon:MapPin},
  {id:"hours",label:"Время работы",description:"Расписание и условия доставки",permission:"hours.view",group:"Управление",icon:Clock3},
  {id:"staff",label:"Персонал",description:"Сотрудники и права доступа",permission:"staff.view",group:"Управление",icon:UserCog},
  {id:"settings",label:"Настройки",description:"Параметры сервиса и интеграции",permission:"settings.view",group:"Управление",icon:Settings2},
  {id:"profile",label:"Мой профиль",description:"Учётная запись и устройства",permission:"",group:"Аккаунт",icon:UserRound},
];
export function AdminNavigation({active,onSelect,onLogout}:{active:AdminSection;onSelect:(section:AdminSection)=>void;onLogout:()=>void}) {
  const {can,staff}=useAdminAccess(); const {setOpenMobile,isMobile}=useSidebar();
  return <Sidebar variant="inset" collapsible="icon">
    <SidebarHeader><SidebarMenu><SidebarMenuItem><SidebarMenuButton size="lg" onClick={()=>{onSelect(can("dashboard.view")?"dashboard":"orders");setOpenMobile(false)}}>
      <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-white"><Image src="/logo.webp" alt="Накта суши" width={32} height={32} style={{width:32,height:32}}/></span><span className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-medium">NAKTA</span><span className="truncate text-xs text-muted-foreground">Панель управления</span></span>
    </SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarHeader>
    <SidebarContent>{["Работа","Каталог","Управление"].map(group=>{
      const items=adminSections.filter(item=>item.group===group&&can(item.permission)); if(!items.length)return null;
      return <SidebarGroup key={group}><SidebarGroupLabel>{group}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{items.map(item=><SidebarMenuItem key={item.id}><SidebarMenuButton isActive={active===item.id} tooltip={item.label} onClick={()=>{onSelect(item.id);setOpenMobile(false)}}><item.icon className="size-4 shrink-0" aria-hidden="true"/><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup>
    })}</SidebarContent>
    <SidebarFooter><SidebarMenu><SidebarMenuItem><DropdownMenu>
      <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground" aria-label="Меню аккаунта"/>}>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted font-medium">{staff?.name?.slice(0,1)}</span><span className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-medium">{staff?.name}</span><span className="truncate text-xs text-muted-foreground">{staff?.role==="OWNER"?"Владелец":staff?.role==="ADMIN"?"Администратор":"Менеджер"}</span></span><EllipsisVertical className="ml-auto size-4" aria-hidden="true"/>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 rounded-lg" side={isMobile?"bottom":"right"} align="end" sideOffset={4}>
        <DropdownMenuGroup><DropdownMenuLabel>{staff?.name}</DropdownMenuLabel><DropdownMenuItem onClick={()=>{onSelect("profile");setOpenMobile(false)}}><UserRound className="size-4"/>Мой профиль</DropdownMenuItem></DropdownMenuGroup><DropdownMenuSeparator/>
        <DropdownMenuGroup><DropdownMenuItem onClick={onLogout}><LogOut className="size-4"/>Выйти</DropdownMenuItem></DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu></SidebarMenuItem></SidebarMenu></SidebarFooter>
  </Sidebar>
}
