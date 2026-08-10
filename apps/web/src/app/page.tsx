import { matches } from "@/lib/mock-data";
import { MatchCard } from "@/components/match-card";

export default function DiscoverPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Matches entdecken
        </h1>
        <p className="mt-2 text-text-muted">
          Kein Login nötig, um zu suchen oder live mitzuverfolgen — Anmeldung
          erst zum Registrieren.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {["Land", "Distanz", "Datum", "Disziplin", "Ruleset", "Level"].map(
          (f) => (
            <button
              key={f}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-muted hover:border-accent/50 hover:text-text transition-colors"
            >
              {f}
            </button>
          ),
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}
