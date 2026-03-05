// file: app/api/saved/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const saved = await prisma.savedListing.findMany({
    where: { userId: session.user.id },
    include: { searchResult: true },
    orderBy: { savedAt: "desc" },
  });
  return NextResponse.json(saved);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchResultId } = await req.json();
  if (!searchResultId) return NextResponse.json({ error: "searchResultId required" }, { status: 400 });

  const saved = await prisma.savedListing.upsert({
    where: { userId_searchResultId: { userId: session.user.id, searchResultId } },
    update: {},
    create: { userId: session.user.id, searchResultId },
  });

  await prisma.event.create({
    data: {
      userId: session.user.id,
      type: "favorite_listing",
      payload: JSON.stringify({ searchResultId }),
    },
  });

  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchResultId } = await req.json();
  await prisma.savedListing.deleteMany({
    where: { userId: session.user.id, searchResultId },
  });
  return NextResponse.json({ success: true });
}
