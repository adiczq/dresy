import "server-only";

import type { Document } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { getPlayerInitials } from "@/lib/initials";

import { PRODUCT_IDS, type ProductId } from "@/lib/products";

type StoredItem = {
  productId: ProductId;
  size: string;
  quantity?: number;
  unitPrice?: number;
};

type StoredPlayer = {
  deletedAt?: Date | null;
  paymentStatus?: "paid" | "unpaid";
  playerName: string;
  group: string;
  noInitials?: boolean;
  initials?: string | null;
  items?: StoredItem[];
};

interface StoredOrder extends Document {
  paymentStatus?: "paid" | "unpaid";
  playerName?: string;
  group?: string;
  noInitials?: boolean;
  initials?: string | null;
  items?: StoredItem[];
  players?: StoredPlayer[];
  parentName?: string;
  phone?: string;
  createdAt?: Date;
}

export type AdminOrderRow = {
  playerIndex: number;
  paymentStatus: "paid" | "unpaid";
  id: string;
  playerKey: string;
  orderId: string;
  reference: string;
  playerName: string;
  group: string;
  initials: string | null;
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
    .limit(500)
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
                noInitials: order.noInitials,
                initials: order.initials,
                items: order.items ?? [],
              },
            ]
          : [];

    return players.flatMap((player, playerIndex) => {
      if (player.deletedAt) {
        return [];
      }

      const initials = player.noInitials
        ? null
        : (player.initials ?? getPlayerInitials(player.playerName));

      const playerKey = `${orderId}:${playerIndex}`;

      return (player.items ?? []).flatMap((item) => {
        if (!PRODUCT_IDS.includes(item.productId)) {
          return [];
        }

        return [
          {
            id: `${playerKey}:${item.productId}`,
            playerKey,
            playerIndex,
            paymentStatus: player.paymentStatus === "paid" ? "paid" : "unpaid",
            orderId,
            reference,
            playerName: player.playerName,
            group: player.group,
            initials,
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
