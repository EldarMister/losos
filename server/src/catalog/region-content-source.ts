export type RegionContentSourceField =
  | "menuSourceRegionSlug"
  | "promotionSourceRegionSlug";

export type RegionContentSource = {
  slug: string;
  menuSourceRegionSlug?: string | null;
  promotionSourceRegionSlug?: string | null;
};

export function regionContentSourceSlug(
  region: RegionContentSource,
  field: RegionContentSourceField,
) {
  const sourceSlug = region[field]?.trim();
  return sourceSlug && sourceSlug !== region.slug ? sourceSlug : region.slug;
}
