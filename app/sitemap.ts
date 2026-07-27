import type { MetadataRoute } from "next";
import { absoluteUrl, getSeoCategories } from "./lib/seo";

export const revalidate = 3_600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getSeoCategories();

  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    ...categories.map((category) => ({
      url: absoluteUrl(`/category/${encodeURIComponent(category.slug)}`),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
