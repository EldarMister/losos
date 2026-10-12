export const adminApiUrl = (process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "development" ? "http://localhost:4000/api" : "https://losos-production.up.railway.app/api")).replace(/\/$/, "");

export async function adminFetch<T>(path: string, token = "", init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${adminApiUrl}${path}`, { ...init, cache: "no-store", headers: { ...(init?.body ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...init?.headers } });
  } catch { throw new Error("Нет соединения с сервером. Изменения не сохранены."); }
  const content = await response.text();
  let payload: unknown;
  try { payload = content ? JSON.parse(content) : undefined; } catch { throw new Error("Сервер вернул неожиданный ответ. Повторите запрос."); }
  if (!response.ok) {
    const message = (payload as { message?: string | string[] })?.message;
    const error = new Error(Array.isArray(message) ? message.join(". ") : message || "Не удалось выполнить запрос") as Error & { status: number };
    error.status = response.status;
    throw error;
  }
  return payload as T;
}
