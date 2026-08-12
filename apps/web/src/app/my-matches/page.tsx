"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useRegistrations } from "@/contexts/registrations-context";
import { Badge } from "@/components/badge";

// Leichte MVP-Umsetzung von "Registered Matches auf dem Profil"
// (docs/ROADMAP_EXTENSIONS.md Punkt 1) — kein eigenes Karrieremodell,
// liest nur den registrations-context (localStorage-Mock) aus, den
// register-flow.tsx beim Bestätigen befüllt.
export default function MyMatchesPage() {
  const { user } = useAuth();
  const { registrations } = useRegistrations();

  if (!user) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Anmeldung erforderlich</h1>
        <p className="mt-2 text-sm text-text-muted">
          Melde dich an, um deine Match-Registrierungen zu sehen.
        </p>
        <Link
          href="/login?returnTo=%2Fmy-matches"
          className="mt-6 inline-block rounded-xl bg-accent px-5 py-3 font-medium text-bg hover:opacity-90 transition-opacity"
        >
          Zum Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Meine Matches</h1>
      <p className="mb-6 text-text-muted">
        Deine Registrierungen, {user.name}.
      </p>

      {registrations.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-text-muted">
          Noch keine Registrierungen.{" "}
          <Link href="/" className="text-accent hover:underline">
            Matches entdecken
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {registrations.map((r) => (
            <Link
              key={r.matchId}
              href={`/matches/${r.matchId}`}
              className="block rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/50 hover:bg-surface-raised"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-semibold">{r.matchName}</p>
                <Badge tone={r.status === "waitlisted" ? "warning" : "accent"}>
                  {r.status === "waitlisted" ? "Warteliste" : "Angemeldet"}
                </Badge>
              </div>
              <p className="text-sm text-text-muted">
                {r.division}
                {r.categories.length > 0 && ` · ${r.categories.join(", ")}`}
              </p>
              {r.squadName && (
                <p className="mt-1 text-sm text-text-faint">
                  {r.squadName} · {r.squadTimeSlot}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
