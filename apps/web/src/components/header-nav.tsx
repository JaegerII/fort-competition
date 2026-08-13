"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
}

const items: NavItem[] = [
  { href: "/", label: "Matches", match: (p) => p === "/" },
  {
    href: "/matches/saarland-open-2027",
    label: "Live-Match",
    match: (p) => p.startsWith("/matches/"),
  },
  { href: "/score", label: "RO-Scoring", match: (p) => p.startsWith("/score") },
  {
    href: "/manage",
    label: "Match Director",
    match: (p) => p.startsWith("/manage"),
  },
];

// War bisher ein statischer <div> ohne jede Info, welcher Link zur aktuell
// offenen Seite gehört — die BottomNav (mobil) hat das schon (aria-current,
// Akzentfarbe), der Desktop-Header nicht. Gleiche Logik wie dort, nur als
// eigene Client-Komponente, weil usePathname() gebraucht wird und das
// Root-Layout ein Server Component bleibt.
export function HeaderNav() {
  const pathname = usePathname() ?? "/";

  return (
    <div className="hidden md:flex gap-4 text-sm text-text-muted">
      {items.map(({ href, label, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`transition-colors hover:text-text ${active ? "text-text font-medium" : ""}`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
