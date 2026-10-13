"use client";
import { translateAdmin as t } from "./i18n/store";
import { useAdminLanguage } from "./i18n/react";

import { FormEvent, useState } from "react";
import { useUnsavedChanges } from "./use-unsaved-changes";
import { useAdminAccess } from "./admin-access";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import type { AdminRequest } from "./admin-types";
export function ProfileView({ request, onNotice }: {
    request: AdminRequest;
    onNotice: (message: string, tone?: "success" | "error") => void;
}) {
    useAdminLanguage();
    const { staff } = useAdminAccess();
    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");
    const [saving, setSaving] = useState(false);
    // Password managers may fill the current password without editing the profile.
    useUnsavedChanges(Boolean(password));
    async function save(e: FormEvent) { e.preventDefault(); setSaving(true); try {
        await request("/admin/auth/password", { method: "PATCH", body: JSON.stringify({ currentPassword, password }) });
        setPassword("");
        setCurrentPassword("");
        onNotice(t("Пароль изменён. Другие сеансы завершены."));
    }
    catch (e) {
        onNotice(e instanceof Error ? e.message : t("Не удалось изменить пароль"), "error");
    }
    finally {
        setSaving(false);
    } }
    return <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>{t("Учётная запись")}</CardTitle><CardDescription>{t("Ваш персональный доступ")}</CardDescription></CardHeader><CardContent><dl className="grid gap-4 text-sm"><div><dt className="text-muted-foreground">{t("Имя")}</dt><dd className="mt-1 font-medium">{staff?.name}</dd></div><div><dt className="text-muted-foreground">{t("Логин")}</dt><dd className="mt-1 font-medium">{staff?.login}</dd></div><div><dt className="text-muted-foreground">{t("Роль")}</dt><dd className="mt-1 font-medium">{staff?.role === "OWNER" ? t("Владелец") : staff?.role === "ADMIN" ? t("Администратор") : t("Менеджер")}</dd></div></dl></CardContent></Card><Card><CardHeader><CardTitle>{t("Изменить пароль")}</CardTitle><CardDescription>{t("Не менее 12 символов")}</CardDescription></CardHeader><CardContent><form className="grid gap-4" onSubmit={save}><Label htmlFor="current-password">{t("Текущий пароль")}</Label><Input id="current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}/><Label htmlFor="new-password">{t("Новый пароль")}</Label><Input id="new-password" type="password" autoComplete="new-password" required minLength={12} value={password} onChange={e => setPassword(e.target.value)}/><Button type="submit" disabled={saving}>{saving ? t("Сохраняем\u2026") : t("Сохранить пароль")}</Button></form></CardContent></Card></div>;
}
