import { notFound } from "next/navigation";
import { matches } from "@/lib/mock-data";
import { Badge } from "@/components/badge";
import { Leaderboard } from "@/components/leaderboard";

// Statischer Export (GitHub Pages) kann nichts on-demand rendern — jede
// Match-Detailseite muss beim Build bekannt sein.
export function generateStaticParams() {
  return matches.map((m) => ({ id: m.id }));
}
export const dynamicParams = false;

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = matches.find((m) => m.id === id);
  if (!match) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            {match.status === "live" && <Badge tone="live">Live</Badge>}
            {match.status === "completed" && (
              <Badge tone="neutral">Beendet</Badge>
            )}
            {match.status === "upcoming" && (
              <Badge tone="accent">Bevorstehend</Badge>
            )}
            <span className="text-sm text-text-muted">
              {match.discipline} · {match.level}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {match.name}
          </h1>
          <p className="mt-1 text-text-muted">
            {match.city}, {match.country} · {match.dateLabel}
          </p>
        </div>

        {match.status !== "completed" && (
          <button className="rounded-xl bg-accent px-5 py-3 font-medium text-bg hover:opacity-90 transition-opacity">
            {match.registrationStatus === "open"
              ? "Registrieren"
              : match.registrationStatus === "waitlist"
                ? "Auf Warteliste setzen"
                : "Registrierung geschlossen"}
          </button>
        )}
      </div>

      {match.status === "live" && (
        <div className="mb-8 rounded-2xl border border-border bg-surface p-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-text-muted">Stage-Fortschritt</span>
            <span className="font-mono">
              {match.stagesDone} / {match.stagesTotal}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{
                width: `${(match.stagesDone / match.stagesTotal) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Rangliste</h2>
          <Leaderboard />
        </div>

        <aside className="rounded-2xl border border-border bg-surface p-5 h-fit">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
            Dein Match
          </h2>
          <dl className="space-y-4">
            <div className="flex items-baseline justify-between">
              <dt className="text-sm text-text-muted">Overall</dt>
              <dd className="font-mono text-lg">
                #14{" "}
                <span className="text-text-faint text-sm">/ 127</span>
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-sm text-text-muted">Division</dt>
              <dd className="font-mono text-lg">
                #3 <span className="text-text-faint text-sm">/ 38</span>
              </dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-sm text-text-muted">Match %</dt>
              <dd className="font-mono text-lg text-accent">91.27%</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-sm text-text-muted">Stages</dt>
              <dd className="font-mono text-lg">8 / 12</dd>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-baseline justify-between">
                <dt className="text-sm text-text-muted">Letzte Stage</dt>
                <dd className="text-sm">Stage 8 · Rang #4</dd>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <dt className="text-sm text-text-muted">Bewegung</dt>
                <dd className="text-sm text-accent">↑ 2 Plätze</dd>
              </div>
            </div>
          </dl>
          <p className="mt-4 text-xs text-text-faint">
            Beispielhaft für einen eingeloggten Athleten — echte Daten folgen
            in Phase 7.
          </p>
        </aside>
      </div>
    </div>
  );
}
