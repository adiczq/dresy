import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/mongodb";

const paymentSchema = z
  .object({
    orderId: z.string().regex(/^[a-fA-F0-9]{24}$/),
    playerIndex: z.number().int().min(0).max(3),
    paid: z.boolean(),
  })
  .strict();

export async function PATCH(request: NextRequest) {
  try {
    // Sprawdzamy, czy trener jest zalogowany.
    const session = await getAdminSession();

    if (session.isAdmin !== true) {
      return NextResponse.json({ error: "Brak uprawnień." }, { status: 401 });
    }

    // Ochrona przed żądaniami z innych stron.
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

    if (raw.length > 1024) {
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

    const parsed = paymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane płatności." },
        { status: 400 },
      );
    }

    const { orderId, playerIndex, paid } = parsed.data;

    const db = await getDb();
    const collection = db.collection("orders");

    const _id = new ObjectId(orderId);
    const now = new Date();

    const paymentStatus = paid ? "paid" : "unpaid";

    // Nowe zgłoszenia: tablica players.
    let result = await collection.updateOne(
      {
        _id,
        [`players.${playerIndex}`]: { $exists: true },
        [`players.${playerIndex}.deletedAt`]: {
          $exists: false,
        },
      },
      {
        $set: {
          [`players.${playerIndex}.paymentStatus`]: paymentStatus,
          [`players.${playerIndex}.paidAt`]: paid ? now : null,
          updatedAt: now,
        },
      },
    );

    // Starsze zgłoszenia: jeden zawodnik w dokumencie.
    if (result.matchedCount === 0 && playerIndex === 0) {
      result = await collection.updateOne(
        {
          _id,
          players: { $exists: false },
          playerName: { $type: "string" },
          deletedAt: { $exists: false },
        },
        {
          $set: {
            paymentStatus,
            paidAt: paid ? now : null,
            updatedAt: now,
          },
        },
      );
    }

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Nie znaleziono zawodnika." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        paymentStatus,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Błąd aktualizacji płatności:", error);

    return NextResponse.json(
      { error: "Nie udało się zmienić płatności." },
      { status: 500 },
    );
  }
}
