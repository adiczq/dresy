import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { ORDER_SIZES } from "@/lib/sizes";
import { getAdminSession } from "@/lib/admin-auth";
import {
  getCategory,
  NumberingError,
  allocateNumber,
  releaseNumber,
  withNumberTransaction,
} from "@/lib/numbering";
import type { ProductId } from "@/lib/products";

const editSchema = z
  .object({
    orderId: z.string().regex(/^[a-fA-F0-9]{24}$/),
    playerIndex: z.number().int().min(0).max(3),
    playerName: z.string().trim().min(3).max(100),
    group: z.string().trim().min(2).max(80),
    tracksuitSize: z.enum(ORDER_SIZES).optional(),
    pantsSize: z.enum(ORDER_SIZES).optional(),
    sweatshirtSize: z.enum(ORDER_SIZES).optional(),
    jacketSize: z.enum(ORDER_SIZES).optional(),
    basicJacketSize: z.enum(ORDER_SIZES).optional(),
  })
  .strict();

type Item = { productId: ProductId; size: string };
type StoredPlayer = {
  group: string;
  approvedAt?: Date;
  deletedAt?: Date;
  number?: number;
  items?: Item[];
};

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (session.isAdmin !== true) {
      return NextResponse.json({ error: "Brak uprawnień." }, { status: 401 });
    }
    const origin = request.headers.get("origin");
    const allowed = [
      process.env.APP_ORIGIN?.trim().replace(/\/$/, ""),
      ...(process.env.NODE_ENV === "production"
        ? []
        : ["http://localhost:3000"]),
    ];
    if (!origin || !allowed.includes(origin)) {
      return NextResponse.json(
        { error: "Niedozwolone żądanie." },
        { status: 403 },
      );
    }
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json(
        { error: "Wymagany format JSON." },
        { status: 415 },
      );
    }
    const raw = await request.text();
    if (raw.length > 3000)
      return NextResponse.json(
        { error: "Zbyt duże żądanie." },
        { status: 413 },
      );
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Nieprawidłowy JSON." },
        { status: 400 },
      );
    }
    const parsed = editSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Nieprawidłowe dane zawodnika." },
        { status: 400 },
      );
    const data = parsed.data;

    const nextNumber = await withNumberTransaction(async (db, mongoSession) => {
      const collection = db.collection("orders");
      const _id = new ObjectId(data.orderId);
      const order = await collection.findOne(
        { _id },
        { session: mongoSession },
      );
      if (!order || order.deletedAt)
        throw new NumberingError("Nie znaleziono zgłoszenia.", 404);
      const family = Array.isArray(order.players);

      const player: StoredPlayer | null = family
        ? (order.players?.[data.playerIndex] ?? null)
        : data.playerIndex === 0 &&
            typeof order.playerName === "string" &&
            typeof order.group === "string"
          ? (order as unknown as StoredPlayer)
          : null;

      if (!player || player.deletedAt)
        throw new NumberingError("Nie znaleziono zawodnika.", 404);
      if (player.approvedAt)
        throw new NumberingError(
          "Zatwierdzony zawodnik jest zablokowany przed edycją.",
        );
      if (!player.items?.length)
        throw new NumberingError("Zawodnik nie ma produktów do edycji.");

      const prefix = family ? `players.${data.playerIndex}.` : "";
      const fields: Record<string, string | number | Date> = {
        [`${prefix}playerName`]: data.playerName,
        [`${prefix}group`]: data.group,
        updatedAt: new Date(),
      };
      for (const [index, item] of player.items.entries()) {
        const size =
          item.productId === "tracksuit"
            ? data.tracksuitSize
            : item.productId === "pants"
              ? data.pantsSize
              : item.productId === "sweatshirt"
                ? data.sweatshirtSize
                : item.productId === "jacket"
                  ? data.jacketSize
                  : item.productId === "jacket_basic"
                    ? data.basicJacketSize
                    : undefined;
        if (!size)
          throw new NumberingError(
            "Brakuje rozmiaru zamówionego produktu.",
            400,
          );
        fields[`${prefix}items.${index}.size`] = size;
      }
      let number = typeof player.number === "number" ? player.number : null;
      const oldCategory = getCategory(player.group);
      const newCategory = getCategory(data.group);
      if (!newCategory)
        throw new NumberingError(
          "Nieznana kategoria grupy. Wybierz poprawną grupę.",
          400,
        );
      if (number !== null && oldCategory?.from !== newCategory.from) {
        // Najpierw nowa rezerwacja, później zwolnienie starej.
        const allocated = await allocateNumber(
          db,
          mongoSession,
          data.group,
          data.orderId,
          data.playerIndex,
        );
        await releaseNumber(
          db,
          mongoSession,
          number,
          data.orderId,
          data.playerIndex,
        );
        number = allocated;
        fields[`${prefix}number`] = allocated;
      }
      // Historyczny wpis bez numeru pozostaje bez numeru do czasu
      // świadomego uruchomienia przydziału w panelu trenera.
      const result = await collection.updateOne(
        {
          _id,
          [`${prefix}approvedAt`]: { $exists: false },
          [`${prefix}deletedAt`]: { $exists: false },
        },
        { $set: fields },
        { session: mongoSession },
      );
      if (result.matchedCount !== 1)
        throw new NumberingError(
          "Zgłoszenie zostało zmienione. Odśwież panel.",
        );
      return number;
    });

    return NextResponse.json(
      { success: true, number: nextNumber },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof NumberingError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("Błąd edycji zawodnika:", error);
    return NextResponse.json(
      { error: "Nie udało się zapisać zmian." },
      { status: 500 },
    );
  }
}
