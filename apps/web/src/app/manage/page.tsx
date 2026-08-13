"use client";

import Link from "next/link";
import { matches } from "@/lib/mock-data";
import { Badge } from "@/components/badge";
import { useAuth } from "@/contexts/auth-context";
import { matchStatusLabel, matchStatusTone } from "@/lib/match-status";

// Director- und RO-Bereiche (hier, /manage/new, /score) waren bisher die
// einzigen Rollen-Flows ohne Login-Gate — im Gegensatz zu Registrierung/
// Profil/Meine Matches konnte jeder ohne Anmeldung direkt Matches anlegen
// oder Scores erfassen. Volle Rollenprüfung (wer ist tatsächlich Director
// vs. Athlet) braucht echtes RBAC (s. auth-context.tsx-Kommentar, Spec
// §21, Phase 7) — dieses Mock-Auth kennt nur "eingeloggt oder nicht".
// Ein einfaches Login-Gate ist trotzdem ehrlicher als gar keins.
export default function ManageDashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Anmeldung erforderlich</h1>
        <p className="mt-2 text-sm text-text-muted">
          Melde dich an, um das Match-Director-Dashboard zu nutzen.
        </p>
        <Link
          href="/login?returnTo=%2Fmanage"
          className="mt-6 inline-block rounded-xl bg-accent px-5 py-3 font-medium text-bg hover:opacity-90 transition-opacity"
        >
          Zum Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Shooting Club XYZ
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Match Director
          </h1>
        </div>
        <Link
          href="/manage/new"
          className="rounded-xl bg-accent px-5 py-3 font-medium text-bg hover:opacity-90 transition-opacity"
        >
          + Neues Match erstellen
        </Link>
      </div>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
        Deine Matches
      </h2>
      <div className="space-y-3">
        {matches.map((m) => (
          <Link
            key={m.id}
            href={`/matches/${m.id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5 hover:border-accent/50 hover:bg-surface-raised transition-colors"
          >
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Badge tone={matchStatusTone[m.status]}>
                  {matchStatusLabel[m.status]}
                </Badge>
                <span className="text-sm text-text-muted">
                  {m.discipline} · {m.level}
                </span>
              </div>
              <p className="font-semibold">{m.name}</p>
              <p className="text-sm text-text-muted">
                {m.city}, {m.country} · {m.dateLabel}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-mono">
                {m.spotsFilled} / {m.spotsTotal}
              </p>
              <p className="text-text-muted">Teilnehmer</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
