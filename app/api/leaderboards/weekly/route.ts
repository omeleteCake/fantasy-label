import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.weeklyUserScore.findMany({ orderBy: { score: "desc" }, include: { user: true, week: true }, take: 100 });
  return NextResponse.json(rows);
}
