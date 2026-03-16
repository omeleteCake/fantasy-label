import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    include: { wallet: true, holdings: { include: { artist: true } } },
  });

  const board = users
    .map((u) => {
      const holdingsValue = u.holdings.reduce((acc, h) => acc + h.quantity * Number(h.artist.basePrice), 0);
      const total = Number(u.wallet?.balance ?? 0) + holdingsValue;
      return { userId: u.id, name: u.name ?? u.email, totalValue: total };
    })
    .sort((a, b) => b.totalValue - a.totalValue);

  return NextResponse.json(board);
}
