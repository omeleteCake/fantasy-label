import { prisma } from "@/lib/prisma";

export default async function WeeklyLeaderboardPage() {
  const rows = await prisma.weeklyUserScore.findMany({ orderBy: { score: "desc" }, include: { user: true, week: true }, take: 100 });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Weekly Leaderboard</h1>
      <ol className="space-y-2">
        {rows.map((row, i) => (
          <li key={row.id} className="rounded bg-zinc-900 p-3">#{i + 1} {row.user.name ?? row.user.email} — {Number(row.score).toFixed(2)} ({row.week.id})</li>
        ))}
      </ol>
    </div>
  );
}
