"use client";

import { useState } from "react";
import { divisions, leaderboard, type LeaderboardEntry } from "@/lib/mock-data";

function MovementIndicator({ movement }: { movement: number }) {
  if (movement === 0) {
    return <span className="text-text-faint text-xs">–</span>;
  }
  const up = movement > 0;
  return (
    <span
      className={`text-xs font-medium ${up ? "text-accent" : "text-live"}`}
    >
      {up ? "↑" : "↓"} {Math.abs(movement)}
    </span>
  );
}

const medal: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

// Eigene Card-Zeile fürs Handy statt Tabelle — Tabellen mit vielen Spalten
// sind ein Desktop-Pattern; auf dem Phone liest sich eine Zeile pro Athlet
// mit klarer visueller Hierarchie (Rang, Name, Prozent groß) nativer,
// näher an Strava/Garmin als an einer klassischen Ergebnisliste.
function MobileRow({
  entry,
  showDivision,
}: {
  entry: LeaderboardEntry;
  showDivision: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border bg-surface/40 p-3 last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised font-mono text-sm text-text-muted">
        {medal[entry.rank] ?? entry.rank}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {entry.name}{" "}
          <span className="text-xs text-text-faint">{entry.country}</span>
        </p>
        <p className="truncate text-xs text-text-muted">
          {showDivision ? entry.division : `${entry.points.toFixed(2)} pts`}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-accent">
          {entry.percentage.toFixed(2)}%
        </p>
        <MovementIndicator movement={entry.movement} />
      </div>
    </div>
  );
}

export function Leaderboard() {
  const [active, setActive] = useState<string>("Overall");
  const rows = leaderboard[active] ?? [];

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {divisions.map((d) => (
          <button
            key={d}
            onClick={() => setActive(d)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
              active === d
                ? "bg-accent text-bg font-medium"
                : "bg-surface text-text-muted border border-border hover:text-text"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Mobile: Card-Liste */}
      <div className="overflow-hidden rounded-2xl border border-border md:hidden">
        {rows.map((r) => (
          <MobileRow key={r.rank} entry={r} showDivision={active === "Overall"} />
        ))}
      </div>

      {/* Ab md: klassische Tabelle mit allen Spalten */}
      <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-text-muted">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Athlet</th>
              {active === "Overall" && (
                <th className="px-4 py-3 font-medium">Division</th>
              )}
              <th className="px-4 py-3 font-medium text-right">Punkte</th>
              <th className="px-4 py-3 font-medium text-right">%</th>
              <th className="px-4 py-3 font-medium text-right">
                Hit Factor
              </th>
              <th className="px-4 py-3 font-medium text-right">Δ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.rank}
                className="border-b border-border last:border-0 bg-surface/40 hover:bg-surface-raised transition-colors"
              >
                <td className="px-4 py-3 font-mono text-text-muted">
                  {r.rank}
                </td>
                <td className="px-4 py-3 font-medium">
                  {r.name}{" "}
                  <span className="text-text-faint text-xs">
                    {r.country}
                  </span>
                </td>
                {active === "Overall" && (
                  <td className="px-4 py-3 text-text-muted">
                    {r.division}
                  </td>
                )}
                <td className="px-4 py-3 text-right font-mono">
                  {r.points.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-accent">
                  {r.percentage.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-right font-mono text-text-muted">
                  {r.hitFactor.toFixed(4)}
                </td>
                <td className="px-4 py-3 text-right">
                  <MovementIndicator movement={r.movement} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
