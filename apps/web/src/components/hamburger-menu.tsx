"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Settings, UserCircle, LogOut, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

// Persistenter Einstiegspunkt für Settings/Account — bewusst getrennt von
// der primären Navigation (Header-Links/BottomNav), weil "Einstellungen"
// und "Account" keine der vier Kernrollen-Flows sind, sondern App-weite
// Verwaltung.
export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

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
          <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-surface-raised"
            >
              <Settings size={18} className="text-text-muted" />
              Einstellungen
            </Link>

            {user ? (
              <>
                <Link
                  href="/my-matches"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 border-t border-border px-4 py-3.5 text-sm transition-colors hover:bg-surface-raised"
                >
                  <Trophy size={18} className="text-text-muted" />
                  Meine Matches
                </Link>
                <div className="flex items-center gap-3 border-t border-border px-4 py-3.5 text-sm">
                  <UserCircle size={18} className="text-accent" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{user.name}</p>
                    <p className="truncate text-xs text-text-faint">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 border-t border-border px-4 py-3.5 text-left text-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-live"
                >
                  <LogOut size={18} />
                  Abmelden
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 border-t border-border px-4 py-3.5 text-sm transition-colors hover:bg-surface-raised"
              >
                <UserCircle size={18} className="text-text-muted" />
                Anmelden
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
