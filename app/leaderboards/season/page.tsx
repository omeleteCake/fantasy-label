import { fantasyLeaderboard } from "../../../lib/mock-data";

export default function SeasonLeaderboardPage() {
  return (
    <main>
      <h1>Season Fantasy Leaderboard</h1>
      <p className="pill">Primary competition surface</p>
      <table className="table card">
        <thead><tr><th>Rank</th><th>Player</th><th>Season score</th></tr></thead>
        <tbody>
          {fantasyLeaderboard.map((row) => (
            <tr key={row.user}><td>#{row.rank}</td><td>{row.user}</td><td>{row.season}</td></tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
