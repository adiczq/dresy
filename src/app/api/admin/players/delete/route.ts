import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { getAdminSession } from "@/lib/admin-auth";
import { getDb } from "@/lib/mongodb";

const deleteSchema = z
  .object({
    orderId: z.string().regex(/^[a-fA-F0-9]{24}$/),
    playerIndex: z.number().int().min(0).max(3),
  })
  .strict();

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSession();

    if (session.isAdmin !== true) {
      return NextResponse.json({ error: "Brak uprawnień." }, { status: 401 });
    }

    // Ochrona przed żądaniami z obcych stron.
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

    if (raw.length > 512) {
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

    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane zawodnika." },
        { status: 400 },
      );
    }

    const { orderId, playerIndex } = parsed.data;
    const db = await getDb();
    const collection = db.collection("orders");

    const _id = new ObjectId(orderId);
    const now = new Date();

    // Nowe zgłoszenia z kilkoma zawodnikami.
    // Zmieniamy TYLKO zawodnika o wskazanym indeksie.
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
          [`players.${playerIndex}.deletedAt`]: now,
          updatedAt: now,
        },
      },
    );

    // Starsze zgłoszenia, zawierające jednego zawodnika.
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
            deletedAt: now,
            updatedAt: now,
          },
        },
      );
    }

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          error: "Nie znaleziono aktywnego zawodnika. Odśwież panel.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Błąd usuwania zawodnika:", error);

    return NextResponse.json(
      { error: "Nie udało się usunąć zawodnika." },
      { status: 500 },
    );
  }
}
