import { NextRequest, NextResponse } from "next/server";

import { getAdminSession, verifyAdminCredentials } from "@/lib/admin-auth";

import {
  getAdminLoginLockSeconds,
  recordFailedAdminLogin,
  clearFailedAdminLogins,
} from "@/lib/admin-login-rate-limit";

function lockedResponse(seconds: number) {
  const minutes = Math.ceil(seconds / 60);

  return NextResponse.json(
    {
      error: `Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za ${minutes} min.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(seconds),
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function POST(request: NextRequest) {
  try {
    // Sprawdzamy pochodzenie żądania.
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

    // Wymagamy JSON.
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json(
        { error: "Nieprawidłowy format danych." },
        { status: 415 },
      );
    }

    // Sprawdzamy blokadę jeszcze przed weryfikacją hasła.
    const lockSeconds = await getAdminLoginLockSeconds();

    if (lockSeconds > 0) {
      return lockedResponse(lockSeconds);
    }

    const raw = await request.text();

    if (raw.length > 2048) {
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
        { error: "Nieprawidłowe dane." },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Nieprawidłowe dane." },
        { status: 400 },
      );
    }

    const { username, password } = body as Record<string, unknown>;

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username.length > 80 ||
      password.length > 128
    ) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane logowania." },
        { status: 400 },
      );
    }

    const valid = await verifyAdminCredentials(username, password);

    // Błędne dane — zapisujemy nieudaną próbę.
    if (!valid) {
      const newLockSeconds = await recordFailedAdminLogin();

      if (newLockSeconds > 0) {
        return lockedResponse(newLockSeconds);
      }

      return NextResponse.json(
        { error: "Nieprawidłowy login lub hasło." },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    // Poprawne hasło — czyścimy licznik błędów.
    await clearFailedAdminLogins();

    // Tworzymy sesję administratora.
    const session = await getAdminSession();

    session.isAdmin = true;
    await session.save();

    return NextResponse.json(
      { success: true },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Błąd logowania administratora:", error);

    return NextResponse.json(
      { error: "Nie udało się zalogować." },
      { status: 500 },
    );
  }
}
