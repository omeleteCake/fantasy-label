import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

const artistSchema = z.object({
  name: z.string(),
  slug: z.string(),
  genre: z.string(),
  basePrice: z.number().positive(),
  kFactor: z.number().positive(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payload = z.array(artistSchema).parse(await req.json());
  await prisma.$transaction(payload.map((artist) => prisma.artist.upsert({
    where: { slug: artist.slug },
    create: artist,
    update: artist,
  })));

  return NextResponse.json({ imported: payload.length });
}
