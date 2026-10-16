import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAdminSession } from "@/lib/admin-auth";
import { allocateNumber, NumberingError, requireCategory, withNumberTransaction } from "@/lib/numbering";

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (session.isAdmin !== true) return NextResponse.json({ error: "Brak uprawnień." }, { status: 401 });
    const origin = request.headers.get("origin");
    const allowed = [process.env.APP_ORIGIN?.trim().replace(/\/$/, ""),
      ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:3000"])];
    if (!origin || !allowed.includes(origin)) return NextResponse.json({ error: "Niedozwolone żądanie." }, { status: 403 });

    const count = await withNumberTransaction(async (db, mongoSession) => {
      const orders = db.collection("orders");
      const all = await orders.find({ deletedAt: { $exists: false } }, { session: mongoSession }).toArray();
      const missing: { id: ObjectId; index: number; group: string; prefix: string }[] = [];
      for (const order of all) {
        if (Array.isArray(order.players)) {
          order.players.forEach((player, index) => {
            if (!player.deletedAt && !player.approvedAt && typeof player.number !== "number") {
              missing.push({ id: order._id, index, group: player.group, prefix: `players.${index}.` });
            }
          });
        } else if (order.playerName && !order.approvedAt && typeof order.number !== "number") {
          missing.push({ id: order._id, index: 0, group: order.group, prefix: "" });
        }
      }
      // Sprawdzamy wszystkie grupy PRZED przydzieleniem choćby jednego numeru.
      for (const player of missing) requireCategory(player.group);
      for (const player of missing) {
        const number = await allocateNumber(db, mongoSession, player.group, player.id.toHexString(), player.index);
        const result = await orders.updateOne({
          _id: player.id,
          [`${player.prefix}number`]: { $exists: false },
          [`${player.prefix}approvedAt`]: { $exists: false },
          [`${player.prefix}deletedAt`]: { $exists: false },
        }, { $set: { [`${player.prefix}number`]: number, updatedAt: new Date() } }, { session: mongoSession });
        if (result.matchedCount !== 1) throw new NumberingError("Zgłoszenie zmieniło się podczas numeracji. Spróbuj ponownie.");
      }
      return missing.length;
    });
    return NextResponse.json({ success: true, assigned: count }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof NumberingError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Błąd przydzielania numerów:", error);
    return NextResponse.json({ error: "Nie udało się przydzielić numerów." }, { status: 500 });
  }
}
