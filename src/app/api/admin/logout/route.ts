import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  const allowedOrigins = [
    process.env.APP_ORIGIN?.trim().replace(/\/$/, ""),
    ...(process.env.NODE_ENV !== "production" ? ["http://localhost:3000"] : []),
  ];

  if (!origin || !allowedOrigins.includes(origin)) {
    return NextResponse.json(
      { error: "Niedozwolone żądanie." },
      { status: 403 },
    );
  }

  const session = await getAdminSession();

  session.destroy();

  return new Response(null, {
    status: 303,
    headers: {
      Location: "/admin/login",
      "Cache-Control": "no-store",
    },
  });
}
