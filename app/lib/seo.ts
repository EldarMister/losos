const FALLBACK_SITE_URL = "https://naktasushi.com";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

export type SeoCategory = {
  slug: string;
  title: string;
  sortOrder: number;
};

const fallbackCategories: SeoCategory[] = [
  { slug: "novinki", title: "Новинки", sortOrder: 0 },
  { slug: "hity-prodaz-2", title: "Хиты продаж", sortOrder: 1 },
  { slug: "kombo", title: "Комбо", sortOrder: 2 },
  { slug: "rolly-2", title: "Роллы", sortOrder: 3 },
  { slug: "saurolly-3", title: "Шауроллы", sortOrder: 4 },
  { slug: "tempura-i-zapecennye-rolly-3", title: "Темпура и запеченные роллы", sortOrder: 5 },
  { slug: "susi-i-sasimi-2", title: "Суши и сашими", sortOrder: 6 },
  { slug: "sety-2", title: "Сеты", sortOrder: 7 },
  { slug: "tempurnye-i-zapecennye-sety-2", title: "Темпурные и запеченные сеты", sortOrder: 8 },
  { slug: "poke-2", title: "Поке", sortOrder: 9 },
  { slug: "zakuski-4", title: "Закуски", sortOrder: 10 },
  { slug: "salaty-3", title: "Салаты", sortOrder: 11 },
  { slug: "supy-3", title: "Супы", sortOrder: 12 },
  { slug: "goracie-bluda", title: "Горячие блюда", sortOrder: 13 },
  { slug: "dla-kotika-2", title: "Для котика", sortOrder: 14 },
  { slug: "toppingi-9", title: "Топпинги", sortOrder: 15 },
  { slug: "napitki-4", title: "Напитки", sortOrder: 16 },
];

const withProtocol = (value: string) => (
  /^https?:\/\//i.test(value) ? value : `https://${value}`
);

export const getSiteUrl = () => {
  const configuredUrl =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.RAILWAY_PUBLIC_DOMAIN ||
    FALLBACK_SITE_URL;

  try {
    const url = new URL(withProtocol(configuredUrl.trim()));
    if (!LOCAL_HOSTNAMES.has(url.hostname) && url.protocol === "http:") {
      url.protocol = "https:";
    }
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }
};

export const absoluteUrl = (path: string) => new URL(path, getSiteUrl()).toString();

const getCatalogApiUrl = () => (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:4000/api"
    : "https://losos-production.up.railway.app/api")
).replace(/\/$/, "");

const parseCategories = (value: unknown): SeoCategory[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.slug !== "string" || typeof candidate.title !== "string") return [];

    const slug = candidate.slug.trim();
    const title = candidate.title.trim();
    if (!slug || !title) return [];

    return [{
      slug,
      title,
      sortOrder: typeof candidate.sortOrder === "number" ? candidate.sortOrder : index,
    }];
  });
};

export const getSeoCategories = cache(async (): Promise<SeoCategory[]> => {
  const requests = ["bishkek", "osh"].map(async (region) => {
    const response = await fetch(`${getCatalogApiUrl()}/categories?region=${region}`, {
      next: { revalidate: 3_600 },
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
    return parseCategories(await response.json());
  });

  const results = await Promise.allSettled(requests);
  const uniqueCategories = new Map<string, SeoCategory>();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const category of result.value) {
      const current = uniqueCategories.get(category.slug);
      if (!current || category.sortOrder < current.sortOrder) {
        uniqueCategories.set(category.slug, category);
      }
    }
  }

  return (uniqueCategories.size ? [...uniqueCategories.values()] : fallbackCategories)
    .sort((left, right) => left.sortOrder - right.sortOrder);
});

export const getSeoCategory = async (slug: string) => {
  const categories = await getSeoCategories();
  return categories.find((category) => category.slug === slug) ?? null;
};
import { cache } from "react";
