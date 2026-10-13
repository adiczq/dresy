/** Jeden cennik dla formularza, API i panelu trenerów. Kwoty w PLN. */

export const PRODUCTS = {
  tracksuit: {
    label: "Komplet dresowy Academy IV",
    shortLabel: "Dres Academy IV",
    catalogNumber: "101966.703",
    price: 125,
  },
  jacket: {
    label: "Kurtka treningowa",
    shortLabel: "Kurtka treningowa",
    catalogNumber: "105301.700",
    price: 120,
  },
  jacket_basic: {
    label: "Kurtka przeciwdeszczowa",
    shortLabel: "Kurtka przeciwdeszczowa",
    catalogNumber: "104796.700",
    price: 80,
  },
} as const;

export type ProductId = keyof typeof PRODUCTS;
export const PRODUCT_IDS = ["tracksuit", "jacket", "jacket_basic"] as const;

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString("pl-PL")} zł`;
}

export function getLinePrice(item: {
  productId: ProductId;
  quantity: number;
}): number {
  return PRODUCTS[item.productId].price * item.quantity;
}

export function getOrderPrice(
  players: { items: { productId: ProductId; quantity: number }[] }[],
): number {
  return players.reduce(
    (total, player) =>
      total + player.items.reduce((sum, item) => sum + getLinePrice(item), 0),
    0,
  );
}
