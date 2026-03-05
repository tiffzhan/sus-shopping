import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.trackedItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { searchResults: true } },
      wishlistItems: { where: { userId: session.user.id }, select: { newMatchCount: true } },
    },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, brand, size, color, keywords, maxPrice, condition, category, notes, notifyMe } = body;

  if (!title || !category) {
    return NextResponse.json({ error: "title and category required" }, { status: 400 });
  }

  const item = await prisma.trackedItem.create({
    data: {
      userId: session.user.id,
      title,
      brand: brand || null,
      size: size || null,
      color: color || null,
      keywords: keywords || "",
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      condition: condition || null,
      category,
      notes: notes || null,
      notifyMe: notifyMe ?? false,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
