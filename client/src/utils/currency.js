const PRICE_LEVEL_RANGES = {
  1: [10, 25],
  2: [25, 60],
  3: [60, 120],
  4: [120, null],
};

export const formatPriceLevel = (priceLevel, currency = 'USD', locale = 'en-US') => {
  if (priceLevel === 0 || priceLevel === null || priceLevel === undefined) return 'Free';
  const [min, max] = PRICE_LEVEL_RANGES[priceLevel] || [25, 60];
  const fmt = (n) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  return max ? `~${fmt(min)}–${fmt(max)} per person` : `~${fmt(min)}+ per person`;
};

export const convertCurrency = (amount, fromRate, toRate) => {
  return Math.round((amount / fromRate) * toRate);
};
