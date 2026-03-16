import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PricingService } from '@/lib/services/pricing.service';

const prisma = new PrismaClient();

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: Params) {
  try {
    const artist = await prisma.artist.findUnique({ where: { id: params.id } });
    if (!artist) {
      return NextResponse.json({ ok: false, error: 'Artist not found' }, { status: 404 });
    }

    const spotPrice = PricingService.getSpotPrice({
      basePrice: Number(artist.basePrice),
      k: Number(artist.k),
      supply: artist.circulatingSupply,
    });

    return NextResponse.json({
      ok: true,
      artistId: artist.id,
      spotPrice,
      circulatingSupply: artist.circulatingSupply,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
