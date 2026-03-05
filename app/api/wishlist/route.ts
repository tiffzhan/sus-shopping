// file: app/api/wishlist/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      trackedItem: {
        include: { searchResults: { orderBy: { score: "desc" }, take: 5 } },
      },
    },
    orderBy: { addedAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { trackedItemId } = await req.json();
  if (!trackedItemId) return NextResponse.json({ error: "trackedItemId required" }, { status: 400 });

  const item = await prisma.trackedItem.findFirst({
    where: { id: trackedItemId, userId: session.user.id },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const wl = await prisma.wishlistItem.upsert({
    where: { userId_trackedItemId: { userId: session.user.id, trackedItemId } },
    update: {},
    create: { userId: session.user.id, trackedItemId },
  });

  await prisma.event.create({
    data: {
      userId: session.user.id,
      type: "add_to_wishlist",
      payload: JSON.stringify({ trackedItemId }),
    },
  });

  return NextResponse.json(wl, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { trackedItemId } = await req.json();
  await prisma.wishlistItem.deleteMany({
    where: { userId: session.user.id, trackedItemId },
  });
  return NextResponse.json({ success: true });
}
