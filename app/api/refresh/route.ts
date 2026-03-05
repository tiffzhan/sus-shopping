// file: app/api/refresh/route.ts
// Cron endpoint — call this via a scheduler (e.g. Vercel Cron, GitHub Actions).
// Secure it with CRON_SECRET in .env.local

import { NextResponse } from "next/server";
import { refreshAllTrackedItems } from "@/lib/search";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await refreshAllTrackedItems();
  return NextResponse.json({ success: true, timestamp: new Date() });
}
