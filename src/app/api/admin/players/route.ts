import { NextRequest, NextResponse } from "next/server";
import { ObjectId, type Document } from "mongodb";
import { z } from "zod";
import { ORDER_SIZES } from "@/lib/sizes";
import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/mongodb";
import type { ProductId } from "@/lib/products";

const sizes = ORDER_SIZES;

const editSchema = z
  .object({
    orderId: z.string().regex(/^[a-fA-F0-9]{24}$/),
    playerIndex: z.number().int().min(0).max(3),
    playerName: z.string().trim().min(3).max(100),
    group: z.string().trim().min(2).max(80),
    noInitials: z.boolean(),
    initials: z
      .string()
      .trim()
      .max(6)
      .regex(/^[\p{L}0-9]*$/u),
    tracksuitSize: z.enum(sizes).optional(),
    pantsSize: z.enum(sizes).optional(),
    sweatshirtSize: z.enum(sizes).optional(),
    jacketSize: z.enum(sizes).optional(),
    basicJacketSize: z.enum(sizes).optional(),
  })
  .strict()
  .refine((data) => data.noInitials || data.initials.length > 0, {
    message: "Podaj inicjały albo zaznacz Bez inicjałów.",
    path: ["initials"],
  });

type StoredItem = {
  productId: ProductId;
  size: string;
  quantity?: number;
};

type StoredPlayer = {
  playerName: string;
  items?: StoredItem[];
};

interface StoredOrder extends Document {
  players?: StoredPlayer[];
  playerName?: string;
  items?: StoredItem[];
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAdminSession();

    if (session.isAdmin !== true) {
      return NextResponse.json({ error: "Brak uprawnień." }, { status: 401 });
    }

    const origin = request.headers.get("origin");

    const allowedOrigins = [
      process.env.APP_ORIGIN?.trim().replace(/\/$/, ""),
      ...(process.env.NODE_ENV !== "production"
        ? ["http://localhost:3000"]
        : []),
    ];

    if (!origin || !allowedOrigins.includes(origin)) {
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

    if (raw.length > 3000) {
      return NextResponse.json(
        { error: "Zbyt duże żądanie." },
        { status: 413 },
      );
    }

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

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane zawodnika." },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const _id = new ObjectId(data.orderId);

    const db = await getDb();
    const collection = db.collection<StoredOrder>("orders");

    const order = await collection.findOne({ _id });

    if (!order) {
      return NextResponse.json(
        { error: "Nie znaleziono zgłoszenia." },
        { status: 404 },
      );
    }

    const isFamilyOrder = Array.isArray(order.players);

    const player = isFamilyOrder
      ? order.players?.[data.playerIndex]
      : data.playerIndex === 0 && order.playerName
        ? order
        : undefined;

    if (!player) {
      return NextResponse.json(
        { error: "Nie znaleziono zawodnika." },
        { status: 404 },
      );
    }

    const items = player.items ?? [];

    if (!items.length) {
      return NextResponse.json(
        { error: "Zawodnik nie ma produktów do edycji." },
        { status: 409 },
      );
    }

    const prefix = isFamilyOrder ? `players.${data.playerIndex}.` : "";

    const fields: Record<string, string | boolean | null | Date> = {
      [`${prefix}playerName`]: data.playerName,
      [`${prefix}group`]: data.group,
      [`${prefix}noInitials`]: data.noInitials,
      [`${prefix}initials`]: data.noInitials
        ? null
        : data.initials.toLocaleUpperCase("pl-PL"),
      updatedAt: new Date(),
    };

    for (const [index, item] of items.entries()) {
      const nextSize =
        item.productId === "tracksuit" ? data.tracksuitSize
          : item.productId === "pants" ? data.pantsSize
          : item.productId === "sweatshirt" ? data.sweatshirtSize
          : item.productId === "jacket" ? data.jacketSize
          : item.productId === "jacket_basic" ? data.basicJacketSize
          : undefined;

      if (!nextSize) {
        return NextResponse.json(
          { error: "Brakuje rozmiaru zamówionego produktu." },
          { status: 400 },
        );
      }

      fields[`${prefix}items.${index}.size`] = nextSize;
    }

    const filter: Document = isFamilyOrder
      ? {
          _id,
          [`players.${data.playerIndex}`]: { $exists: true },
          [`players.${data.playerIndex}.deletedAt`]: {
            $exists: false,
          },
        }
      : {
          _id,
          players: { $exists: false },
          playerName: { $type: "string" },
          deletedAt: { $exists: false },
        };

    const result = await collection.updateOne(filter, {
      $set: fields,
    });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Zgłoszenie zostało zmienione. Odśwież panel." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Błąd edycji zawodnika:", error);

    return NextResponse.json(
      { error: "Nie udało się zapisać zmian." },
      { status: 500 },
    );
  }
}
