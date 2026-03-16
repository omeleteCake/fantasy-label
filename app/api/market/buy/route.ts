import { NextRequest, NextResponse } from 'next/server';
import { MarketService } from '@/lib/services/market.service';

export async function POST(req: NextRequest) {
  try {
    const { userId, artistId, quantity } = await req.json();

    const quote = await MarketService.buyArtist(userId, artistId, Number(quantity));

    return NextResponse.json({ ok: true, quote });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 },
    );
  }
}
