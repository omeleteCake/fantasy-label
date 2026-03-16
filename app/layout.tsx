import "./globals.css";
import Link from "next/link";
import { AnalyticsProvider } from "@/components/analytics-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AnalyticsProvider />
        <header className="border-b border-zinc-800">
          <nav className="mx-auto flex max-w-6xl items-center gap-4 p-4 text-sm">
            <Link href="/">Dashboard</Link>
            <Link href="/market">Market</Link>
            <Link href="/portfolio">Portfolio</Link>
            <Link href="/lineup">Lineup</Link>
            <Link href="/leaderboard/weekly">Weekly Board</Link>
            <Link href="/leaderboard/season">Season Board</Link>
            <Link href="/admin">Admin</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl p-4">{children}</main>
      </body>
    </html>
  );
}
