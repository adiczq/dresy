import "server-only";

import type { Document } from "mongodb";

import { getDb } from "@/lib/mongodb";

import { PRODUCT_IDS, type ProductId, type PackageId } from "@/lib/products";

type StoredItem = {
  productId: ProductId;
  size: string;
  quantity?: number;
  unitPrice?: number;
};

type StoredPlayer = {
  deletedAt?: Date | null;
  packageId?: PackageId;
  packagePrice?: number;
  catalogPrice?: number;
  paymentStatus?: "paid" | "unpaid";
  number?: number;
  batchNumber?: number;
  approvedAt?: Date;
  playerName: string;
  group: string;
  items?: StoredItem[];
};

interface StoredOrder extends Document {
  paymentStatus?: "paid" | "unpaid";
  playerName?: string;
  group?: string;
  number?: number;
  batchNumber?: number;
  approvedAt?: Date;
  items?: StoredItem[];
  players?: StoredPlayer[];
  parentName?: string;
  phone?: string;
  createdAt?: Date;
}

export type AdminOrderRow = {
  playerIndex: number;
  packageId: PackageId | null;
  packagePrice: number | null;
  catalogPrice: number | null;
  paymentStatus: "paid" | "unpaid";
  id: string;
  playerKey: string;
  orderId: string;
  reference: string;
  playerName: string;
  group: string;
  number: number | null;
  batchNumber: number | null;
  approved: boolean;
  productId: ProductId;
  size: string;
  quantity: number;
  unitPrice: number | null;
  parentName: string;
  phone: string;
};

export async function getAdminOrders() {
  const db = await getDb();

  // Ograniczamy liczbę odczytywanych zgłoszeń.
  const orders = await db
    .collection<StoredOrder>("orders")
    .find({ deletedAt: { $exists: false } })
    .sort({ createdAt: -1 })
    .limit(1000)
    .toArray();

  const rows: AdminOrderRow[] = orders.flatMap((order) => {
    const orderId = order._id.toHexString();

    const year =
      order.createdAt instanceof Date
        ? order.createdAt.getUTCFullYear()
        : order._id.getTimestamp().getUTCFullYear();

    const reference = `GR-${year}-${orderId.slice(-10).toUpperCase()}`;

    // Obsługa nowych i starszych dokumentów.
    const players: StoredPlayer[] =
      Array.isArray(order.players) && order.players.length
        ? order.players
        : order.playerName
          ? [
              {
                paymentStatus: order.paymentStatus,
                playerName: order.playerName,
                group: order.group ?? "",
                number: order.number,
                batchNumber: order.batchNumber,
                approvedAt: order.approvedAt,
                items: order.items ?? [],
              },
            ]
          : [];

    return players.flatMap((player, playerIndex) => {
      if (player.deletedAt) {
        return [];
      }

      const playerKey = `${orderId}:${playerIndex}`;

      return (player.items ?? []).flatMap((item) => {
        if (!PRODUCT_IDS.includes(item.productId)) {
          return [];
        }

        return [
          {
            id: `${playerKey}:${item.productId}`,
            packageId: player.packageId ?? null,
            packagePrice: typeof player.packagePrice === "number" ? player.packagePrice : null,
            catalogPrice: typeof player.catalogPrice === "number" ? player.catalogPrice : null,
            playerKey,
            playerIndex,
            paymentStatus: player.paymentStatus === "paid" ? "paid" : "unpaid",
            orderId,
            reference,
            playerName: player.playerName,
            group: player.group,
            number: typeof player.number === "number" ? player.number : null,
            batchNumber: typeof player.batchNumber === "number" ? player.batchNumber : null,
            approved: player.approvedAt instanceof Date,
            productId: item.productId,
            size: item.size,
            quantity:
              typeof item.quantity === "number" &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0
                ? item.quantity
                : 1,
            unitPrice:
              typeof item.unitPrice === "number" &&
              Number.isFinite(item.unitPrice) && item.unitPrice >= 0
                ? item.unitPrice
                : null,
            parentName: order.parentName ?? "",
            phone: order.phone ?? "",
          },
        ];
      });
    });
  });

  return {
    ordersCount: orders.length,
    rows,
  };
}
