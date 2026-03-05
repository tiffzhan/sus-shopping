// file: prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@sus.shopping" },
    update: {},
    create: {
      email: "demo@sus.shopping",
      name: "Demo User",
      passwordHash,
    },
  });
  console.log(`✓ Created user: ${user.email}`);

  // Create tracked items
  const item1 = await prisma.trackedItem.create({
    data: {
      userId: user.id,
      title: "Arc'teryx Beta LT Jacket",
      brand: "Arc'teryx",
      size: "M",
      color: "Black",
      keywords: "arcteryx beta lt goretex shell",
      maxPrice: 350,
      condition: "like_new",
      category: "outerwear",
      notes: "Looking for the black colorway, size M. Will accept good condition.",
      notifyMe: true,
    },
  });

  const item2 = await prisma.trackedItem.create({
    data: {
      userId: user.id,
      title: "Levi's 501 Jeans",
      brand: "Levi's",
      size: "32x32",
      color: "Vintage Wash",
      keywords: "levis 501 straight leg denim vintage",
      maxPrice: 60,
      condition: "good",
      category: "bottoms",
      notifyMe: false,
    },
  });

  const item3 = await prisma.trackedItem.create({
    data: {
      userId: user.id,
      title: "New Balance 550 White",
      brand: "New Balance",
      size: "10",
      color: "White",
      keywords: "new balance 550 white cream sneakers",
      maxPrice: 120,
      condition: "like_new",
      category: "shoes",
      notifyMe: true,
    },
  });

  console.log(`✓ Created ${3} tracked items`);

  // Seed mock search results for item1
  const mockListings = [
    {
      trackedItemId: item1.id,
      externalId: "mock-ebay-001",
      title: "Arc'teryx Beta LT Jacket Men's Medium Black GORETEX",
      price: 289.99,
      currency: "USD",
      condition: "like_new",
      url: "https://www.ebay.com/itm/mock-001",
      imageUrl: "https://placehold.co/300x300/1a1a1a/ffffff?text=Beta+LT",
      marketplace: "ebay",
      location: "Seattle, WA",
      postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      score: 0.95,
      isNew: true,
    },
    {
      trackedItemId: item1.id,
      externalId: "mock-poshmark-001",
      title: "Arc'teryx Beta LT Shell Jacket - Black / Size M",
      price: 310,
      currency: "USD",
      condition: "good",
      url: "https://poshmark.com/listing/mock-001",
      imageUrl: "https://placehold.co/300x300/1a1a1a/ffffff?text=Poshmark",
      marketplace: "poshmark",
      location: "Portland, OR",
      postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      score: 0.78,
      isNew: false,
    },
    {
      trackedItemId: item1.id,
      externalId: "mock-ebay-002",
      title: "Arc'teryx Beta LT Gore-Tex Jacket Black Medium",
      price: 340,
      currency: "USD",
      condition: "new",
      url: "https://www.ebay.com/itm/mock-002",
      imageUrl: "https://placehold.co/300x300/1a1a1a/ffffff?text=Beta+LT+New",
      marketplace: "ebay",
      location: "Vancouver, BC",
      postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      score: 0.88,
      isNew: true,
    },
    {
      trackedItemId: item1.id,
      externalId: "mock-depop-001",
      title: "arcteryx beta lt jacket black size M",
      price: 275,
      currency: "USD",
      condition: "good",
      url: "https://www.depop.com/products/mock-001",
      imageUrl: "https://placehold.co/300x300/1a1a1a/ffffff?text=Depop",
      marketplace: "depop",
      location: "NYC",
      postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      score: 0.82,
      isNew: true,
    },
  ];

  for (const listing of mockListings) {
    await prisma.searchResult.upsert({
      where: {
        trackedItemId_externalId_marketplace: {
          trackedItemId: listing.trackedItemId,
          externalId: listing.externalId,
          marketplace: listing.marketplace,
        },
      },
      update: {},
      create: listing,
    });
  }
  console.log(`✓ Created ${mockListings.length} mock search results`);

  // Add item1 to wishlist
  await prisma.wishlistItem.upsert({
    where: { userId_trackedItemId: { userId: user.id, trackedItemId: item1.id } },
    update: {},
    create: {
      userId: user.id,
      trackedItemId: item1.id,
      newMatchCount: 3,
    },
  });
  console.log(`✓ Added item to wishlist`);

  await prisma.$disconnect();
  console.log("\n✅ Seed complete! Login: demo@sus.shopping / demo1234");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
