import { prisma } from "@/lib/prisma";
import { ensureWeekForDate } from "@/lib/services/week";

export const submitLineup = async (userId: string, artistIds: string[]) => {
  const unique = [...new Set(artistIds)];
  if (unique.length !== 5) throw new Error("Lineup must include exactly 5 unique artists");

  const week = await ensureWeekForDate(new Date());
  const now = new Date();
  if (now >= week.lineupLockAt) throw new Error("Lineup lock has passed");

  const holdings = await prisma.holding.findMany({ where: { userId, artistId: { in: unique }, quantity: { gt: 0 } } });
  if (holdings.length !== 5) throw new Error("You must own all selected artists");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.weeklyLineup.findUnique({ where: { userId_weekId: { userId, weekId: week.id } } });
    if (existing) {
      throw new Error("Lineup already locked for this week");
    }

    return tx.weeklyLineup.create({
      data: {
        userId,
        weekId: week.id,
        lockedAt: week.lineupLockAt,
        entries: { create: unique.map((artistId, idx) => ({ artistId, position: idx + 1 })) },
      },
      include: { entries: true },
    });
  });
};
