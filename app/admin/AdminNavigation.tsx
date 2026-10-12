"use client";
import Image from "next/image";
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Layers3, SlidersHorizontal, Package, MapPin, Clock3, Users, UserCog, ChartNoAxesCombined, Settings2, BadgePercent, LogOut, UserRound, type LucideIcon } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "./ui/sidebar";
import { useAdminAccess } from "./admin-access";
import type { AdminSection } from "./admin-types";
import { Button } from "./ui/button";

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
  const {can,staff}=useAdminAccess(); const {setOpenMobile}=useSidebar();
  return <Sidebar variant="inset" collapsible="icon">
    <SidebarHeader><SidebarMenu><SidebarMenuItem><SidebarMenuButton size="lg" onClick={()=>{onSelect(can("dashboard.view")?"dashboard":"orders");setOpenMobile(false)}}>
      <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white"><Image src="/logo.webp" alt="Накта суши" width={36} height={36} style={{width:36,height:36}}/></span><span className="text-base font-semibold tracking-widest">NAKTA</span>
    </SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarHeader>
    <SidebarContent>{["Работа","Каталог","Управление"].map(group=>{
      const items=adminSections.filter(item=>item.group===group&&can(item.permission)); if(!items.length)return null;
      return <SidebarGroup key={group}><SidebarGroupLabel>{group}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{items.map(item=><SidebarMenuItem key={item.id}><SidebarMenuButton isActive={active===item.id} tooltip={item.label} onClick={()=>{onSelect(item.id);setOpenMobile(false)}}><item.icon className="size-4 shrink-0" aria-hidden="true"/><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup>
    })}</SidebarContent>
    <SidebarFooter><SidebarMenu><SidebarMenuItem><div className="flex min-w-0 items-center gap-1"><SidebarMenuButton size="lg" isActive={active==="profile"} onClick={()=>{onSelect("profile");setOpenMobile(false)}}><span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted font-semibold">{staff?.name?.slice(0,1)}</span><span className="grid min-w-0"><strong className="truncate text-sm">{staff?.name}</strong><span className="text-xs text-muted-foreground">{staff?.role==="OWNER"?"Владелец":staff?.role==="ADMIN"?"Администратор":"Менеджер"}</span></span></SidebarMenuButton><Button variant="ghost" size="icon" onClick={onLogout} title="Выйти" className="group-data-[collapsible=icon]:hidden"><LogOut className="size-4" aria-hidden="true"/><span className="sr-only">Выйти</span></Button></div></SidebarMenuItem></SidebarMenu></SidebarFooter>
  </Sidebar>
}
