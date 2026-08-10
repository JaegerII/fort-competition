"use client";

import { useState } from "react";
import { divisions, leaderboard } from "@/lib/mock-data";

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

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-text-muted">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Athlet</th>
              {active === "Overall" && (
                <th className="px-4 py-3 font-medium hidden sm:table-cell">
                  Division
                </th>
              )}
              <th className="px-4 py-3 font-medium text-right">Punkte</th>
              <th className="px-4 py-3 font-medium text-right">%</th>
              <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">
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
                  <td className="px-4 py-3 text-text-muted hidden sm:table-cell">
                    {r.division}
                  </td>
                )}
                <td className="px-4 py-3 text-right font-mono">
                  {r.points.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-accent">
                  {r.percentage.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-right font-mono text-text-muted hidden sm:table-cell">
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
