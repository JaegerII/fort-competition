import Link from "next/link";
import { MatchSummary } from "@/lib/mock-data";
import { Badge } from "./badge";

const registrationLabel: Record<MatchSummary["registrationStatus"], string> = {
  open: "Registrierung offen",
  waitlist: "Warteliste",
  closed: "Registrierung geschlossen",
};

const registrationTone: Record<
  MatchSummary["registrationStatus"],
  "accent" | "warning" | "neutral"
> = {
  open: "accent",
  waitlist: "warning",
  closed: "neutral",
};

export function MatchCard({ match }: { match: MatchSummary }) {
  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/50 hover:bg-surface-raised"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{match.name}</h3>
          <p className="text-sm text-text-muted">
            {match.city}, {match.country}
          </p>
        </div>
        {match.status === "live" && <Badge tone="live">Live</Badge>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-text-muted">
        <span className="rounded-md bg-surface-raised px-2 py-1">
          {match.discipline}
        </span>
        <span className="rounded-md bg-surface-raised px-2 py-1">
          {match.level}
        </span>
        <span className="rounded-md bg-surface-raised px-2 py-1">
          {match.dateLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Badge tone={registrationTone[match.registrationStatus]}>
          {registrationLabel[match.registrationStatus]}
        </Badge>
        <span className="text-sm text-text-muted">
          {match.spotsFilled} / {match.spotsTotal} Teilnehmer
        </span>
      </div>

      {match.status === "live" && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-text-muted">
            <span>Stage-Fortschritt</span>
            <span>
              {match.stagesDone} / {match.stagesTotal}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full bg-accent"
              style={{
                width: `${(match.stagesDone / match.stagesTotal) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}
