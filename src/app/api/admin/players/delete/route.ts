import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { NumberingError, releaseNumber, withNumberTransaction } from "@/lib/numbering";

const schema = z.object({
  orderId: z.string().regex(/^[a-fA-F0-9]{24}$/),
  playerIndex: z.number().int().min(0).max(3),
}).strict();

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (session.isAdmin !== true) {
      return NextResponse.json({ error: "Brak uprawnień." }, { status: 401 });
    }
    const origin = request.headers.get("origin");
    const allowed = [process.env.APP_ORIGIN?.trim().replace(/\/$/, ""),
      ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:3000"])];
    if (!origin || !allowed.includes(origin)) {
      return NextResponse.json({ error: "Niedozwolone żądanie." }, { status: 403 });
    }
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json({ error: "Wymagany format JSON." }, { status: 415 });
    }
    const raw = await request.text();
    if (raw.length > 512) return NextResponse.json({ error: "Zbyt duże żądanie." }, { status: 413 });
    let body: unknown;
    try { body = JSON.parse(raw); }
    catch { return NextResponse.json({ error: "Nieprawidłowy JSON." }, { status: 400 }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Nieprawidłowe dane zawodnika." }, { status: 400 });
    const { orderId, playerIndex } = parsed.data;

    await withNumberTransaction(async (db, mongoSession) => {
      const collection = db.collection("orders");
      const _id = new ObjectId(orderId);
      const order = await collection.findOne({ _id }, { session: mongoSession });
      if (!order) throw new NumberingError("Nie znaleziono zgłoszenia.", 404);
      const family = Array.isArray(order.players);
      const player = family ? order.players?.[playerIndex] : playerIndex === 0 ? order : null;
      if (!player || player.deletedAt || order.deletedAt) {
        throw new NumberingError("Zawodnik został już usunięty. Odśwież panel.", 404);
      }
      if (player.approvedAt) {
        throw new NumberingError("Zamówienie jest zatwierdzone i zablokowane przed usunięciem.");
      }
      const prefix = family ? `players.${playerIndex}.` : "";
      const result = await collection.updateOne({
        _id, [`${prefix}approvedAt`]: { $exists: false },
        [`${prefix}deletedAt`]: { $exists: false },
      }, { $set: { [`${prefix}deletedAt`]: new Date(), updatedAt: new Date() } },
      { session: mongoSession });
      if (result.matchedCount !== 1) throw new NumberingError("Zgłoszenie zostało zmienione. Odśwież panel.");
      if (typeof player.number === "number") {
        await releaseNumber(db, mongoSession, player.number, orderId, playerIndex);
      }
    });

    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof NumberingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Błąd usuwania zawodnika:", error);
    return NextResponse.json({ error: "Nie udało się usunąć zawodnika." }, { status: 500 });
  }
}
