import { prisma } from "@/lib/prisma";

export default async function Dashboard() {
  const [artists, users, weeklyTop] = await Promise.all([
    prisma.artist.count(),
    prisma.user.count(),
    prisma.weeklyUserScore.findMany({ orderBy: { score: "desc" }, take: 5, include: { user: true, week: true } }),
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Fantasy Label Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded bg-zinc-900 p-4">Artists: {artists}</div>
        <div className="rounded bg-zinc-900 p-4">Users: {users}</div>
        <div className="rounded bg-zinc-900 p-4">Season length: 4 weeks</div>
      </div>
      <div>
        <h2 className="mb-2 text-xl">Top Weekly Scores</h2>
        <ul className="space-y-2">
          {weeklyTop.map((entry) => (
            <li key={entry.id} className="rounded bg-zinc-900 p-3">
              {entry.user.name ?? entry.user.email} — {Number(entry.score).toFixed(2)} ({entry.week.id})
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
