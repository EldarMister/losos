"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Moon, Sun, MapPin, ChevronRight, RefreshCw, ShieldAlert } from "lucide-react";
import { AdminNavigation,adminSections } from "./AdminNavigation";
import { AdminLogin } from "./AdminLogin";
import { AdminAccessContext, type Staff } from "./admin-access";
import { adminFetch,adminApiUrl } from "./admin-api";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Card,CardContent } from "./ui/card";
import { AnalyticsView } from "./AnalyticsView";
import { CategoriesView } from "./CategoriesView";
import { MenuWorkspace } from "./MenuWorkspace";
import OrdersWorkspace from "./OrdersWorkspace";
import { PromotionsWorkspace } from "./PromotionsWorkspace";
import { SettingsWorkspace } from "./SettingsWorkspace";
import { UsersWorkspace } from "./UsersWorkspace";
import { ProfileView } from "./ProfileView";
import { StaffWorkspace } from "./StaffWorkspace";
import { OverviewView } from "./OverviewView";
import { AdminNotifications,disconnectAdminDevice } from "./components/AdminNotifications";
import { confirmAdminNavigation } from "./use-unsaved-changes";
import type { AdminRequest,AdminSection,Region } from "./admin-types";

type Notice={message:string;tone:"success"|"error"};
const sessionKey="nakta-admin-session";
export function AdminApp(){
 const [hydrated,setHydrated]=useState(false);const [token,setToken]=useState("");const [staff,setStaff]=useState<Staff|null>(null);
 const [section,setSection]=useState<AdminSection>("orders");const [regions,setRegions]=useState<Region[]>([]);const [region,setRegion]=useState("bishkek");
 const [notice,setNotice]=useState<Notice|null>(null);const [dark,setDark]=useState(false);const [authError,setAuthError]=useState("");
 const [loginNotice,setLoginNotice]=useState("");
 const [refresh,setRefresh]=useState(0);const tokenRef=useRef(token);
 const can=useCallback((permission:string)=>!permission||!!staff&&(staff.role==="OWNER"||staff.effectivePermissions.includes(permission)),[staff]);
 const onNotice=useCallback((message:string,tone:"success"|"error"="success")=>setNotice({message,tone}),[]);
 const clearSession=useCallback(()=>{tokenRef.current="";try{sessionStorage.removeItem(sessionKey);sessionStorage.removeItem("losos-admin-token")}catch{/* Local UI must still clear when browser storage is unavailable. */}setToken("");setStaff(null);setRegions([]);setNotice(null);setAuthError("");window.dispatchEvent(new Event("admin:logout"));},[]);
 const refreshAuth=useCallback(async()=>{
   const activeToken=tokenRef.current;if(!activeToken)return;
   try{const next=await adminFetch<Staff>("/admin/auth/me",activeToken);if(tokenRef.current===activeToken){setStaff(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next);setAuthError("")}}
   catch(e){if(tokenRef.current!==activeToken)return;if((e as {status?:number}).status===401)clearSession();else setAuthError(e instanceof Error?e.message:"Не удалось проверить доступ")}
 },[clearSession]);
 const request=useCallback(async<T,>(path:string,init?:RequestInit):Promise<T>=>{
   try{return await adminFetch<T>(path,token,init)}catch(e){if(tokenRef.current===token){const status=(e as {status?:number}).status;if(status===401)clearSession();if(status===403){void refreshAuth();onNotice("Доступ к этому действию закрыт. Права обновляются.","error")}}throw e}
 },[token,clearSession,refreshAuth,onNotice]);
 useEffect(()=>{queueMicrotask(()=>{const initialToken=sessionStorage.getItem(sessionKey)||"";tokenRef.current=initialToken;setToken(initialToken);setDark(localStorage.getItem("nakta-admin-theme")==="dark");const next=new URLSearchParams(window.location.search).get("section");if(adminSections.some(s=>s.id===next))setSection(next as AdminSection);else if(new URLSearchParams(window.location.search).has("order"))setSection("orders");setHydrated(true)})},[]);
 useEffect(()=>{if(!token)return;const id=window.setTimeout(()=>void refreshAuth(),0);const timer=window.setInterval(()=>void refreshAuth(),15000);const focus=()=>void refreshAuth();window.addEventListener("focus",focus);return()=>{clearTimeout(id);clearInterval(timer);window.removeEventListener("focus",focus)}},[token,refreshAuth]);
 useEffect(()=>{document.documentElement.classList.toggle("dark",dark);return()=>document.documentElement.classList.remove("dark")},[dark]);
 useEffect(()=>{if(!token||!staff)return;let active=true;const task=setTimeout(()=>void request<Region[]>("/admin/settings").then(items=>{if(!active||tokenRef.current!==token)return;setRegions(items);setRegion(current=>items.some(i=>i.slug===current)?current:items[0]?.slug||"bishkek")}).catch(e=>{if(active&&tokenRef.current===token)onNotice(e instanceof Error?e.message:"Не удалось загрузить города","error")}),0);return()=>{active=false;clearTimeout(task)}},[request,token,staff,onNotice]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(null),6000);return()=>clearTimeout(timer)},[notice]);
 useEffect(()=>{if(!token)return;const refreshRegions=()=>{void request<Region[]>("/admin/settings").then(items=>{if(tokenRef.current===token)setRegions(items)}).catch(e=>{if(tokenRef.current===token)onNotice(e instanceof Error?e.message:"Не удалось обновить города","error")})};window.addEventListener("admin:regions-changed",refreshRegions);return()=>window.removeEventListener("admin:regions-changed",refreshRegions)},[request,token,onNotice]);
 const allowed=adminSections.find(s=>s.id===section);const hasAccess=allowed&&can(allowed.permission);
 const selectSection=(next:AdminSection)=>{if(!confirmAdminNavigation())return;setSection(next);const url=new URL(window.location.href);url.searchParams.set("section",next);url.searchParams.delete("order");window.history.pushState({},"",url)};
 useEffect(()=>{const pop=()=>{const next=new URLSearchParams(window.location.search).get("section");if(adminSections.some(s=>s.id===next)&&confirmAdminNavigation())setSection(next as AdminSection)};window.addEventListener("popstate",pop);return()=>window.removeEventListener("popstate",pop)},[]);
 const login=(nextToken:string,nextStaff:Staff)=>{sessionStorage.setItem(sessionKey,nextToken);tokenRef.current=nextToken;setToken(nextToken);setStaff(nextStaff);setAuthError("");setLoginNotice("");const query=new URLSearchParams(window.location.search);if(query.has("order"))setSection("orders");else if(!query.has("section")){setSection(nextStaff.role==="MANAGER"?"orders":"dashboard")}};
 const logout=async()=>{
   if(!confirmAdminNavigation())return;
   const activeToken=tokenRef.current;if(!activeToken)return;
   const controller=new AbortController();const timeout=window.setTimeout(()=>controller.abort(),5000);
   const revoked=adminFetch("/admin/auth/logout",activeToken,{method:"POST",keepalive:true,signal:controller.signal}).then(()=>true).catch(()=>false).finally(()=>clearTimeout(timeout));
   const disconnected=disconnectAdminDevice(adminApiUrl,activeToken).catch(()=>undefined);
   clearSession();setLoginNotice("Вы вышли на этом устройстве. Завершаем сеанс на сервере…");
   const [serverRevoked]=await Promise.all([revoked,disconnected]);
   if(!tokenRef.current)setLoginNotice(serverRevoked?"Вы вышли из панели. Серверный сеанс завершён.":"Вы вышли на этом устройстве. Сервер недоступен: завершение серверного сеанса не подтверждено.");
 };
 const access=useMemo(()=>({staff,can}),[staff,can]);
 if(!hydrated)return <div className="admin-root min-h-dvh" role="status" aria-label="Загрузка панели"/>;
 if(!token)return <div className={`admin-root ${dark?"dark":""}`}><AdminLogin onLogin={login} notice={loginNotice}/></div>;
 if(!staff)return <div className={`admin-root grid min-h-dvh place-items-center p-6 ${dark?"dark":""}`}><Card><CardContent className="grid gap-4 p-6"><p>{authError||"Проверяем доступ…"}</p>{authError&&<><Button onClick={()=>void refreshAuth()}>Повторить</Button><Button variant="outline" onClick={clearSession}>Вернуться ко входу</Button></>}</CardContent></Card></div>;
 const viewProps={region,request:request as AdminRequest,onNotice};
 return <AdminAccessContext.Provider value={access}><div className={`admin-root ${dark?"dark":""}`}><SidebarProvider className="min-h-dvh" style={{"--sidebar-width":"16rem","--header-height":"4rem"} as React.CSSProperties}>
 <AdminNavigation active={section} onSelect={selectSection} onLogout={()=>void logout()}/><SidebarInset>
 <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center gap-3 border-b bg-background/95 px-4 backdrop-blur lg:px-6"><SidebarTrigger aria-label="Переключить меню"/><Separator orientation="vertical" className="h-4"/><div className="flex min-w-0 flex-1 items-center gap-2 text-sm"><span className="hidden text-muted-foreground sm:inline">Панель управления</span><ChevronRight className="hidden size-3 text-muted-foreground sm:block"/><span className="truncate font-medium">{allowed?.label}</span></div><Button variant="ghost" size="icon" aria-label={dark?"Светлая тема":"Тёмная тема"} onClick={()=>{setDark(!dark);localStorage.setItem("nakta-admin-theme",!dark?"dark":"light")}}>{dark?<Sun/>:<Moon/>}</Button>{regions.length>0&&<label className="flex max-w-[180px] items-center gap-2 rounded-lg border px-2 py-1.5 text-sm"><MapPin className="size-4 shrink-0 text-muted-foreground"/><span className="sr-only">Город</span><select aria-label="Город" className="min-w-0 bg-transparent outline-none" value={region} onChange={e=>{if(confirmAdminNavigation())setRegion(e.target.value)}}>{regions.map(item=><option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>}</header>
 <div className="border-b px-4 py-2 lg:px-6"><AdminNotifications staffId={staff.id} token={token} apiUrl={adminApiUrl} canViewOrders={can("orders.view")} onOrdersChanged={()=>setRefresh(v=>v+1)} onAccessRevoked={()=>void refreshAuth()} onOpenOrder={id=>{setSection("orders");const url=new URL(window.location.href);url.searchParams.set("section","orders");url.searchParams.set("order",id);window.history.pushState({},"",url);window.dispatchEvent(new CustomEvent("admin:open-order",{detail:{id}}))}}/></div>
 {authError&&<div className="mx-4 mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{authError}</div>}
 <section aria-label="Рабочая область" className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 p-4 md:p-6 lg:p-8">{["dashboard","analytics","staff","profile"].includes(section)&&<div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{allowed?.label}</h1><p className="mt-1 text-sm text-muted-foreground">{allowed?.description}</p></div><span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"long",timeZone:"Asia/Bishkek"}).format(new Date())}</span></div>}
 <div className="admin-page-enter" key={`${section}:${region}:${staff.effectivePermissions.join(",")}`}>
 {!hasAccess?<Card><CardContent className="grid justify-items-start gap-4 p-8"><ShieldAlert className="size-8 text-muted-foreground"/><h2 className="text-lg font-semibold">Нет доступа к разделу</h2><p className="text-sm text-muted-foreground">Обратитесь к владельцу, если этот раздел нужен для работы.</p><Button onClick={()=>selectSection(adminSections.find(s=>can(s.permission))?.id||"profile")}>Открыть доступный раздел</Button></CardContent></Card>:<>
 {section==="dashboard"&&<OverviewView {...viewProps} refresh={refresh} onSelect={selectSection}/>}
 {section==="orders"&&<OrdersWorkspace {...viewProps}/>}
 {section==="analytics"&&<AnalyticsView {...viewProps}/>}
 {(section==="menu"||section==="modifiers"||section==="kits")&&<MenuWorkspace {...viewProps} mode={section==="menu"?"products":section}/>}
 {section==="categories"&&<CategoriesView {...viewProps}/>}
 {section==="users"&&<UsersWorkspace {...viewProps}/>}
 {section==="promotions"&&<PromotionsWorkspace {...viewProps}/>}
 {(section==="settings"||section==="cities"||section==="hours")&&<SettingsWorkspace {...viewProps} initialTab={section==="cities"?"cities":section==="hours"?"hours":"basic"} regions={regions} onRegionUpdated={updated=>setRegions(items=>items.map(item=>item.id===updated.id?{...item,...updated}:item))} onSelectRegion={setRegion}/>}
 {section==="staff"&&<StaffWorkspace request={request} onNotice={onNotice} onAccessChanged={()=>void refreshAuth()}/>}
 {section==="profile"&&<ProfileView request={request} onNotice={onNotice}/>}
 </>}
 </div></section><footer className="flex items-center justify-between gap-3 border-t px-6 py-4 text-xs text-muted-foreground"><span>NAKTA · Панель управления</span><Button variant="ghost" size="xs" onClick={()=>{if(confirmAdminNavigation())window.location.reload()}}><RefreshCw className="size-3"/>Обновить</Button></footer>
 </SidebarInset></SidebarProvider>{notice&&<div className={`fixed right-4 bottom-4 left-4 z-[100] rounded-xl border bg-popover p-4 text-sm shadow-lg sm:left-auto sm:max-w-md ${notice.tone==="error"?"text-destructive":"text-foreground"}`} role={notice.tone==="error"?"alert":"status"}>{notice.message}</div>}</div></AdminAccessContext.Provider>
}
