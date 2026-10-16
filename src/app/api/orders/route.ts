import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { Collection, MongoServerError, ObjectId } from "mongodb";
import { z } from "zod";

import { checkOrderRateLimit } from "@/lib/order-rate-limit";
import { getDb } from "@/lib/mongodb";
import { allocateNumber, NumberingError, withNumberTransaction } from "@/lib/numbering";
import { PACKAGES, PACKAGE_IDS } from "@/lib/products";
import { ORDER_SIZES } from "@/lib/sizes";

const playerSchema = z
  .object({
    playerName: z.string().trim().min(3).max(100),
    group: z.string().trim().min(2).max(80),
    packageId: z.enum(PACKAGE_IDS),
    items: z
      .array(
        z.object({
          productId: z.enum(["pants", "sweatshirt", "jacket", "jacket_basic"]),
          size: z.enum(ORDER_SIZES),
          quantity: z.literal(1),
        }),
      )
      .length(3),
  })
  .strict()
  .superRefine((player, context) => {
    const requiredIds: readonly string[] = PACKAGES[player.packageId].items;

    const foundIds = player.items.map((item) => item.productId);
    const foundIdSet = new Set<string>(foundIds);

    if (
      foundIdSet.size !== 3 ||
      requiredIds.some((id) => !foundIdSet.has(id))
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Pakiet musi zawierać dokładnie spodnie, bluzę i właściwą kurtkę.",
        path: ["items"],
      });
    }
  });

const orderSchema = z
  .object({
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
    website: z.string().max(200).optional(),
    players: z.array(playerSchema).min(1).max(4),
  })
  .strict();

let indexPromise: Promise<string> | null = null;

async function ensureIdempotencyIndex(collection: Collection) {
  if (!indexPromise) {
    indexPromise = collection.createIndex(
      { idempotencyKey: 1 },
      {
        name: "unique_order_idempotency_key",
        unique: true,
        partialFilterExpression: {
          idempotencyKey: { $type: "string" },
        },
      },
    );
  }

  try {
    await indexPromise;
  } catch (error) {
    indexPromise = null;
    throw error;
  }
}

type ExistingOrder = {
  _id: ObjectId;
  createdAt: Date;
  totalPrice: number;
  requestHash: string;
  players?: { number?: number }[];
};

function respondToExistingOrder(existing: ExistingOrder, requestHash: string) {
  if (existing.requestHash !== requestHash) {
    return NextResponse.json(
      {
        error: "Identyfikator zgłoszenia został użyty dla innych danych.",
      },
      { status: 409 },
    );
  }

  const orderId = existing._id.toHexString();

  const reference = `GR-${existing.createdAt.getUTCFullYear()}-${orderId
    .slice(-10)
    .toUpperCase()}`;

  return NextResponse.json(
    {
      success: true,
      message: "To zgłoszenie zostało już wcześniej zapisane.",
      orderId,
      reference,
      totalPrice: existing.totalPrice,
      reused: true,
      numbers: existing.players?.map((player) => player.number ?? null) ?? [],
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

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

    if (website?.trim()) {
      return NextResponse.json(
        { error: "Nieprawidłowe zgłoszenie." },
        { status: 400 },
      );
    }

    // Każda próba zapisu musi mieć losowy identyfikator UUID.
    const idempotencyKey = request.headers.get("idempotency-key");

    if (
      !idempotencyKey ||
      !z.string().uuid().safeParse(idempotencyKey).success
    ) {
      return NextResponse.json(
        { error: "Brak prawidłowego identyfikatora zgłoszenia." },
        { status: 400 },
      );
    }

    // Hash pozwala wykryć próbę użycia tego samego klucza
    // dla innego zamówienia.
    const requestHash = createHash("sha256")
      .update(JSON.stringify(order))
      .digest("hex");

    const db = await getDb();
    const collection = db.collection("orders");

    // Unikalność musi być egzekwowana przez MongoDB.
    // Indeks częściowy nie obejmuje dawnych zamówień.
    await ensureIdempotencyIndex(collection);

    const existing = await collection.findOne({
      idempotencyKey,
    });

    if (existing) {
      return respondToExistingOrder(existing as ExistingOrder, requestHash);
    }

    // Limit IP dotyczy nowych zamówień, nie ponowień
    // zapisanych wcześniej zgłoszeń.
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

    const editToken = randomBytes(32).toString("base64url");
    const editTokenHash = createHash("sha256").update(editToken).digest("hex");

    const now = new Date();

    const players = order.players.map((player) => {
      const pack = PACKAGES[player.packageId];
      return {
        ...player,
        items: player.items.map((item) => ({ ...item, unitPrice: 0 })),
        packagePrice: pack.price,
        catalogPrice: pack.catalogPrice,
        totalPrice: pack.price,
      };
    });
    const totalPrice = players.reduce((sum, player) => sum + player.packagePrice, 0);

    try {
      // Identyfikator zamówienia tworzymy przed transakcją, aby rezerwacje
      // numerów jednoznacznie wskazywały właściciela.
      const newId = new ObjectId();
      const numbers = await withNumberTransaction(async (transactionDb, session) => {
        const assigned: number[] = [];
        for (const [index, player] of players.entries()) {
          assigned.push(await allocateNumber(
            transactionDb, session, player.group, newId.toHexString(), index,
          ));
        }
        await transactionDb.collection("orders").insertOne({
          _id: newId,
          parentName: order.parentName,
          phone: order.phone,
          players: players.map((player, index) => ({
            ...player,
            number: assigned[index],
          })),
          totalPrice,
          currency: "PLN",
          status: "new",
          editTokenHash,
          idempotencyKey,
          requestHash,
          createdAt: now,
          updatedAt: now,
        }, { session });
        return assigned;
      });

      const orderId = newId.toHexString();
      const reference = `GR-${now.getUTCFullYear()}-${orderId.slice(-10).toUpperCase()}`;
      return NextResponse.json(
        {
          success: true,
          message: "Zamówienie zostało zapisane.",
          orderId,
          reference,
          totalPrice,
          editToken,
          numbers,
          reused: false,
        },
        { status: 201, headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      // Dwa równoczesne żądania mogły przejść przez
      // wstępne sprawdzenie. MongoDB przepuści tylko jedno.
      if (error instanceof MongoServerError && error.code === 11000) {
        const existing = await collection.findOne({
          idempotencyKey,
        });

        if (existing) {
          return respondToExistingOrder(existing as ExistingOrder, requestHash);
        }
      }

      throw error;
    }
  } catch (error) {
    if (error instanceof NumberingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Błąd zapisywania zamówienia:", error);

    return NextResponse.json(
      { error: "Nie udało się zapisać zamówienia." },
      { status: 500 },
    );
  }
}
