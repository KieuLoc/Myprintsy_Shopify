/**
 * Mirror of assets/addon-gift-box-pricing.js (theme cart tier UI).
 * Keep in sync when tier rules change.
 */

export function normalizeGiftQty(value) {
  const parsed = parseInt(String(value), 10);
  if (!parsed || parsed < 1) return 1;
  return parsed;
}

export function getTierPriceCents(quantity) {
  const qty = normalizeGiftQty(quantity);
  if (qty <= 1) return 499;
  if (qty === 2) return 899;
  if (qty === 3) return 1199;
  if (qty === 4) return 1499;
  return 1799;
}

export function moneyToCents(amount) {
  return Math.round(parseFloat(String(amount)) * 100);
}

export function centsToMoneyString(cents) {
  return (cents / 100).toFixed(2);
}

export function isGiftBoxLine(line) {
  const addonFlag = line?.attribute?.value;
  if (addonFlag != null && String(addonFlag).toLowerCase() === "true") {
    return true;
  }

  const title = line?.merchandise?.product?.title;
  if (typeof title === "string" && /gift box service/i.test(title)) {
    return true;
  }

  return false;
}

export function getGiftBoxLineDiscountCents(line) {
  if (!isGiftBoxLine(line)) return 0;

  const subtotalCents = moneyToCents(line.cost.subtotalAmount.amount);
  const tierCents = getTierPriceCents(line.quantity);
  const discountCents = subtotalCents - tierCents;

  return discountCents > 0 ? discountCents : 0;
}
