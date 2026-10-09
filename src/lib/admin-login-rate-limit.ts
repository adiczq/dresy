import "server-only";

import { getDb } from "@/lib/mongodb";

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

// Jeden wspólny login trenerów.
const LOGIN_KEY = "trainer-admin-login";

type LoginAttempt = {
  _id: string;
  failures?: number;
  lastFailureAt?: Date;
  lockedUntil?: Date;
};

async function getCollection() {
  const db = await getDb();

  return db.collection<LoginAttempt>("admin_login_limits");
}

function secondsUntil(until?: Date): number {
  if (!until) return 0;

  return Math.max(0, Math.ceil((until.getTime() - Date.now()) / 1000));
}

// Sprawdza aktywną blokadę.
export async function getAdminLoginLockSeconds(): Promise<number> {
  const collection = await getCollection();

  const record = await collection.findOne({
    _id: LOGIN_KEY,
  });

  return secondsUntil(record?.lockedUntil);
}

// Zapisuje nieudaną próbę logowania.
export async function recordFailedAdminLogin(): Promise<number> {
  const collection = await getCollection();

  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);
  const lockUntil = new Date(now.getTime() + LOCK_MS);

  const record = await collection.findOneAndUpdate(
    { _id: LOGIN_KEY },
    [
      {
        $set: {
          failures: {
            $cond: [
              { $gte: ["$lastFailureAt", windowStart] },
              {
                $add: [{ $ifNull: ["$failures", 0] }, 1],
              },
              1,
            ],
          },
          lastFailureAt: now,
        },
      },
      {
        $set: {
          lockedUntil: {
            $cond: [
              { $gte: ["$failures", MAX_FAILURES] },
              lockUntil,
              "$$REMOVE",
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

  return secondsUntil(record?.lockedUntil);
}

// Po poprawnym zalogowaniu zeruje błędne próby.
export async function clearFailedAdminLogins(): Promise<void> {
  const collection = await getCollection();

  await collection.deleteOne({
    _id: LOGIN_KEY,
  });
}
