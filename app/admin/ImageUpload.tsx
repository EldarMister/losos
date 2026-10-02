"use client";
/* eslint-disable @next/next/no-img-element */

import { Icon } from "@mdi/react";
import { mdiDeleteOutline, mdiImagePlusOutline } from "@mdi/js";
import { ChangeEvent, useId, useState } from "react";

type ImageUploadProps = {
  label: string;
  value: string;
  hint: string;
  onChange: (value: string) => void;
  onError: (message: string) => void;
  compact?: boolean;
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
        canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
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

export function ImageUpload({ label, value, hint, onChange, onError, compact = false }: ImageUploadProps) {
  const inputId = useId();
  const [processing, setProcessing] = useState(false);

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
      <legend className="text-sm font-medium text-slate-700">{label}</legend>
      {value ? (
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <img src={value} alt="Предпросмотр загруженного изображения" className={`${compact ? "h-32" : "h-52"} w-full object-contain`} />
          <div className={`grid gap-2 border-t border-slate-200 bg-white ${compact ? "p-2" : "grid-cols-2 p-3"}`}>
            <label htmlFor={inputId} className="inline-flex min-h-10 min-w-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Icon path={mdiImagePlusOutline} size={0.72} aria-hidden="true" className="shrink-0" />
              Заменить фото
            </label>
            <button type="button" className="inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-lg border border-red-200 px-2 text-sm font-medium text-red-700 hover:bg-red-50" onClick={() => onChange("")}>
              <Icon path={mdiDeleteOutline} size={0.72} aria-hidden="true" className="shrink-0" />
              Удалить фото
            </button>
          </div>
        </div>
      ) : (
        <label htmlFor={inputId} className={`grid min-w-0 cursor-pointer place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center hover:border-blue-400 hover:bg-blue-50/40 ${compact ? "min-h-32 p-3" : "min-h-44 p-6"}`}>
          <span>
            <Icon path={mdiImagePlusOutline} size={1.35} aria-hidden="true" className="mx-auto text-slate-400" />
            <strong className="mt-3 block text-sm font-semibold text-slate-900">{processing ? "Обрабатываем изображение…" : "Загрузить фотографию"}</strong>
            <small className="mt-1 block text-xs text-slate-500">JPG, PNG или WEBP до 5 МБ</small>
          </span>
        </label>
      )}
      <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={processing} onChange={(event) => void selectFile(event)} />
      <p className="text-xs text-slate-500">{hint}</p>
      <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-700">
        Или вставьте ссылку
        <input type="url" className="h-11 min-w-0 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100" value={value.startsWith("data:") ? "" : value} placeholder="https://…" onChange={(event) => onChange(event.target.value)} />
      </label>
    </fieldset>
  );
}
