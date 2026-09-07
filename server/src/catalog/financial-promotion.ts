type PromotionCopy = {
  title: string;
  cta: string;
  ctaUrl: string;
};

const LEGACY_FINANCIAL_PROMOTION_PATTERN =
  /(?:кешб|cashback|nakta\s*coin|\bnft\b|крипт|crypto|blockchain|кошел|wallet|withdraw|вывод|вознаграж|reward|бонус|\bcoin\b|баланс)/iu;

export function isLegacyFinancialPromotion(promotion: PromotionCopy) {
  return LEGACY_FINANCIAL_PROMOTION_PATTERN.test(
    `${promotion.title} ${promotion.cta} ${promotion.ctaUrl}`,
  );
}
