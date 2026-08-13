"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/badge";
import type { AthleteListItem } from "@/lib/queries";

// Bekommt die Athleten als Prop von der Server-Komponente und filtert nur
// noch — gleiche Aufteilung wie bei DiscoveryClient und Leaderboard.
export function AthletesClient({ athletes }: { athletes: AthleteListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = athletes.filter((a) =>
    a.fullName.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <>
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
          {athletes.length === 0
            ? "Noch keine Athleten erfasst."
            : `Kein Athlet gefunden für „${query}“.`}
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
                <p className="truncate text-sm text-text-muted">{a.country}</p>
              </div>
              {/* Nur anzeigen, wenn es tatsächlich eine gewertete Division
                  gibt — ein leeres Badge wäre eine Behauptung ohne Grundlage. */}
              {a.primaryDivision && (
                <Badge tone="accent">{a.primaryDivision}</Badge>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
