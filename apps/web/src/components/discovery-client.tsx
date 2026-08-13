"use client";

import { useMemo, useState } from "react";
import type { MatchSummary } from "@/lib/mock-data";
import { matchStatusLabel } from "@/lib/match-status";
import { MatchCard } from "@/components/match-card";

const ALL = "Alle";

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const active = value !== ALL;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={`rounded-full border px-4 py-2 text-sm transition-colors focus:outline-none ${
        active
          ? "border-accent bg-accent-dim text-accent"
          : "border-border bg-surface text-text-muted hover:text-text"
      }`}
    >
      <option value={ALL}>{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

// Nimmt die Matches als Prop entgegen, statt sie selbst zu importieren:
// Geladen wird in der Server-Komponente (app/page.tsx), gefiltert hier im
// Client. Vorher lag beides in einer "use client"-Datei, die mock-data
// direkt importierte — damit wäre eine Datenbankabfrage gar nicht möglich
// gewesen, ohne die Filterlogik in den Browser-Roundtrip zu ziehen.
export function DiscoveryClient({ matches }: { matches: MatchSummary[] }) {
  const [country, setCountry] = useState(ALL);
  const [discipline, setDiscipline] = useState(ALL);
  const [level, setLevel] = useState(ALL);
  const [timeframe, setTimeframe] = useState(ALL);
  const [openOnly, setOpenOnly] = useState(false);

  const countries = useMemo(
    () => Array.from(new Set(matches.map((m) => m.country).filter(Boolean))),
    [matches],
  );
  const disciplines = useMemo(
    () => Array.from(new Set(matches.map((m) => m.discipline).filter(Boolean))),
    [matches],
  );
  const levels = useMemo(
    () => Array.from(new Set(matches.map((m) => m.level).filter(Boolean))),
    [matches],
  );
  // Nur Status, die tatsächlich in den Daten vorkommen — sonst könnte man
  // z.B. "Beendet" wählen, obwohl es kein beendetes Match gibt.
  const timeframes = useMemo(
    () =>
      Array.from(new Set(matches.map((m) => m.status))).map(
        (s) => matchStatusLabel[s],
      ),
    [matches],
  );

  const filtered = matches.filter((m) => {
    if (country !== ALL && m.country !== country) return false;
    if (discipline !== ALL && m.discipline !== discipline) return false;
    if (level !== ALL && m.level !== level) return false;
    if (timeframe !== ALL && matchStatusLabel[m.status] !== timeframe)
      return false;
    if (openOnly && m.registrationStatus !== "open") return false;
    return true;
  });

  const activeCount =
    (country !== ALL ? 1 : 0) +
    (discipline !== ALL ? 1 : 0) +
    (level !== ALL ? 1 : 0) +
    (timeframe !== ALL ? 1 : 0) +
    (openOnly ? 1 : 0);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <FilterSelect
          label="Land"
          value={country}
          options={countries}
          onChange={setCountry}
        />
        <FilterSelect
          label="Disziplin"
          value={discipline}
          options={disciplines}
          onChange={setDiscipline}
        />
        <FilterSelect
          label="Level"
          value={level}
          options={levels}
          onChange={setLevel}
        />
        <button
          onClick={() => setOpenOnly((v) => !v)}
          aria-pressed={openOnly}
          className={`rounded-full border px-4 py-2 text-sm transition-colors ${
            openOnly
              ? "border-accent bg-accent-dim text-accent"
              : "border-border bg-surface text-text-muted hover:text-text"
          }`}
        >
          Registrierung offen
        </button>
        <FilterSelect
          label="Zeitraum"
          value={timeframe}
          options={timeframes}
          onChange={setTimeframe}
        />
        {/* Distanz braucht Browser-Geolocation — bei drei Matches (alle in
            Deutschland) bringt eine vorgetäuschte Umsetzung keinen echten
            Mehrwert. Klar als "bald" markiert statt eine Funktion
            vorzutäuschen, die nichts tut. */}
        <span
          title="Bald verfügbar"
          className="cursor-not-allowed rounded-full border border-border px-4 py-2 text-sm text-text-faint"
        >
          Distanz · Bald
        </span>
        {activeCount > 0 && (
          <button
            onClick={() => {
              setCountry(ALL);
              setDiscipline(ALL);
              setLevel(ALL);
              setTimeframe(ALL);
              setOpenOnly(false);
            }}
            className="text-sm text-text-muted underline hover:text-text"
          >
            Filter zurücksetzen ({activeCount})
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-text-muted">
          Keine Matches für diese Filterkombination.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </>
  );
}
