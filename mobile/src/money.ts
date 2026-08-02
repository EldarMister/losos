const moneyFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 2,
});

/** Formats an amount using the single currency representation used by the app. */
export function formatMoney(value: number) {
  return `${moneyFormatter.format(value)} сом`;
}

/** Use this with NumberTicker when animating a quantity rather than an amount. */
export function formatNumber(value: number) {
  return numberFormatter.format(value);
}
