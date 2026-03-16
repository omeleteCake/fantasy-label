import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function MarketPage() {
  const artists = await prisma.artist.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Market</h1>
      <div className="grid gap-3">
        {artists.map((artist) => (
          <Link key={artist.id} href={`/artist/${artist.id}`} className="rounded bg-zinc-900 p-4">
            <div className="font-medium">{artist.name}</div>
            <div className="text-sm text-zinc-300">Supply: {artist.supply}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
