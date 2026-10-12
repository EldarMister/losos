"use client";
/* eslint-disable @next/next/no-img-element */

import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

import { ChangeEvent, useId, useRef, useState } from "react";

type ImageUploadProps = {
  label: string;
  value: string;
  fallbackValue?: string;
  hint: string;
  onChange: (value: string) => void;
  onError: (message: string) => void;
  compact?: boolean;
  onRemove?: () => void;
};

function optimizeImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("Файл больше 5 МБ"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать изображение"));
    reader.onload = () => {
      const source = new Image();
      source.onerror = () => reject(new Error("Выбранный файл не является изображением"));
      source.onload = () => {
        const scale = Math.min(1, 1400 / Math.max(source.width, source.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(source.width * scale));
        canvas.height = Math.max(1, Math.round(source.height * scale));
        const context = canvas.getContext("2d");
        if (!context) { reject(new Error("Браузер не смог обработать изображение")); return; }
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
        const result = canvas.toDataURL("image/webp", 0.78);
        if (result.length > 1_950_000) {
          reject(new Error("Изображение получилось слишком большим. Выберите файл меньшего размера"));
          return;
        }
        resolve(result);
      };
      source.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({ label, value, fallbackValue = "", hint, onChange, onError, compact = false, onRemove }: ImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const previewValue = value || fallbackValue;

  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setProcessing(true);
    try {
      onChange(await optimizeImage(file));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Не удалось обработать изображение");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <fieldset className="grid min-w-0 w-full content-start gap-3">
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      {previewValue ? (
        <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-muted/50">
          <img src={previewValue} alt={`Предпросмотр: ${label}`} className={`${compact ? "h-32" : "h-52"} w-full object-contain`} />
          <div className={`grid gap-2 border-t border-border bg-card ${compact ? "p-2" : `${value || onRemove ? "sm:grid-cols-2 " : ""}p-3`}`}>
            <Button type="button" variant="outline" disabled={processing} onClick={() => inputRef.current?.click()}>
              <ImagePlus className="size-4 shrink-0 " aria-hidden="true" />
              Заменить фото
            </Button>
            {value || onRemove ? <Button variant="destructive" type="button" disabled={processing} onClick={() => onRemove ? onRemove() : onChange("")}>
              <Trash2 className="size-4 shrink-0 " aria-hidden="true" />
              Удалить фото
            </Button> : null}
          </div>
        </div>
      ) : (
        <Label htmlFor={inputId} className={`grid min-w-0 cursor-pointer place-items-center rounded-xl border border-dashed border-input bg-muted/50 text-center hover:border-primary hover:bg-primary/5 ${compact ? "min-h-32 p-3" : "min-h-44 p-6"}`}>
          <span>
            <ImagePlus className="size-7 shrink-0 mx-auto text-muted-foreground" aria-hidden="true" />
            <strong className="mt-3 block text-sm font-semibold text-foreground">{processing ? "Обрабатываем изображение…" : "Загрузить фотографию"}</strong>
            <small className="mt-1 block text-xs text-muted-foreground">JPG, PNG или WEBP до 5 МБ</small>
          </span>
        </Label>
      )}
      <input ref={inputRef} id={inputId} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={processing} onChange={(event) => void selectFile(event)} />
      <p className="text-xs text-muted-foreground">{hint}</p>
      <details className="min-w-0"><summary className="cursor-pointer text-xs text-muted-foreground">Изображение по ссылке</summary><Label className="mt-3 grid min-w-0 gap-1.5 text-sm font-medium text-foreground">
        Ссылка на изображение
        <Input type="url" className="min-w-0 w-full" value={value.startsWith("data:") ? "" : value} placeholder="https://…" onChange={(event) => onChange(event.target.value)} />
      </Label></details>
    </fieldset>
  );
}
