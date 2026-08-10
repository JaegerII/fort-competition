import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { TopographyBackground } from "@/components/topography-background";
import { FortLogo } from "@/components/fort-logo";
import { BottomNav } from "@/components/bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FORT Competition (Prototyp)",
  description:
    "Klickbarer Prototyp — Match Discovery, Live-Match-Seite, RO-Scoring-Loop. Fake-Daten, kein Backend.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        <TopographyBackground />
        <div className="bg-warning-dim border-b border-border text-warning text-xs sm:text-sm px-4 py-2 text-center">
          Prototyp (Phase 6 vorgezogen) — Fake-Daten, kein Backend, keine
          echte Ruleset-Engine
        </div>
        <header className="border-b border-border">
          <nav className="max-w-6xl mx-auto flex items-center gap-6 px-4 py-4">
            <Link href="/" className="flex items-center gap-2.5">
              <FortLogo className="h-6 w-auto text-text" />
              <span className="text-sm font-bold uppercase tracking-[0.14em]">
                FORT <span className="text-text-muted">Competition</span>
              </span>
            </Link>
            {/* Ab md: Textlinks im Header. Darunter übernimmt die BottomNav
                die Navigation — beides gleichzeitig zu zeigen wäre auf dem
                Phone redundant (Spec §25: pro Device-Klasse optimieren, nicht
                nur skalieren). */}
            <div className="hidden md:flex gap-4 text-sm text-text-muted">
              <Link href="/" className="hover:text-text transition-colors">
                Matches
              </Link>
              <Link
                href="/matches/saarland-open-2027"
                className="hover:text-text transition-colors"
              >
                Live-Match
              </Link>
              <Link href="/score" className="hover:text-text transition-colors">
                RO-Scoring
              </Link>
              <Link href="/manage" className="hover:text-text transition-colors">
                Match Director
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
