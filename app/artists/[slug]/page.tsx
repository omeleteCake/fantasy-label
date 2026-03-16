import { holdings } from "../../../lib/mock-data";

export default function ArtistDetailPage({ params }: { params: { slug: string } }) {
  const artistName = params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const myHolding = holdings.find((h) => h.artist.toLowerCase() === artistName.toLowerCase());

  return (
    <main>
      <h1>{artistName}</h1>
      <div className="grid grid-2">
        <div className="card">
          <h3>Trade ticket</h3>
          <p>Projected quote before submit: <strong>$186</strong></p>
          <p>Holding-aware controls: max sell {myHolding?.qty ?? 0}, suggested buy 2.</p>
          <p>Estimated fee: 2% · Estimated slippage: 0.9%</p>
        </div>
        <div className="card">
          <h3>Score trend + metrics</h3>
          <p>4-week APS trend: 71 → 77 → 83 → 92</p>
          <ul>
            <li>Views growth: +18%</li>
            <li>Engagement growth: +11%</li>
            <li>Momentum confidence: High</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
