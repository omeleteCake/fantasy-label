import { prisma } from "@/lib/prisma";

export default async function LineupPage() {
  const artists = await prisma.artist.findMany({ orderBy: { name: "asc" }, take: 20 });
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Lineup Builder</h1>
      <p>Select 5 owned cards through the API endpoint /api/lineups.</p>
      <ul className="grid grid-cols-2 gap-2">
        {artists.map((a) => (
          <li key={a.id} className="rounded bg-zinc-900 p-2">{a.name}</li>
        ))}
      </ul>
    </div>
  );
}
