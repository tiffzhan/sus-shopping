// file: app/api/events/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = [
  "view_listing",
  "favorite_listing",
  "add_to_wishlist",
  "dismiss_listing",
  "click_outbound",
  "search",
];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, payload } = await req.json();
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      userId: session.user.id,
      type,
      payload: typeof payload === "string" ? payload : JSON.stringify(payload ?? {}),
    },
  });
  return NextResponse.json(event, { status: 201 });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const events = await prisma.event.findMany({
    where: {
      userId: session.user.id,
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 500),
  });
  return NextResponse.json(events);
}
