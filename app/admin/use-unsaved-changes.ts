"use client";

import { useCallback, useEffect, useId, useState, type Dispatch, type SetStateAction } from "react";
import { confirmAdminAction } from "./AdminConfirmationDialog";

const dirtyForms = new Set<string>();

export async function confirmAdminNavigation() {
  return dirtyForms.size === 0 || await confirmAdminAction("Есть несохранённые изменения. Покинуть страницу и потерять их?", { title: "Покинуть страницу?" });
}

/** Only call after the user has approved leaving/updating in the admin dialog. */
export function reloadAdminAfterConfirmation() {
  dirtyForms.clear();
  window.location.reload();
}

export function useUnsavedChanges(dirty: boolean) {
  const id = useId();
  useEffect(() => {
    if (dirty) dirtyForms.add(id);
    else dirtyForms.delete(id);
    window.dispatchEvent(new CustomEvent("admin:dirty", { detail: dirtyForms.size > 0 }));
    const protect = (event: BeforeUnloadEvent) => {
      if (!dirtyForms.size) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protect);
    return () => {
      dirtyForms.delete(id);
      window.removeEventListener("beforeunload", protect);
      window.dispatchEvent(new CustomEvent("admin:dirty", { detail: dirtyForms.size > 0 }));
    };
  }, [dirty, id]);
}

export function useDraftEditor<T>() {
  const [snapshot, setSnapshot] = useState<{ value: T | null; original: T | null }>({ value: null, original: null });
  const dirty = snapshot.value !== null && !sameDraft(snapshot.value, snapshot.original);
  useUnsavedChanges(dirty);
  const setValue: Dispatch<SetStateAction<T | null>> = useCallback((next) => {
    setSnapshot((previous) => {
      const value = typeof next === "function" ? (next as (value: T | null) => T | null)(previous.value) : next;
      return { value, original: previous.value === null && value !== null ? value : value === null ? null : previous.original };
    });
  }, []);
  const close = useCallback(async () => {
    if (dirty && !await confirmAdminAction("Закрыть форму без сохранения изменений?", { title: "Закрыть форму?" })) return false;
    setValue(null);
    return true;
  }, [dirty, setValue]);
  return [snapshot.value, setValue, close, dirty] as const;
}

function sameDraft(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  const a = left as Record<string, unknown>;
  const b = right as Record<string, unknown>;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && sameDraft(a[key], b[key]));
}
