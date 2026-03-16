import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.seasonUserScore.findMany({ orderBy: { score: "desc" }, include: { user: true, season: true }, take: 100 });
  return NextResponse.json(rows);
}
