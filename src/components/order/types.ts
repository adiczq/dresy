import type { SizeRecommendation } from "@/components/SizeAdvisor";

import type { ProductId } from "@/lib/products";

export type { ProductId };

export type OrderFormProps = {
  selectedProducts: ProductId[];
  recommendation: SizeRecommendation;
};

export type PlayerDraft = {
  id: string;
  playerName: string;
  group: string;
  noInitials: boolean;
  products: ProductId[];
  manualTracksuitSize: string;
  manualJacketSize: string;
  manualBasicJacketSize: string;
};

export type OrderItem = {
  productId: ProductId;
  size: string;
  quantity: number;
};

export type OrderPlayer = {
  playerName: string;
  group: string;
  noInitials: boolean;
  items: OrderItem[];
};
