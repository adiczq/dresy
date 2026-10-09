import "server-only";

import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";

const scryptAsync = promisify(scrypt);

type AdminSession = {
  isAdmin?: boolean;
};

export async function getAdminSession() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("Brak poprawnego ADMIN_SESSION_SECRET");
  }

  return getIronSession<AdminSession>(await cookies(), {
    password: secret,
    cookieName: "dresy_admin_session",
    ttl: 60 * 60 * 8,
    cookieOptions: {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production" ||
        process.env.APP_ORIGIN?.startsWith("https://") === true,
      sameSite: "lax",
      path: "/",
    },
  });
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const stored = process.env.ADMIN_PASSWORD_HASH ?? "";
  const [salt, hash] = stored.split(":");

  if (!salt || !hash || !/^[a-f0-9]{128}$/.test(hash)) {
    throw new Error("Nieprawidłowy ADMIN_PASSWORD_HASH");
  }

  const expected = Buffer.from(hash, "hex");

  const actual = (await scryptAsync(password, salt, expected.length)) as Buffer;

  const passwordValid = timingSafeEqual(expected, actual);
  const usernameValid = username === process.env.ADMIN_USERNAME;

  return usernameValid && passwordValid;
}
