import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "../components/ui/site-nav";

export const metadata: Metadata = {
  title: "Fantasy Label",
  description: "Music Momentum Market",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
