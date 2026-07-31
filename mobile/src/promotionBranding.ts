import type { Promotion } from "./types";

const LEGACY_BRAND = /много\s+лосося/gi;
const LEGACY_DESTINATION = /(?:mnogolososya\.ru|t\.me\/mnogolososya)/i;

export function brandPromotion(
  promotion: Promotion,
  brandedStoryImage: string,
): Promotion {
  const hasLegacyBrand = LEGACY_BRAND.test(promotion.title);
  LEGACY_BRAND.lastIndex = 0;
  return {
    ...promotion,
    title: promotion.title.replace(LEGACY_BRAND, "Накта суши"),
    image: hasLegacyBrand ? brandedStoryImage : promotion.image,
    ctaUrl: promotion.ctaUrl && LEGACY_DESTINATION.test(promotion.ctaUrl)
      ? "/support"
      : promotion.ctaUrl,
  };
}
