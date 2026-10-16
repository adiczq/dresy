/** Katalog produktów Joma. Stare identyfikatory zachowujemy dla historii zamówień. */
export const PRODUCTS = {
  tracksuit: { label: "Komplet dresowy Academy IV (archiwalny)", shortLabel: "Dres Academy IV", catalogNumber: "101966.703", price: 125 },
  pants: { label: "Spodnie treningowe", shortLabel: "Spodnie", catalogNumber: "100761.331", price: 0 },
  sweatshirt: { label: "Bluza treningowa", shortLabel: "Bluza", catalogNumber: "100947.703", price: 0 },
  jacket: { label: "Kurtka treningowa", shortLabel: "Kurtka II", catalogNumber: "105301.700", price: 120 },
  jacket_basic: { label: "Kurtka przeciwdeszczowa", shortLabel: "Kurtka I", catalogNumber: "104796.700", price: 80 },
} as const;

export type ProductId = keyof typeof PRODUCTS;
export const PRODUCT_IDS = ["tracksuit", "pants", "sweatshirt", "jacket", "jacket_basic"] as const;

export const PACKAGES = {
  package_1: {
    label: "Pakiet I",
    catalogPrice: 425,
    price: 223,
    jacketId: "jacket_basic" as const,
    items: ["pants", "sweatshirt", "jacket_basic"] as const,
  },
  package_2: {
    label: "Pakiet II",
    catalogPrice: 486,
    price: 260,
    jacketId: "jacket" as const,
    items: ["pants", "sweatshirt", "jacket"] as const,
  },
} as const;
export type PackageId = keyof typeof PACKAGES;
export const PACKAGE_IDS = ["package_1", "package_2"] as const;

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString("pl-PL")} zł`;
}

// Wyłącznie dla historycznych, pojedynczych produktów.
export function getLinePrice(item: { productId: ProductId; quantity: number }): number {
  return PRODUCTS[item.productId].price * item.quantity;
}

export function getPlayerPrice(player: {
  packageId?: PackageId;
  items: { productId: ProductId; quantity: number }[];
}): number {
  return player.packageId
    ? PACKAGES[player.packageId].price
    : player.items.reduce((sum, item) => sum + getLinePrice(item), 0);
}

export function getOrderPrice(players: {
  packageId?: PackageId;
  items: { productId: ProductId; quantity: number }[];
}[]): number {
  return players.reduce((sum, player) => sum + getPlayerPrice(player), 0);
}
