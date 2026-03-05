// file: app/api/tracked-items/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await prisma.trackedItem.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      searchResults: { orderBy: { score: "desc" } },
      wishlistItems: { where: { userId: session.user.id } },
    },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const item = await prisma.trackedItem.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.trackedItem.update({
    where: { id: params.id },
    data: {
      title: body.title ?? item.title,
      brand: body.brand ?? item.brand,
      size: body.size ?? item.size,
      color: body.color ?? item.color,
      keywords: body.keywords ?? item.keywords,
      maxPrice: body.maxPrice !== undefined ? (body.maxPrice ? parseFloat(body.maxPrice) : null) : item.maxPrice,
      condition: body.condition ?? item.condition,
      category: body.category ?? item.category,
      notes: body.notes ?? item.notes,
      notifyMe: body.notifyMe ?? item.notifyMe,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await prisma.trackedItem.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.trackedItem.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
