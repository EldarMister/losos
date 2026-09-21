import type { MetadataRoute } from "next";
import { absoluteUrl, getSeoCategories } from "./lib/seo";

export const revalidate = 3_600;
const lastModified = new Date("2026-09-21T00:00:00+06:00");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getSeoCategories();

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    ...[
      "/privacy",
      "/terms",
      "/delete-account",
      "/legal",
      "/support",
      "/about",
    ].map((path) => ({
      url: absoluteUrl(path),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: path === "/privacy" || path === "/terms" ? 0.6 : 0.5,
    })),
    ...categories.map((category) => ({
      url: absoluteUrl(`/category/${encodeURIComponent(category.slug)}`),
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
