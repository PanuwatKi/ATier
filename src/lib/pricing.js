// Pricing / discount helpers (mirror of the SQL effective_price()).

export function effectivePrice(item) {
  const price = Number(item?.price || 0);
  const dval = Number(item?.discount_value || 0);
  const dtype = item?.discount_type;
  if (!dtype || dval <= 0) return price;

  const now = Date.now();
  const start = item?.discount_starts_at ? new Date(item.discount_starts_at).getTime() : null;
  const end = item?.discount_ends_at ? new Date(item.discount_ends_at).getTime() : null;
  if (start && now < start) return price;
  if (end && now > end) return price;

  if (dtype === 'percent') return Math.max(0, Math.round(price * (1 - Math.min(dval, 100) / 100) * 100) / 100);
  if (dtype === 'amount') return Math.max(0, price - dval);
  return price;
}

export function hasActiveDiscount(item) {
  const price = Number(item?.price || 0);
  return price > 0 && effectivePrice(item) < price;
}

export function discountPercent(item) {
  const price = Number(item?.price || 0);
  if (!price) return 0;
  return Math.round((1 - effectivePrice(item) / price) * 100);
}

export function formatTHB(n) {
  const v = Number(n) || 0;
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: v % 1 === 0 ? 0 : 2,
  }).format(v);
}
