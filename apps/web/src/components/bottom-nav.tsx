"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Radio, Target, ClipboardList } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}

const items: NavItem[] = [
  {
    href: "/",
    label: "Matches",
    icon: Compass,
    match: (p) => p === "/",
  },
  {
    href: "/matches/saarland-open-2027",
    label: "Live",
    icon: Radio,
    match: (p) => p.startsWith("/matches/"),
  },
  {
    href: "/score",
    label: "Scoring",
    icon: Target,
    match: (p) => p.startsWith("/score"),
  },
  {
    href: "/manage",
    label: "Director",
    icon: ClipboardList,
    match: (p) => p.startsWith("/manage"),
  },
];

// Nur für Phone-Breite (md:hidden) — Tablet/Desktop nutzen die Nav im Header.
// Bleibt jetzt auf JEDER Seite sichtbar, auch /score — Nutzer sollen nie
// ohne Navigationsmöglichkeit dastehen. Die eigene Aktionsleiste des
// RO-Scoring-Loops (REVIEW SCORE/CONFIRM) sitzt dafür auf Mobile über
// dieser Bar (bottom-16 statt bottom-0, siehe score/page.tsx), statt sie
// zu verdrängen.
export function BottomNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium uppercase tracking-wide transition-colors ${
                active ? "text-accent" : "text-text-muted"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
