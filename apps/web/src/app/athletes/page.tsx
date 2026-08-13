import { getAthletes } from "@/lib/queries";
import { AthletesClient } from "@/components/athletes-client";

// "Athlet suchen" — explizit Teil des Spectator-Flows in
// docs/PHASE2_USER_FLOWS.md §4 und Spec §10. Öffentlich, kein Login nötig:
// gleiches Prinzip wie die Live-Match-Seite ("No account required to view
// public live results").
export default async function AthletesIndexPage() {
  const athletes = await getAthletes();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="mb-1 text-3xl font-semibold tracking-tight">Athleten</h1>
      <p className="mb-6 text-text-muted">
        Kein Login nötig — Profile sind öffentlich einsehbar.
      </p>

      <AthletesClient athletes={athletes} />
    </div>
  );
}
