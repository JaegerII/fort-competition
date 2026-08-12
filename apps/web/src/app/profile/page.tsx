"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useRegistrations } from "@/contexts/registrations-context";
import { Badge } from "@/components/badge";

// "Mein Profil" für den eingeloggten (Mock-)Nutzer — bewusst getrennt von
// /athletes/[id] (spec §12, öffentliches Karriereprofil mit Historie/
// Analytics): ein frischer Mock-Login hat ehrlich gesagt keine echte
// Wettkampf-Historie, und die sollte hier nicht erfunden werden (gleiches
// Prinzip wie bei den "insight: null"-Athletenprofilen in mock-data.ts).
// Zeigt stattdessen einen echten Leer-Zustand + einen Link zum
// ausgearbeiteten Beispielprofil, damit die Analytics-Ansicht trotzdem
// erreichbar bleibt.
export default function ProfilePage() {
  const { user } = useAuth();
  const { registrations } = useRegistrations();

  if (!user) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Anmeldung erforderlich</h1>
        <p className="mt-2 text-sm text-text-muted">
          Melde dich an, um dein Profil zu sehen.
        </p>
        <Link
          href="/login?returnTo=%2Fprofile"
          className="mt-6 inline-block rounded-xl bg-accent px-5 py-3 font-medium text-bg hover:opacity-90 transition-opacity"
        >
          Zum Login
        </Link>
      </div>
    );
  }

  const initials = user.name.slice(0, 2).toUpperCase();
  const confirmedCount = registrations.filter(
    (r) => r.status === "confirmed",
  ).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface-raised font-mono text-xl text-text-muted">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <p className="truncate text-sm text-text-muted">{user.email}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-surface p-4 text-center">
          <p className="font-mono text-2xl font-semibold">
            {confirmedCount}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-text-muted">
            Registrierte Matches
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 text-center">
          <p className="font-mono text-2xl font-semibold">0</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-text-muted">
            Abgeschlossene Matches
          </p>
        </div>
      </div>

      {registrations.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              Anstehend
            </h2>
            <Link
              href="/my-matches"
              className="text-sm text-accent hover:underline"
            >
              Alle ansehen
            </Link>
          </div>
          <div className="space-y-2">
            {registrations.slice(0, 3).map((r) => (
              <Link
                key={r.matchId}
                href={`/matches/${r.matchId}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-sm hover:border-accent/50 transition-colors"
              >
                <span className="truncate">{r.matchName}</span>
                <Badge
                  tone={r.status === "waitlisted" ? "warning" : "accent"}
                >
                  {r.status === "waitlisted" ? "Warteliste" : "Angemeldet"}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <p className="text-sm text-text-muted">
          Noch keine Wettkampf-Historie. Deine Statistiken und
          Performance-Analytics erscheinen hier nach deinem ersten Match.
        </p>
        <Link
          href="/athletes/l-hoffmann"
          className="mt-4 inline-block text-sm text-accent hover:underline"
        >
          So sieht ein vollständiges Profil aus →
        </Link>
      </div>
    </div>
  );
}
