import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

import { getDb } from "@/lib/mongodb";
import { getPlayerInitials } from "@/lib/initials";

const orderSchema = z.object({
  playerName: z.string().trim().min(3).max(100),

  group: z.string().trim().min(2).max(80),
  noInitials: z.boolean().default(false),
  parentName: z.string().trim().min(3).max(100),

  phone: z
    .string()
    .trim()
    .min(9)
    .max(25)
    .regex(/^[+\d\s()-]+$/)
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 9 && digits.length <= 15;
    }),

  items: z
    .array(
      z.object({
        productId: z.enum(["tracksuit", "jacket"]),
        size: z.enum(["6XS", "5XS", "4XS", "3XS", "2XS", "XS", "Do ustalenia"]),
        quantity: z.number().int().min(1).max(5).default(1),
      }),
    )
    .min(1)
    .max(2)
    .refine(
      (items) =>
        new Set(items.map((item) => item.productId)).size === items.length,
      "Nie można zamówić tego samego produktu dwa razy.",
    ),

  // Pole zabezpieczające przed prostymi botami.
  website: z.string().max(200).optional(),
});

const multiPlayerSchema = orderSchema
  .pick({
    parentName: true,
    phone: true,
    website: true,
  })
  .extend({
    players: z
      .array(
        orderSchema.pick({
          playerName: true,
          group: true,
          noInitials: true,
          items: true,
        }),
      )
      .min(1)
      .max(4),
  });

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");

    const allowedOrigins = [
      "http://localhost:3000",
      process.env.APP_ORIGIN?.trim().replace(/\/$/, ""),
    ].filter(Boolean);

    if (origin && !allowedOrigins.includes(origin)) {
      return NextResponse.json(
        { error: "Niedozwolone pochodzenie żądania." },
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

    if (raw.length > 8000) {
      return NextResponse.json(
        { error: "Przekroczono rozmiar żądania." },
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

    const validation = z
      .union([orderSchema, multiPlayerSchema])
      .safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Nieprawidłowe dane zamówienia.",
          details: z.flattenError(validation.error),
        },
        { status: 400 },
      );
    }

    const { website, ...order } = validation.data;

    // Honeypot — odrzucamy zgłoszenia z wypełnionym ukrytym polem.
    if (website?.trim()) {
      return NextResponse.json(
        { error: "Nieprawidłowe zgłoszenie." },
        { status: 400 },
      );
    }
    // Losowy token do przyszłej edycji zamówienia.
    const editToken = randomBytes(32).toString("base64url");

    // W bazie zapisujemy wyłącznie hash tokenu.
    const editTokenHash = createHash("sha256").update(editToken).digest("hex");

    const db = await getDb();
    const now = new Date();

    const document =
      "players" in order
        ? {
            parentName: order.parentName,
            phone: order.phone,
            players: order.players.map((player) => ({
              ...player,
              initials: player.noInitials
                ? null
                : getPlayerInitials(player.playerName),
            })),
          }
        : {
            ...order,
            initials: order.noInitials
              ? null
              : getPlayerInitials(order.playerName),
          };

    const result = await db.collection("orders").insertOne({
      ...document,
      status: "new",
      editTokenHash,
      createdAt: now,
      updatedAt: now,
    });

    const orderId = result.insertedId.toHexString();

    const reference = `GR-${now.getUTCFullYear()}-${orderId
      .slice(-10)
      .toUpperCase()}`;

    return NextResponse.json(
      {
        success: true,
        message: "Zamówienie zostało zapisane.",
        orderId,
        reference,
        editToken,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Błąd zapisywania zamówienia:", error);

    return NextResponse.json(
      { error: "Nie udało się zapisać zamówienia." },
      { status: 500 },
    );
  }
}
