import type { SizeRecommendation } from "@/components/SizeAdvisor";
import type { ProductId, PackageId } from "@/lib/products";

export type { ProductId, PackageId };

export type OrderFormProps = {
  selectedPackage: PackageId;
  recommendation: SizeRecommendation;
};

export type PlayerDraft = {
  id: string;
  playerName: string;
  group: string;
  packageId: PackageId;
  manualPantsSize: string;
  manualSweatshirtSize: string;
  manualJacketSize: string;
};

export type OrderItem = {
  productId: ProductId;
  size: string;
  quantity: number;
};

export type OrderPlayer = {
  playerName: string;
  group: string;
  packageId: PackageId;
  items: OrderItem[];
};
