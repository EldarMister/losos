"use client";
import { translateAdmin as t } from "./i18n/store";
import { useAdminLanguage } from "./i18n/react";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { adminSections } from "./AdminNavigation";
import { useAdminAccess } from "./admin-access";
import type { AdminSection } from "./admin-types";
import { Button } from "./ui/button";
import { Kbd } from "./ui/kbd";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
export function AdminCommandSearch({ onSelect }: {
    onSelect: (section: AdminSection) => void;
}) {
    useAdminLanguage();
    const [open, setOpen] = useState(false);
    const { can } = useAdminAccess();
    useEffect(() => {
        const down = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                setOpen(previous => !previous);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);
    return <>
    <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-label={t("Поиск раздела")} className="relative w-full min-w-0 justify-start px-2.5 text-muted-foreground sm:pr-12">
      <Search data-icon="inline-start" className="size-4 shrink-0" aria-hidden="true"/><span className="truncate">{t("Поиск раздела\u2026")}</span><Kbd className="absolute top-1/2 right-1.5 hidden -translate-y-1/2 sm:inline-flex">Ctrl K</Kbd>
    </Button>
    <CommandDialog open={open} onOpenChange={setOpen} title={t("Поиск раздела")} description={t("Введите название и выберите раздел")}>
      <Command><CommandInput placeholder={t("Найти раздел\u2026")}/><CommandList><CommandEmpty>{t("Раздел не найден.")}</CommandEmpty>
        {["Работа", "Каталог", "Управление", "Аккаунт"].map(group => {
            const items = adminSections.filter(item => item.group === group && can(item.permission));
            if (!items.length)
                return null;
            return <CommandGroup heading={t(group)} key={group}>{items.map(item => <CommandItem key={item.id} value={`${item.label} ${item.description}`} onSelect={() => { setOpen(false); onSelect(item.id); }}><item.icon className="size-4" aria-hidden="true"/>{item.label}</CommandItem>)}</CommandGroup>;
        })}
      </CommandList></Command>
    </CommandDialog>
  </>;
}
