import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { wallet: true, holdings: { include: { artist: true } }, transactions: { take: 50, orderBy: { createdAt: "desc" } } },
  });
  return NextResponse.json(data);
}
