/** Jeden cennik dla formularza, API i panelu trenerów. Kwoty w PLN. */
export const PRODUCTS = {
  tracksuit: { label: "Komplet dresowy Academy IV", shortLabel: "Dres Academy IV", price: 125 },
  jacket: { label: "Kurtka Joma 105301.700", shortLabel: "Kurtka", price: 120 },
  jacket_basic: { label: "Kurtka ekonomiczna", shortLabel: "Kurtka ekonomiczna", price: 80 },
} as const;

export type ProductId = keyof typeof PRODUCTS;
export const PRODUCT_IDS = ["tracksuit", "jacket", "jacket_basic"] as const;

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString("pl-PL")} zł`;
}

export function getLinePrice(item: { productId: ProductId; quantity: number }): number {
  return PRODUCTS[item.productId].price * item.quantity;
}

export function getOrderPrice(players: { items: { productId: ProductId; quantity: number }[] }[]): number {
  return players.reduce((total, player) => total + player.items.reduce((sum, item) => sum + getLinePrice(item), 0), 0);
}
