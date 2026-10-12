"use client";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { ShieldCheck, ArrowRight, KeyRound } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { adminFetch } from "./admin-api";
import type { Staff } from "./admin-access";
export function AdminLogin({onLogin,notice}:{onLogin:(token:string,staff:Staff)=>void;notice?:string}) {
 const [bootstrap,setBootstrap]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const [login,setLogin]=useState("");const [password,setPassword]=useState("");const [name,setName]=useState("");const [bootstrapToken,setBootstrapToken]=useState("");
 async function submit(event:FormEvent){event.preventDefault();setBusy(true);setError("");try {
   const result=await adminFetch<{token:string;staff:Staff}>(`/admin/auth/${bootstrap?"bootstrap":"login"}`,"",{method:"POST",body:JSON.stringify(bootstrap?{login,password,name,bootstrapToken}:{login,password})});
   onLogin(result.token,result.staff);
 }catch(e){setError(e instanceof Error?e.message:"Не удалось войти")}finally{setBusy(false)}}
 return <main className="grid min-h-dvh lg:grid-cols-2">
 <div className="relative hidden flex-col justify-between bg-muted p-12 lg:flex"><div className="flex items-center gap-3"><span className="grid size-14 place-items-center overflow-hidden rounded-xl bg-white"><Image src="/logo.webp" alt="Накта суши" width={56} height={56} style={{width:56,height:56}}/></span><span className="font-bold tracking-[.2em]">NAKTA</span></div><div className="max-w-lg"><span className="mb-6 inline-flex rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">Панель управления</span><h1 className="text-5xl font-semibold leading-[1.1] tracking-tight">Всё для работы.<br/><span className="text-muted-foreground">В одном месте.</span></h1><p className="mt-6 text-lg leading-relaxed text-muted-foreground">Заказы, команда и меню вашего ресторана — каждый день под контролем.</p></div><div className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4"/>Персональный доступ для каждого сотрудника</div></div>
 <div className="grid place-items-center px-4 py-12 sm:px-10"><Card className="w-full max-w-md border-0 shadow-none"><CardHeader><div className="mb-4 flex items-center gap-2 font-bold tracking-widest lg:hidden">NAKTA</div><CardTitle className="text-2xl">{bootstrap?"Создать владельца":"Добро пожаловать"}</CardTitle><CardDescription>{bootstrap?"Первичная настройка доступа к панели":"Войдите в свою рабочую учётную запись"}</CardDescription></CardHeader><CardContent><form id="admin-login" className="grid gap-5" onSubmit={submit}>
 {notice&&<p role="status" className="rounded-lg border bg-muted p-3 text-sm text-muted-foreground">{notice}</p>}
 {bootstrap&&<><div className="grid gap-2"><Label htmlFor="owner-name">Ваше имя</Label><Input id="owner-name" required value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></div><div className="grid gap-2"><Label htmlFor="bootstrap-key">Ключ первоначальной настройки</Label><Input id="bootstrap-key" type="password" required value={bootstrapToken} onChange={e=>setBootstrapToken(e.target.value)}/></div></>}
 <div className="grid gap-2"><Label htmlFor="admin-login-name">Логин</Label><Input id="admin-login-name" autoComplete="username" autoFocus required value={login} onChange={e=>setLogin(e.target.value)} placeholder="Ваш рабочий логин"/></div>
 <div className="grid gap-2"><Label htmlFor="admin-password">Пароль</Label><Input id="admin-password" type="password" autoComplete={bootstrap?"new-password":"current-password"} minLength={bootstrap?12:1} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Введите пароль"/></div>
 {error&&<p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
 <Button className="h-11 w-full" type="submit" disabled={busy}>{busy?"Проверяем…":bootstrap?"Создать учётную запись":"Войти"}<ArrowRight/></Button></form></CardContent><CardFooter className="flex-col gap-4"><Button variant="link" onClick={()=>{setBootstrap(!bootstrap);setError("")}}><KeyRound/>{bootstrap?"У меня уже есть учётная запись":"Первый запуск панели"}</Button><p className="text-center text-xs text-muted-foreground">Если вы забыли пароль, обратитесь к владельцу.</p></CardFooter></Card></div></main>
}
