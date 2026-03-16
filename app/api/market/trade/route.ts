import { OrderSide } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { executeTrade } from "@/lib/services/trading";

const schema = z.object({ artistId: z.string(), side: z.nativeEnum(OrderSide), quantity: z.number().int().positive(), idempotencyKey: z.string().optional() });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.parse(await req.json());
  const trade = await executeTrade(session.user.id, body.artistId, body.side, body.quantity, body.idempotencyKey);
  return NextResponse.json(trade);
}
