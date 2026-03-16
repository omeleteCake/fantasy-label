import Link from "next/link";

const links = [
  ["Landing", "/"],
  ["How it works", "/how-it-works"],
  ["Market", "/market"],
  ["Dashboard", "/dashboard"],
  ["Weekly LB", "/leaderboards/weekly"],
  ["Season LB", "/leaderboards/season"],
  ["Portfolio LB", "/leaderboards/portfolio"],
  ["Admin", "/admin/artist-manager"],
];

export function SiteNav() {
  return (
    <nav className="nav">
      {links.map(([label, href]) => (
        <Link key={href} href={href}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
