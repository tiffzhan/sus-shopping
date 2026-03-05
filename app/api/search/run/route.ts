// POST /api/search/run — run marketplace search for one or all tracked items.

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  runSearchForTrackedItem,
  runSearchForAllTrackedItems,
} from "@/src/services/searchService"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { trackedItemId } = body as { trackedItemId?: string }

  try {
    if (trackedItemId) {
      // Verify ownership before searching
      const item = await prisma.trackedItem.findFirst({
        where: { id: trackedItemId, userId: session.user.id },
      })
      if (!item) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }

      const counts = await runSearchForTrackedItem(trackedItemId)

      await prisma.event.create({
        data: {
          userId: session.user.id,
          type: "search",
          payload: JSON.stringify({ trackedItemId }),
        },
      })

      return NextResponse.json({ success: true, ...counts })
    }

    // Run for all of the user's tracked items
    const result = await runSearchForAllTrackedItems(session.user.id)

    await prisma.event.create({
      data: {
        userId: session.user.id,
        type: "search",
        payload: JSON.stringify({
          scope: "all",
          itemCount: result.itemCount,
        }),
      },
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[api/search/run] Error:", error)
    return NextResponse.json(
      { error: "Search failed", details: String(error) },
      { status: 500 },
    )
  }
}
