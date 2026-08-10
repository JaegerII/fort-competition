"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Settings, UserCircle } from "lucide-react";

// Persistenter Einstiegspunkt für Settings/Account — bewusst getrennt von
// der primären Navigation (Header-Links/BottomNav), weil "Einstellungen"
// und "Account" keine der vier Kernrollen-Flows sind, sondern App-weite
// Verwaltung. Account ist als Platzhalter markiert, bis FORT Athlete
// (Spec §29, gemeinsame Identität mit FORT Performance) angebunden ist.
export function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative ml-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-surface-raised"
            >
              <Settings size={18} className="text-text-muted" />
              Einstellungen
            </Link>
            <div className="flex items-center justify-between gap-3 px-4 py-3.5 text-sm text-text-faint">
              <span className="flex items-center gap-3">
                <UserCircle size={18} />
                Account
              </span>
              <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                Bald
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
