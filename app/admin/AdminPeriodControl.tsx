"use client";

import { useId, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { ru } from "react-day-picker/locale";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { businessToday, presetPeriod, selectPeriodDate, type AdminPeriod, type AdminPeriodPreset } from "./admin-period";

const presets: { value: AdminPeriodPreset; label: string }[] = [
  { value: "today", label: "Сегодня" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "all", label: "За всё время" },
  { value: "custom", label: "Период" },
];
const calendarDate = (value: string) => new Date(`${value}T12:00:00`);
const dateValue = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
const dateLabel = (value: string) => value.split("-").reverse().join(".");

export function AdminPeriodControl({ value, onChange, allowAll = true, maxDays }: {
  value: AdminPeriod;
  onChange: (period: AdminPeriod) => void;
  allowAll?: boolean;
  maxDays?: number;
}) {
  const id = useId();
  const [openDate, setOpenDate] = useState<"from" | "to" | null>(null);
  return (
    <div className="min-w-0 space-y-3">
      <div role="group" aria-label="Период" className={`grid ${allowAll ? "grid-cols-3" : "grid-cols-2"} gap-1 rounded-lg bg-muted/50 p-1 sm:flex sm:flex-wrap`}>
        {presets.filter(preset => allowAll || preset.value !== "all").map(preset => (
          <Button key={preset.value} type="button" size="sm" variant={value.preset === preset.value ? "secondary" : "ghost"}
            className={`min-w-0 px-2 sm:px-3 ${value.preset === preset.value ? "shadow-sm" : "text-muted-foreground"}`}
            aria-pressed={value.preset === preset.value}
            aria-expanded={preset.value === "custom" ? value.preset === "custom" : undefined}
            aria-controls={preset.value === "custom" ? id : undefined}
            onClick={() => {
              setOpenDate(null);
              onChange(preset.value === "custom"
                ? { preset: "custom", from: value.from || businessToday(), to: value.to || businessToday() }
                : presetPeriod(preset.value));
            }}>{preset.label}</Button>
        ))}
      </div>
      {value.preset === "custom" && (
        <div id={id} className="grid grid-cols-2 gap-2 sm:flex" aria-label="Выбор дат">
          {(["from", "to"] as const).map(field => {
            const label = field === "from" ? "С даты" : "По дату";
            return <Popover key={field} open={openDate === field} onOpenChange={open => setOpenDate(open ? field : null)}>
              <PopoverTrigger render={<Button type="button" variant="outline" className="w-full justify-between gap-2 font-normal sm:w-44" />} aria-label={`${label}: ${dateLabel(value[field])}`}>
                <span className="min-w-0 truncate"><span className="mr-1.5 text-muted-foreground">{field === "from" ? "С" : "По"}</span>{dateLabel(value[field])}</span>
                <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0" aria-label={label}>
                <Calendar mode="single" autoFocus locale={ru} selected={calendarDate(value[field])} defaultMonth={calendarDate(value[field])}
                  className="[--cell-size:--spacing(9)]"
                  onSelect={date => {
                    if (!date) return;
                    onChange(selectPeriodDate(value, field, dateValue(date), maxDays));
                    setOpenDate(null);
                  }} />
              </PopoverContent>
            </Popover>;
          })}
        </div>
      )}
    </div>
  );
}
