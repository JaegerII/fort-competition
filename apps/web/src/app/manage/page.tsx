import Link from "next/link";
import { matches } from "@/lib/mock-data";
import { Badge } from "@/components/badge";

const statusLabel: Record<(typeof matches)[number]["status"], string> = {
  live: "Live",
  upcoming: "Bevorstehend",
  completed: "Beendet",
};

const statusTone: Record<
  (typeof matches)[number]["status"],
  "live" | "accent" | "neutral"
> = {
  live: "live",
  upcoming: "accent",
  completed: "neutral",
};

export default function ManageDashboardPage() {
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
                <Badge tone={statusTone[m.status]}>
                  {statusLabel[m.status]}
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
