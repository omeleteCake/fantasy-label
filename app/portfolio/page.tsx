import { prisma } from "@/lib/prisma";

export default async function PortfolioPage() {
  const user = await prisma.user.findFirst({ include: { wallet: true, holdings: { include: { artist: true } } } });
  if (!user) return <p>No users yet. Seed and sign in first.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Portfolio</h1>
      <div className="rounded bg-zinc-900 p-4">Cash: {Number(user.wallet?.balance ?? 0).toFixed(2)}</div>
      <ul className="space-y-2">
        {user.holdings.map((h) => (
          <li key={h.id} className="rounded bg-zinc-900 p-4">
            {h.artist.name}: {h.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
}
