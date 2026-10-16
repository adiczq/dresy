import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { checkOrderRateLimit } from "@/lib/order-rate-limit";

import { getDb } from "@/lib/mongodb";
import { getPlayerInitials } from "@/lib/initials";
import { PACKAGES, PACKAGE_IDS } from "@/lib/products";
import { ORDER_SIZES } from "@/lib/sizes";

const playerSchema = z.object({
  playerName: z.string().trim().min(3).max(100),
  group: z.string().trim().min(2).max(80),
  noInitials: z.boolean().default(false),
  packageId: z.enum(PACKAGE_IDS),
  items: z.array(z.object({
    productId: z.enum(["pants", "sweatshirt", "jacket", "jacket_basic"]),
    size: z.enum(ORDER_SIZES),
    quantity: z.literal(1),
  })).length(3),
}).strict().superRefine((player, context) => {
  const requiredIds: readonly string[] = PACKAGES[player.packageId].items;
  const foundIds = player.items.map((item) => item.productId);

const foundIdSet = new Set<string>(foundIds);

if (
  foundIdSet.size !== 3 ||
  requiredIds.some((id) => !foundIdSet.has(id))
) {
    context.addIssue({ code: "custom", message: "Pakiet musi zawierać dokładnie spodnie, bluzę i właściwą kurtkę.", path: ["items"] });
  }
});

const orderSchema = z.object({
  parentName: z.string().trim().min(3).max(100),
  phone: z.string().trim().min(9).max(25).regex(/^[+\d\s()-]+$/).refine(
    (value) => { const digits = value.replace(/\D/g, ""); return digits.length >= 9 && digits.length <= 15; },
  ),
  website: z.string().max(200).optional(),
  players: z.array(playerSchema).min(1).max(4),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");

    const allowedOrigins = [
      process.env.APP_ORIGIN?.trim().replace(/\/$/, ""),
      ...(process.env.NODE_ENV !== "production"
        ? ["http://localhost:3000"]
        : []),
    ].filter((value): value is string => Boolean(value));

    if (!origin || !allowedOrigins.includes(origin)) {
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

    const validation = orderSchema.safeParse(body);

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

    // Ograniczamy liczbę poprawnych zgłoszeń z jednego IP.
    const rateLimit = await checkOrderRateLimit(request);

    if (!rateLimit.allowed) {
      const minutes = Math.ceil(rateLimit.retryAfterSeconds / 60);

      return NextResponse.json(
        {
          error:
            `Przekroczono limit zamówień. ` +
            `Spróbuj ponownie za około ${minutes} min.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
            "Cache-Control": "no-store",
          },
        },
      );
    }

    // Losowy token do przyszłej edycji zamówienia.
    const editToken = randomBytes(32).toString("base64url");

    // W bazie zapisujemy wyłącznie hash tokenu.
    const editTokenHash = createHash("sha256").update(editToken).digest("hex");

    const db = await getDb();
    const now = new Date();

    // Cena pakietu pochodzi wyłącznie z serwera. Nie wyceniamy osobno
    // poszczególnych elementów pakietu — w historii zachowujemy jego cenę.
    const players = order.players.map((player) => {
      const pack = PACKAGES[player.packageId];
      return {
        ...player,
        items: player.items.map((item) => ({...item, unitPrice: 0})),
        packagePrice: pack.price,
        catalogPrice: pack.catalogPrice,
        totalPrice: pack.price,
        initials: player.noInitials ? null : getPlayerInitials(player.playerName),
      };
    });
    const totalPrice = players.reduce((sum, player) => sum + player.packagePrice, 0);
    const document = {parentName: order.parentName, phone: order.phone, players};

    const result = await db.collection("orders").insertOne({
      ...document,
      totalPrice,
      currency: "PLN",
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
        totalPrice,
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
