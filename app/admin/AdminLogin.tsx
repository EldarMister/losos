"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { adminFetch } from "./admin-api";
import type { Staff } from "./admin-access";

export function AdminLogin({ onLogin, notice }: { onLogin: (token: string, staff: Staff) => void; notice?: string }) {
  const [bootstrap, setBootstrap] = useState(false);
  const [setupAvailable, setSetupAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [bootstrapToken, setBootstrapToken] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void adminFetch<{ available: boolean }>("/admin/auth/bootstrap-status", "", { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setSetupAvailable(result.available); })
      .catch(() => { /* Normal login remains available if setup status cannot be checked. */ });
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await adminFetch<{ token: string; staff: Staff }>(`/admin/auth/${bootstrap ? "bootstrap" : "login"}`, "", {
        method: "POST",
        body: JSON.stringify(bootstrap ? { login, password, name, bootstrapToken } : { login, password }),
      });
      onLogin(result.token, result.staff);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось войти");
    } finally {
      setBusy(false);
    }
  }

  return <main className="flex min-h-dvh flex-col items-center justify-center bg-muted p-6 md:p-10">
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex items-center gap-2 self-center font-medium">
        <Image src="/admin/app-icon.png" alt="Накта суши" width={36} height={36} style={{ width: 36, height: 36 }} />
        <span>NAKTA</span>
      </div>
      <Card>
        <CardHeader className="pb-2 text-center">
          <CardTitle className="text-xl">{bootstrap ? "Создать первого владельца" : "Вход в панель"}</CardTitle>
          {bootstrap && <CardDescription>Создайте учётную запись владельца для начала работы.</CardDescription>}
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submit}>
            {notice && <p role="status" className="rounded-lg border bg-muted p-3 text-sm text-muted-foreground">{notice}</p>}
            <fieldset disabled={busy} className="grid min-w-0 gap-4">
              {bootstrap && <>
                <div className="grid gap-2"><Label htmlFor="owner-name">Имя</Label><Input id="owner-name" required maxLength={120} value={name} onChange={event => setName(event.target.value)} autoComplete="name" /></div>
                <div className="grid gap-2"><Label htmlFor="bootstrap-key">Ключ настройки</Label><Input id="bootstrap-key" type="password" required value={bootstrapToken} onChange={event => setBootstrapToken(event.target.value)} autoComplete="off" /></div>
              </>}
              <div className="grid gap-2"><Label htmlFor="admin-login-name">Логин</Label><Input id="admin-login-name" autoComplete="username" autoFocus required value={login} onChange={event => setLogin(event.target.value)} /></div>
              <div className="grid gap-2"><Label htmlFor="admin-password">Пароль</Label><Input id="admin-password" type="password" autoComplete={bootstrap ? "new-password" : "current-password"} minLength={bootstrap ? 12 : 1} required value={password} onChange={event => setPassword(event.target.value)} /></div>
              {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
              <Button className="h-10 w-full" type="submit">{busy ? "Проверяем…" : bootstrap ? "Создать владельца" : "Войти"}</Button>
            </fieldset>
          </form>
        </CardContent>
        {(bootstrap || setupAvailable) && <CardFooter>
          <Button type="button" variant="link" disabled={busy} className="w-full" onClick={() => { setBootstrap(!bootstrap); setError(""); }}>
            {bootstrap && <ArrowLeft className="size-4" aria-hidden="true" />}
            {bootstrap ? "Вернуться ко входу" : "Создать первого владельца"}
          </Button>
        </CardFooter>}
      </Card>
    </div>
  </main>;
}
