import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { NumberingError, withNumberTransaction } from "@/lib/numbering";

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (session.isAdmin !== true) return NextResponse.json({ error: "Brak uprawnień." }, { status: 401 });
    const origin = request.headers.get("origin");
    const allowed = [process.env.APP_ORIGIN?.trim().replace(/\/$/, ""),
      ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:3000"])];
    if (!origin || !allowed.includes(origin)) return NextResponse.json({ error: "Niedozwolone żądanie." }, { status: 403 });

    const result = await withNumberTransaction(async (db, mongoSession) => {
      const orders = db.collection("orders");
      const all = await orders.find({ deletedAt: { $exists: false } }, { session: mongoSession }).toArray();
      const pending: { id: typeof all[number]["_id"]; prefix: string; number: number }[] = [];
      for (const order of all) {
        if (Array.isArray(order.players)) {
          order.players.forEach((player, index) => {
            if (!player.deletedAt && !player.approvedAt) {
              pending.push({ id: order._id, prefix: `players.${index}.`, number: player.number });
            }
          });
        } else if (order.playerName && !order.approvedAt) {
          pending.push({ id: order._id, prefix: "", number: order.number });
        }
      }
      if (!pending.length) throw new NumberingError("Brak roboczych zamówień do zatwierdzenia.");
      if (pending.some((item) => typeof item.number !== "number")) {
        throw new NumberingError("Nie wszyscy zawodnicy mają numery. Najpierw kliknij «Nadaj brakujące numery».");
      }
      const now = new Date();
      const counter = await db.collection<{ _id: string; revision: number; batchSequence: number }>("numbering_control")
        .findOneAndUpdate({ _id: "global" }, { $inc: { batchSequence: 1 } }, { session: mongoSession, returnDocument: "after" });
      if (!counter) throw new NumberingError("Nie udało się utworzyć partii.");
      const batchNumber = counter.batchSequence;
      for (const item of pending) {
        const updated = await orders.updateOne({
          _id: item.id,
          [`${item.prefix}approvedAt`]: { $exists: false },
          [`${item.prefix}deletedAt`]: { $exists: false },
          [`${item.prefix}number`]: item.number,
        }, { $set: {
          [`${item.prefix}approvedAt`]: now,
          [`${item.prefix}batchNumber`]: batchNumber,
          updatedAt: now,
        } }, { session: mongoSession });
        if (updated.matchedCount !== 1) throw new NumberingError("Lista zmieniła się podczas zatwierdzania. Spróbuj ponownie.");
      }
      await db.collection<{ _id: number; approvedAt: Date; playerCount: number }>("approved_batches").insertOne({
        _id: batchNumber,
        approvedAt: now,
        playerCount: pending.length,
      }, { session: mongoSession });
      return { batchNumber, count: pending.length };
    });
    return NextResponse.json({ success: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof NumberingError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Błąd zatwierdzania partii:", error);
    return NextResponse.json({ error: "Nie udało się zatwierdzić partii." }, { status: 500 });
  }
}
