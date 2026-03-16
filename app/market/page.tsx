import Link from "next/link";
import { holdings, movers } from "../../lib/mock-data";

export default function MarketPage() {
  return (
    <main>
      <h1>Market</h1>
      <p>Holdings-aware tickets include projected quote and net position impact before submit.</p>
      <table className="table card">
        <thead>
          <tr>
            <th>Artist</th>
            <th>Projected quote</th>
            <th>Your holding</th>
            <th>Controls</th>
          </tr>
        </thead>
        <tbody>
          {movers.map((artist) => {
            const owned = holdings.find((h) => h.artist === artist.name);
            return (
              <tr key={artist.name}>
                <td>
                  <Link href={`/artists/${artist.name.toLowerCase().replace(/\s+/g, "-")}`}>{artist.name}</Link>
                </td>
                <td>{artist.quote} → {Number(artist.quote.replace("$", "")) + 3}</td>
                <td>{owned ? `${owned.qty} shares` : "No position"}</td>
                <td>Buy / Sell (max based on cash & holdings)</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
