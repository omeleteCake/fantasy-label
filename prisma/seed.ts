import { PrismaClient, Prisma } from "@prisma/client";
import { ensureWeekForDate } from "../lib/services/week";

const prisma = new PrismaClient();

const genres = ["Pop", "Hip-Hop", "Rock", "EDM", "Country"];

async function main() {
  await prisma.artist.deleteMany();

  const artists = Array.from({ length: 50 }, (_, i) => {
    const n = i + 1;
    return {
      name: `Artist ${n}`,
      slug: `artist-${n}`,
      genre: genres[i % genres.length],
      description: `Synthetic sample artist ${n} for v1 market simulation.`,
      basePrice: new Prisma.Decimal(8 + (i % 10)),
      kFactor: new Prisma.Decimal(0.0002 + (i % 4) * 0.0001),
    };
  });

  for (const artist of artists) {
    await prisma.artist.create({ data: artist });
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const startCash = new Prisma.Decimal(process.env.STARTING_CASH ?? "100000");

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Admin",
      isAdmin: true,
      wallet: { create: { balance: startCash } },
    },
    update: {},
  });

  await ensureWeekForDate(new Date());
  console.log("Seed complete with 50 artists.");
}

main().finally(async () => prisma.$disconnect());
