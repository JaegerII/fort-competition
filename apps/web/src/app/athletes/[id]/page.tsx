import { notFound } from "next/navigation";
import { athleteProfiles } from "@/lib/mock-data";
import { Badge } from "@/components/badge";
import { BackLink } from "@/components/back-link";

export function generateStaticParams() {
  return Object.keys(athleteProfiles).map((id) => ({ id }));
}
export const dynamicParams = false;

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 text-center">
      <p className="font-mono text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-text-muted">
        {label}
      </p>
    </div>
  );
}

export default async function AthleteProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const athlete = athleteProfiles[id];
  if (!athlete) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <BackLink fallbackHref="/athletes" />
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface-raised font-mono text-xl text-text-muted">
          {athlete.fullName
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            {athlete.fullName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-muted">
            <span>{athlete.country}</span>
            <span className="text-text-faint">·</span>
            <Badge tone="accent">{athlete.primaryDivision}</Badge>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Matches" value={String(athlete.matches)} />
        <StatTile label="Stages" value={String(athlete.stages)} />
        <StatTile label="Podiums" value={String(athlete.podiums)} />
        <StatTile label="Wins" value={String(athlete.wins)} />
      </div>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
        Performance-Analytics
      </h2>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Ø Match %" value={`${athlete.avgMatchPct}%`} />
        <StatTile label="Ø Stage %" value={`${athlete.avgStagePct}%`} />
        <StatTile label="Ø Hit Factor" value={athlete.avgHitFactor.toFixed(2)} />
        <StatTile label="A-Zone %" value={`${athlete.aZonePct}%`} />
        <StatTile label="Penalty Rate" value={`${athlete.penaltyRate}%`} />
        <StatTile label="DNF Rate" value={`${athlete.dnfRate}%`} />
      </div>

      {athlete.insight && (
        <div className="mb-8 rounded-2xl border border-accent/30 bg-accent-dim p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Insight
          </p>
          <p className="text-sm text-text">{athlete.insight}</p>
          <p className="mt-2 text-xs text-text-faint">
            Abgeleitet aus echten Stage-Ergebnissen — kein generischer
            KI-Text (Spec §13).
          </p>
        </div>
      )}

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
        Wettkampf-Historie
      </h2>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
        {athlete.history.map((h) => (
          <div
            key={h.matchName + h.date}
            className="flex items-center justify-between gap-3 bg-surface/40 p-4"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{h.matchName}</p>
              <p className="text-xs text-text-muted">{h.date}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-medium">{h.place}</p>
              <p className="font-mono text-xs text-accent">
                {h.matchPct.toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
