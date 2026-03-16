import { prisma } from "@/lib/prisma";
import { seasonIdFromWeekStart, toUtcStartOfWeek, weekIdFromDate } from "@/lib/time";

export const ensureWeekForDate = async (date: Date = new Date()) => {
  const startAt = toUtcStartOfWeek(date);
  const endAt = new Date(startAt.getTime() + 7 * 24 * 3600 * 1000 - 1000);
  const weekId = weekIdFromDate(startAt);
  const seasonId = seasonIdFromWeekStart(startAt);

  await prisma.season.upsert({
    where: { id: seasonId },
    create: {
      id: seasonId,
      name: seasonId,
      startAt,
      endAt: new Date(startAt.getTime() + 4 * 7 * 24 * 3600 * 1000 - 1000),
    },
    update: {},
  });

  return prisma.week.upsert({
    where: { id: weekId },
    create: {
      id: weekId,
      startAt,
      endAt,
      lineupLockAt: startAt,
      seasonId,
    },
    update: {},
  });
};
