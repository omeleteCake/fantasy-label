import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ArtistDetail({ params }: { params: { id: string } }) {
  const artist = await prisma.artist.findUnique({ where: { id: params.id } });
  if (!artist) notFound();

  return (
    <article className="space-y-3">
      <h1 className="text-3xl font-semibold">{artist.name}</h1>
      <p className="text-zinc-300">{artist.description}</p>
      <div className="rounded bg-zinc-900 p-4">Base price: {Number(artist.basePrice).toFixed(2)}</div>
      <div className="rounded bg-zinc-900 p-4">k factor: {Number(artist.kFactor).toFixed(6)}</div>
    </article>
  );
}
