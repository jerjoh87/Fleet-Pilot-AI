import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * Lightweight health check for uptime monitors (UptimeRobot, BetterStack, etc.).
 * Returns 200 when the app is serving and the database answers, 503 otherwise.
 * Intentionally exposes no internal detail beyond up/down status.
 */
export async function GET() {
  const startedAt = Date.now();

  let database: "up" | "down" | "unconfigured" = "unconfigured";
  if (isDatabaseConfigured()) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = "up";
    } catch {
      database = "down";
    }
  }

  const healthy = database !== "down";
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      database,
      uptimeCheckMs: Date.now() - startedAt,
      timestamp: new Date().toISOString()
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" }
    }
  );
}
