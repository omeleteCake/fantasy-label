import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

const metricSchema = z.object({ weekId: z.string(), artistId: z.string(), score: z.number(), source: z.string().default("admin") });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payload = z.array(metricSchema).parse(await req.json());
  await prisma.$transaction(payload.map((m) => prisma.weeklyArtistMetric.upsert({
    where: { weekId_artistId: { weekId: m.weekId, artistId: m.artistId } },
    create: m,
    update: { score: m.score, source: m.source },
  })));
  return NextResponse.json({ imported: payload.length });
}
