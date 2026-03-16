import { SectionCard } from "../../components/ui/section-card";
import { lineup, movers } from "../../lib/mock-data";

export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>
      <div className="grid grid-3">
        <SectionCard title="Cash balance">
          <div className="metric">$84,320</div>
        </SectionCard>
        <SectionCard title="Total portfolio value">
          <div className="metric">$121,770</div>
        </SectionCard>
        <SectionCard title="Countdown to lineup lock">
          <div className="metric">01d 11h 28m</div>
        </SectionCard>
      </div>

      <div className="grid grid-2" style={{ marginTop: "1rem" }}>
        <SectionCard title="Current lineup" subtitle="Locked artists for this scoring week">
          <ul>
            {lineup.map((artist) => (
              <li key={artist}>{artist}</li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Top movers" subtitle="Strongest price change in the last 24h">
          <ul>
            {movers.map((m) => (
              <li key={m.name}>
                {m.name} · {m.quote} <span className="pill">{m.change}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="grid grid-2" style={{ marginTop: "1rem" }}>
        <SectionCard title="Weekly rank">
          <div className="metric">#12</div>
        </SectionCard>
        <SectionCard title="Season rank">
          <div className="metric">#21</div>
        </SectionCard>
      </div>
    </main>
  );
}
