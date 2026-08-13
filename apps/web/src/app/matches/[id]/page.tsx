import { notFound } from "next/navigation";
import { getLeaderboard, getMatch, getMatchSlugs } from "@/lib/queries";
import { matchStatusLabel, matchStatusTone } from "@/lib/match-status";
import { Badge } from "@/components/badge";
import { Leaderboard } from "@/components/leaderboard";
import { RegisterCta } from "@/components/register-cta";
import { PersonalMatchCard } from "@/components/personal-match-card";

// Statischer Export (GitHub Pages) kann nichts on-demand rendern — jede
// Match-Detailseite muss beim Build bekannt sein. Die Slugs kommen jetzt aus
// der Datenbank; ohne DB fällt getMatchSlugs auf die Mock-IDs zurück.
//
// Das ist zugleich die Grenze des statischen Exports: ein Match, das NACH dem
// Build entsteht, hat keine Seite. Genau dieser Punkt erzwingt später den
// Wechsel auf serverseitiges Rendern — für den aktuellen Stand (Matches
// stehen zur Build-Zeit fest) reicht es.
export async function generateStaticParams() {
  const slugs = await getMatchSlugs();
  return slugs.map((slug) => ({ id: slug }));
}
export const dynamicParams = false;

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [match, leaderboard] = await Promise.all([
    getMatch(id),
    getLeaderboard(id),
  ]);
  if (!match) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge tone={matchStatusTone[match.status]}>
              {matchStatusLabel[match.status]}
            </Badge>
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

        {match.status !== "completed" &&
          (match.registrationStatus === "closed" ? (
            <span className="w-full shrink-0 cursor-not-allowed rounded-xl border border-border px-5 py-3 text-center font-medium text-text-faint sm:w-auto">
              Registrierung geschlossen
            </span>
          ) : (
            <RegisterCta
              matchId={match.id}
              registrationStatus={match.registrationStatus}
            />
          ))}
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

      {/* min-w-0 auf beiden Grid-Kindern ist Pflicht, nicht Kosmetik: Grid-Items
          haben implizit min-width:auto und lassen sich sonst nicht unter ihre
          eigene Content-Breite schrumpfen — eine einzelne unwrapped Zeile wie
          "#14 / 127" bläht dann die ganze Spalte (und damit die Seite) über
          den Viewport hinaus auf, statt normal umzubrechen. */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <div className="order-2 min-w-0 lg:order-none">
          <h2 className="mb-4 text-lg font-semibold">Rangliste</h2>
          <Leaderboard
            divisions={leaderboard.divisions}
            entries={leaderboard.entries}
          />
        </div>

        {/* Auf Mobile vor die Rangliste — das eigene Ergebnis ist die
            persönlich relevanteste Info und soll nicht erst nach Scrollen
            durch eine potenziell lange Liste sichtbar werden. */}
        <PersonalMatchCard />
      </div>
    </div>
  );
}
