import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { TopographyBackground } from "@/components/topography-background";
import { FortLogo } from "@/components/fort-logo";
import { BottomNav } from "@/components/bottom-nav";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { AuthProvider } from "@/contexts/auth-context";
import { RegistrationsProvider } from "@/contexts/registrations-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Wie in topography-background.tsx: Next löst `manifest`/`icons` in der
// Metadata-API NICHT automatisch gegen basePath auf (empirisch geprüft,
// nicht angenommen — s. Bug/Fix-Historie bei topo-bg.png). Gleicher
// NEXT_PUBLIC_BASE_PATH-Mechanismus aus next.config.ts wird hier reused.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "FORT Competition (Prototyp)",
  description:
    "Klickbarer Prototyp — Match Discovery, Live-Match-Seite, RO-Scoring-Loop. Fake-Daten, kein Backend.",
  // PWA/Installability — Vorstufe für App-Store-Wrapping (Capacitor o.ä.,
  // siehe docs/PRODUCT_SPECIFICATION.md §12.1): Home-Screen-Icon, Standalone-
  // Display, Theme-Farbe.
  manifest: `${basePath}/manifest.webmanifest`,
  icons: {
    icon: [
      { url: `${basePath}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${basePath}/icons/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: `${basePath}/icons/apple-touch-icon.png`,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FORT Competition",
  },
};

export const viewport: Viewport = {
  themeColor: "#081e24",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* min-h-dvh statt min-h-full/h-full-Prozentkette: dvh reagiert live auf
          das Ein-/Ausblenden der Adressleiste in mobilen Browsern, statt bei
          jeder Größenänderung des Sichtfensters gegen den zuletzt bekannten
          %-Wert des Elternelements zu layouten — genau das verursacht das
          "Footer verrutscht"-Verhalten auf echten Handys. */}
      <body className="min-h-dvh flex flex-col bg-bg text-text">
        <AuthProvider>
        <RegistrationsProvider>
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
            <HamburgerMenu />
          </nav>
        </header>
        {/* Padding statt fixem pb-20: env(safe-area-inset-bottom) wächst auf
            Geräten mit Home-Indicator (die BottomNav bekommt dieselbe
            Reserve), sonst schneidet die höhere reale Nav-Leiste den
            letzten sichtbaren Content-Abschnitt an. */}
        <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
        <BottomNav />
        </RegistrationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
