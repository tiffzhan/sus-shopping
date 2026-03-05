// file: app/api/tracked-items/[id]/search/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchForItem } from "@/lib/search";
import { CONNECTOR_MAP } from "@/lib/connectors";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await prisma.trackedItem.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const enabledMarketplaces: string[] | undefined = body.marketplaces;

  await searchForItem(item, enabledMarketplaces);

  // Log search event
  await prisma.event.create({
    data: {
      userId: session.user.id,
      type: "search",
      payload: JSON.stringify({ trackedItemId: item.id, marketplaces: enabledMarketplaces }),
    },
  });

  // Return fresh results
  const results = await prisma.searchResult.findMany({
    where: { trackedItemId: item.id },
    orderBy: { score: "desc" },
  });

  return NextResponse.json({ results, lastSearchedAt: new Date() });
}

// GET: return connector search URLs for manual browsing
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await prisma.trackedItem.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const queryParams = {
    title: item.title,
    brand: item.brand ?? undefined,
    size: item.size ?? undefined,
    color: item.color ?? undefined,
    keywords: item.keywords,
    maxPrice: item.maxPrice ?? undefined,
  };

  const urls: Record<string, string> = {};
  for (const [name, connector] of Object.entries(CONNECTOR_MAP)) {
    urls[name] = connector.buildSearchUrl(queryParams);
  }
  return NextResponse.json({ urls });
}
