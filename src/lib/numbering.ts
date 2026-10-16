import "server-only";

import type { ClientSession, Db } from "mongodb";
import { getDb, getMongoClient } from "@/lib/mongodb";

export const NUMBER_CATEGORIES = [
  { label: "Skrzat", from: 101, to: 199 },
  { label: "Żak", from: 201, to: 299 },
  { label: "Orlik", from: 301, to: 399 },
  { label: "Młodzik", from: 401, to: 499 },
  { label: "Trampkarz", from: 501, to: 599 },
  { label: "Junior", from: 601, to: 699 },
] as const;

export class NumberingError extends Error {
  constructor(
    message: string,
    public status = 409,
  ) {
    super(message);
    this.name = "NumberingError";
  }
}

export function getCategory(group: string) {
  const g = group.trim().toLocaleLowerCase("pl-PL");
  if (g.startsWith("skrzat")) return NUMBER_CATEGORIES[0];
  if (g.startsWith("żak") || g.startsWith("zak")) return NUMBER_CATEGORIES[1];
  if (g.startsWith("orlik")) return NUMBER_CATEGORIES[2];
  if (g.startsWith("młodzik") || g.startsWith("mlodzik"))
    return NUMBER_CATEGORIES[3];
  if (g.startsWith("trampkarz")) return NUMBER_CATEGORIES[4];
  if (g.startsWith("junior")) return NUMBER_CATEGORIES[5];
  return null;
}

export function requireCategory(group: string) {
  const category = getCategory(group);
  if (!category) {
    throw new NumberingError(
      `Nieznana kategoria grupy: ${group}. Sprawdź grupę zawodnika.`,
      400,
    );
  }
  return category;
}

// Każdy numer jest osobnym dokumentem o unikalnym _id. Nie ma możliwości
// przypisania jednego numeru dwóm zawodnikom, także przy równoległych żądaniach.
// Sterowanie numeracją, wpisem zamówienia i zwalnianiem numeru odbywa się
// w tej samej transakcji MongoDB Atlas.
export async function withNumberTransaction<T>(
  fn: (db: Db, session: ClientSession) => Promise<T>,
): Promise<T> {
  const client = await getMongoClient();
  const db = await getDb();
  const control = db.collection<{
    _id: string;
    revision: number;
    batchSequence: number;
  }>("numbering_control");
  try {
    await control.updateOne(
      { _id: "global" },
      { $setOnInsert: { revision: 0, batchSequence: 0 } },
      { upsert: true },
    );
  } catch (error) {
    // Podczas pierwszego równoczesnego zamówienia drugi proces może
    // przegrać tworzenie dokumentu kontrolnego. Jeśli dokument już istnieje,
    // operacja jest bezpieczna do kontynuowania.
    const exists = await control.findOne({ _id: "global" });
    if (!exists) throw error;
  }

  const session = client.startSession();
  let value: T | undefined;
  try {
    await session.withTransaction(
      async () => {
        // Jeden wspólny zapis serializuje wszystkie operacje zmieniające numery
        // lub zatwierdzone partie i eliminuje wyścigi pomiędzy nimi.
        await control.updateOne(
          { _id: "global" },
          { $inc: { revision: 1 } },
          { session },
        );
        value = await fn(db, session);
      },
      {
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
        readPreference: "primary",
      },
    );
    return value as T;
  } finally {
    await session.endSession();
  }
}

export async function allocateNumber(
  db: Db,
  session: ClientSession,
  group: string,
  orderId: string,
  playerIndex: number,
): Promise<number> {
  const category = requireCategory(group);
  const slots = db.collection<{
    _id: number;
    orderId: string;
    playerIndex: number;
    createdAt: Date;
  }>("number_slots");
  const occupied = new Set(
    (
      await slots
        .find(
          { _id: { $gte: category.from, $lte: category.to } },
          { projection: { _id: 1 }, session },
        )
        .toArray()
    ).map((slot) => slot._id),
  );
  for (let number = category.from; number <= category.to; number++) {
    if (!occupied.has(number)) {
      await slots.insertOne(
        {
          _id: number,
          orderId,
          playerIndex,
          createdAt: new Date(),
        },
        { session },
      );
      return number;
    }
  }
  throw new NumberingError(
    `Brak wolnych numerów w kategorii ${category.label} (${category.from}–${category.to}).`,
  );
}

export async function releaseNumber(
  db: Db,
  session: ClientSession,
  number: number,
  orderId: string,
  playerIndex: number,
) {
  const result = await db
    .collection<{ _id: number; orderId: string; playerIndex: number }>(
      "number_slots",
    )
    .deleteOne({ _id: number, orderId, playerIndex }, { session });
  if (result.deletedCount !== 1) {
    throw new NumberingError(
      "Nie udało się bezpiecznie zwolnić numeru. Skontaktuj się z administratorem.",
    );
  }
}
