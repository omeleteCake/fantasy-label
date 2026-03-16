import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { submitLineup } from "@/lib/services/lineup";

const schema = z.object({ artistIds: z.array(z.string()) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.parse(await req.json());
  const lineup = await submitLineup(session.user.id, body.artistIds);
  return NextResponse.json(lineup);
}
