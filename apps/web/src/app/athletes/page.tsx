"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { athleteProfiles } from "@/lib/mock-data";
import { Badge } from "@/components/badge";

// "Athlet suchen" — explizit Teil des Spectator-Flows in
// docs/PHASE2_USER_FLOWS.md §4 und Spec §10, bisher aber nirgends
// erreichbar: Athletenprofile gab es nur über einen Umweg über eine
// Ranglisten-Zeile auf einer Match-Seite. Öffentlich, kein Login nötig —
// gleiches Prinzip wie die Live-Match-Seite (Spec §10: "No account
// required to view public live results").
export default function AthletesIndexPage() {
  const [query, setQuery] = useState("");

  const athletes = useMemo(
    () =>
      Object.values(athleteProfiles).sort((a, b) =>
        a.fullName.localeCompare(b.fullName),
      ),
    [],
  );

  const filtered = athletes.filter((a) =>
    a.fullName.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="mb-1 text-3xl font-semibold tracking-tight">
        Athleten
      </h1>
      <p className="mb-6 text-text-muted">
        Kein Login nötig — Profile sind öffentlich einsehbar.
      </p>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Nach Namen suchen…"
        aria-label="Athleten nach Namen suchen"
        className="mb-6 w-full rounded-xl border border-border bg-surface-raised px-4 py-3 focus:border-accent focus:outline-none"
      />

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-text-muted">
          Kein Athlet gefunden für „{query}“.
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
          {filtered.map((a) => (
            <Link
              key={a.id}
              href={`/athletes/${a.id}`}
              className="flex items-center gap-3 bg-surface/40 p-4 transition-colors hover:bg-surface-raised"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-raised font-mono text-sm text-text-muted">
                {a.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{a.fullName}</p>
                <p className="truncate text-sm text-text-muted">
                  {a.country}
                </p>
              </div>
              <Badge tone="accent">{a.primaryDivision}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
