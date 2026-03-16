import { portfolioLeaderboard } from "../../../lib/mock-data";

export default function PortfolioLeaderboardPage() {
  return (
    <main>
      <h1>Portfolio Leaderboard</h1>
      <p style={{ opacity: 0.7 }}>Secondary to fantasy leaderboards by design.</p>
      <table className="table card">
        <thead><tr><th>Rank</th><th>Player</th><th>Portfolio value</th></tr></thead>
        <tbody>
          {portfolioLeaderboard.map((row) => (
            <tr key={row.user}><td>#{row.rank}</td><td>{row.user}</td><td>{row.value}</td></tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
