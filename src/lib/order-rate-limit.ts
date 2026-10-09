import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { MongoServerError } from "mongodb";

import { getDb } from "@/lib/mongodb";

const MAX_ORDERS = 5;
const WINDOW_MS = 15 * 60 * 1000;

type LimitRecord = {
  _id: string;
  count: number;
  windowEndsAt: Date;
  expiresAt: Date;
};

type LimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

let indexPromise: Promise<string> | undefined;

function getClientIp(request: Request): string | null {
  // W produkcji ufamy nagłówkowi ustawianemu przez Vercel.
  // Nie ufamy dowolnemu IP przesłanemu przez przeglądarkę.
  if (process.env.VERCEL === "1") {
    const header =
      request.headers.get("x-vercel-forwarded-for") ??
      request.headers.get("x-forwarded-for");

    const ip = header?.split(",")[0]?.trim();

    return ip && isIP(ip) ? ip : null;
  }

  // W lokalnym środowisku programistycznym.
  if (process.env.NODE_ENV !== "production") {
    return "local-development";
  }

  return null;
}

export async function checkOrderRateLimit(
  request: Request,
): Promise<LimitResult> {
  const ip = getClientIp(request);

  // Nie pozwalamy omijać limitu przez brak IP.
  if (!ip) {
    throw new Error("Nie udało się ustalić adresu klienta.");
  }

  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("Brak ADMIN_SESSION_SECRET.");
  }

  // Nie zapisujemy w bazie surowego adresu IP.
  const key = createHmac("sha256", secret).update(`orders:${ip}`).digest("hex");

  const db = await getDb();
  const collection = db.collection<LimitRecord>("order_rate_limits");

  // MongoDB automatycznie posprząta wygasłe wpisy.
  indexPromise ??= collection
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    .catch((error: unknown) => {
      indexPromise = undefined;
      throw error;
    });

  await indexPromise;

  const now = new Date();
  const windowEnd = new Date(now.getTime() + WINDOW_MS);

  // Atomowe zwiększenie licznika w MongoDB.
  // Po wygaśnięciu okna licznik zaczyna od 1.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const record = await collection.findOneAndUpdate(
        { _id: key },
        [
          {
            $set: {
              count: {
                $cond: [
                  { $gt: ["$windowEndsAt", now] },
                  {
                    $min: [
                      MAX_ORDERS + 1,
                      {
                        $add: [{ $ifNull: ["$count", 0] }, 1],
                      },
                    ],
                  },
                  1,
                ],
              },
              windowEndsAt: {
                $cond: [
                  { $gt: ["$windowEndsAt", now] },
                  "$windowEndsAt",
                  windowEnd,
                ],
              },
              expiresAt: {
                $cond: [
                  { $gt: ["$windowEndsAt", now] },
                  "$windowEndsAt",
                  windowEnd,
                ],
              },
            },
          },
        ],
        {
          upsert: true,
          returnDocument: "after",
        },
      );

      if (!record) {
        throw new Error("Nie udało się sprawdzić limitu.");
      }

      const allowed = record.count <= MAX_ORDERS;

      return {
        allowed,
        retryAfterSeconds: allowed
          ? 0
          : Math.max(
              1,
              Math.ceil((record.windowEndsAt.getTime() - Date.now()) / 1000),
            ),
      };
    } catch (error) {
      // Dwie równoległe pierwsze próby mogą próbować
      // utworzyć ten sam wpis. Wtedy ponawiamy.
      if (
        error instanceof MongoServerError &&
        error.code === 11000 &&
        attempt < 2
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Nie udało się sprawdzić limitu.");
}
