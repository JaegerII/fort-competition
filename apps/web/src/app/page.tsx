"use client";

import { useMemo, useState } from "react";
import { matches, type MatchStatus } from "@/lib/mock-data";
import { MatchCard } from "@/components/match-card";

const ALL = "Alle";

const statusLabel: Record<MatchStatus, string> = {
  live: "Live",
  upcoming: "Bevorstehend",
  completed: "Beendet",
};

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

export default function DiscoverPage() {
  const [country, setCountry] = useState(ALL);
  const [discipline, setDiscipline] = useState(ALL);
  const [level, setLevel] = useState(ALL);
  const [timeframe, setTimeframe] = useState(ALL);
  const [openOnly, setOpenOnly] = useState(false);

  const countries = useMemo(
    () => Array.from(new Set(matches.map((m) => m.country))),
    [],
  );
  const disciplines = useMemo(
    () => Array.from(new Set(matches.map((m) => m.discipline))),
    [],
  );
  const levels = useMemo(
    () => Array.from(new Set(matches.map((m) => m.level))),
    [],
  );
  // Nur Status vertreten, die tatsächlich in den Daten vorkommen — sonst
  // könnte man z.B. "Beendet" wählen, obwohl es aktuell kein einziges
  // beendetes Match gibt.
  const timeframes = useMemo(
    () =>
      Array.from(new Set(matches.map((m) => m.status))).map(
        (s) => statusLabel[s],
      ),
    [],
  );

  const filtered = matches.filter((m) => {
    if (country !== ALL && m.country !== country) return false;
    if (discipline !== ALL && m.discipline !== discipline) return false;
    if (level !== ALL && m.level !== level) return false;
    if (timeframe !== ALL && statusLabel[m.status] !== timeframe) return false;
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
        {/* Distanz braucht Browser-Geolocation — bei 3 Mock-Matches (alle in
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
    </div>
  );
}
