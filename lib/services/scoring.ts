import { JobStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runWeeklyScoring = async (weekId: string) => {
  return prisma.$transaction(async (tx) => {
    const existingJob = await tx.scoringJob.findUnique({ where: { weekId } });
    if (existingJob?.status === JobStatus.DONE) return { status: "already_scored" };

    await tx.scoringJob.upsert({
      where: { weekId },
      create: { weekId, status: JobStatus.RUNNING },
      update: { status: JobStatus.RUNNING },
    });

    const lineups = await tx.weeklyLineup.findMany({
      where: { weekId },
      include: { entries: true },
    });
    const metrics = await tx.weeklyArtistMetric.findMany({ where: { weekId } });
    const metricMap = new Map(metrics.map((m) => [m.artistId, Number(m.score)]));
    const week = await tx.week.findUniqueOrThrow({ where: { id: weekId } });

    for (const lineup of lineups) {
      const score = lineup.entries.reduce((acc, e) => acc + (metricMap.get(e.artistId) ?? 0), 0);
      await tx.weeklyUserScore.upsert({
        where: { weekId_userId: { weekId, userId: lineup.userId } },
        create: { weekId, userId: lineup.userId, score },
        update: { score },
      });
      await tx.seasonUserScore.upsert({
        where: { seasonId_userId: { seasonId: week.seasonId, userId: lineup.userId } },
        create: { seasonId: week.seasonId, userId: lineup.userId, score },
        update: { score: { increment: new Prisma.Decimal(score) } },
      });
    }

    await tx.scoringJob.update({ where: { weekId }, data: { status: JobStatus.DONE, finishedAt: new Date() } });
    return { status: "scored", lineups: lineups.length };
  });
};
