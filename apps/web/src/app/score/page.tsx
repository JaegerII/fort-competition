"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  scoringSquads,
  scoringStage,
  type ScoringShooter,
} from "@/lib/mock-data";
import { Stepper } from "@/components/stepper";
import { Badge } from "@/components/badge";
import { useAuth } from "@/contexts/auth-context";

type TargetHits = { A: number; C: number; D: number; M: number; NS: number };
type TargetState = Record<string, TargetHits>;

const emptyHits: TargetHits = { A: 0, C: 0, D: 0, M: 0, NS: 0 };

function emptyTargetState(): TargetState {
  const state: TargetState = {};
  for (const t of scoringStage.targets) state[t.id] = { ...emptyHits };
  return state;
}

// Vereinfachte Beispiel-Berechnung für den Prototyp — NICHT die echte
// Ruleset-Engine (Spec §7.4). A=5 / C=3 / D=1 / M=0, NS/Procedural/
// Sonstige Strafe = -10 Punkte je Zählung.
function calcPoints(targets: TargetState, procedural: number, other: number) {
  let points = 0;
  let nsCount = 0;
  for (const t of Object.values(targets)) {
    points += t.A * 5 + t.C * 3 + t.D * 1;
    nsCount += t.NS;
  }
  points -= nsCount * 10 + procedural * 10 + other * 10;
  return Math.max(0, points);
}

export default function ScorePage() {
  const { user } = useAuth();
  const [squadId, setSquadId] = useState<string | null>(null);
  const [shooterId, setShooterId] = useState<string | null>(null);
  const [mode, setMode] = useState<"queue" | "score" | "review">("queue");
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [offline, setOffline] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);

  const [targets, setTargets] = useState<TargetState>(emptyTargetState());
  const [procedural, setProcedural] = useState(0);
  const [other, setOther] = useState(0);
  const [time, setTime] = useState("");

  const squad = scoringSquads.find((s) => s.id === squadId) ?? null;
  const shooter: ScoringShooter | null =
    squad?.shooters.find((s) => s.id === shooterId) ?? null;

  const points = useMemo(
    () => calcPoints(targets, procedural, other),
    [targets, procedural, other],
  );
  const timeNum = parseFloat(time) || 0;
  const hitFactor = timeNum > 0 ? points / timeNum : 0;

  function resetEntry() {
    setTargets(emptyTargetState());
    setProcedural(0);
    setOther(0);
    setTime("");
  }

  function pickShooter(id: string) {
    setShooterId(id);
    resetEntry();
    setMode("score");
  }

  function confirmScore() {
    if (!shooterId) return;
    setDoneIds((prev) => new Set(prev).add(shooterId));
    if (offline) {
      setPendingSync((n) => n + 1);
    }
    const remaining = squad?.shooters.find(
      (s) => s.id !== shooterId && !doneIds.has(s.id),
    );
    if (remaining) {
      pickShooter(remaining.id);
    } else {
      setShooterId(null);
      setMode("queue");
    }
  }

  // Gleiches Login-Gate wie /manage — s. Kommentar dort.
  if (!user) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Anmeldung erforderlich</h1>
        <p className="mt-2 text-sm text-text-muted">
          Melde dich an, um Scores zu erfassen.
        </p>
        <Link
          href="/login?returnTo=%2Fscore"
          className="mt-6 inline-block rounded-xl bg-accent px-5 py-3 font-medium text-bg hover:opacity-90 transition-opacity"
        >
          Zum Login
        </Link>
      </div>
    );
  }

  // ── Squad-Auswahl ──────────────────────────────────────────────
  if (!squad) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="mb-1 text-2xl font-semibold">Squad wählen</h1>
        <p className="mb-6 text-text-muted">
          {scoringStage.name} — dein aktueller Einsatzort
        </p>
        <div className="space-y-3">
          {scoringSquads.map((s) => {
            const done = s.shooters.filter((sh) => doneIds.has(sh.id)).length;
            const allDone = done === s.shooters.length;
            return (
              <button
                key={s.id}
                onClick={() => setSquadId(s.id)}
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface p-5 text-left hover:border-accent/50 hover:bg-surface-raised transition-colors"
              >
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-text-muted">{s.timeSlot}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-text-muted">
                    {done} / {s.shooters.length}
                  </span>
                  {allDone && <Badge tone="accent">Fertig</Badge>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Shooter-Queue ──────────────────────────────────────────────
  if (mode === "queue") {
    const doneCount = squad.shooters.filter((s) => doneIds.has(s.id)).length;
    const squadComplete = doneCount === squad.shooters.length;
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button
          onClick={() => setSquadId(null)}
          className="mb-4 text-sm text-text-muted hover:text-text"
        >
          ← Andere Squad
        </button>
        <h1 className="mb-1 text-2xl font-semibold">{squad.name}</h1>
        <p className="mb-6 text-text-muted">{scoringStage.name}</p>

        {squadComplete && (
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-accent/30 bg-accent-dim p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-lg text-bg">
                ✓
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-accent">Squad abgeschlossen</p>
                <p className="text-sm text-text-muted">
                  Alle {squad.shooters.length} Schützen erfasst — {scoringStage.name}
                  .
                </p>
              </div>
            </div>
            <button
              onClick={() => setSquadId(null)}
              className="shrink-0 rounded-lg border border-accent/50 px-3 py-2 text-sm text-accent hover:bg-accent/10 transition-colors sm:ml-auto"
            >
              Nächste Squad
            </button>
          </div>
        )}

        <div className="space-y-3">
          {squad.shooters.map((s) => {
            const done = doneIds.has(s.id);
            return (
              <button
                key={s.id}
                onClick={() => pickShooter(s.id)}
                disabled={done}
                className={`flex w-full items-center justify-between rounded-2xl border p-5 text-left transition-colors ${
                  done
                    ? "border-border bg-surface/40 opacity-50"
                    : "border-border bg-surface hover:border-accent/50 hover:bg-surface-raised"
                }`}
              >
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-text-muted">{s.division}</p>
                </div>
                {done ? (
                  <Badge tone="accent">Erfasst</Badge>
                ) : (
                  <span className="text-text-faint">→</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!shooter) return null;

  // ── Score-Erfassung ────────────────────────────────────────────
  if (mode === "score") {
    return (
      // pb-[14rem] statt der 12rem des Review-Screens (gleiche Bar sonst):
      // die "Zeit fehlt"-Warnzeile macht den fixed Action-Bar zwei statt
      // eine Zeile hoch, ohne mehr Bottom-Padding verschwand die letzte
      // Strafen-Zeile unsichtbar dahinter — exakt die "kein scrollWidth-
      // Overflow, aber Bounding-Rects überlappen trotzdem"-Falle.
      <div className="max-w-2xl mx-auto px-4 pb-[calc(14rem+env(safe-area-inset-bottom))] pt-6 md:pb-36">
        <ScoreHeader
          shooter={shooter}
          offline={offline}
          pendingSync={pendingSync}
          onToggleOffline={() => setOffline((v) => !v)}
        />

        <div className="mb-6 rounded-2xl border border-border bg-surface p-5">
          {/* label hatte weder htmlFor noch umschloss es das input (beide
              waren nur lose Geschwister im selben div) — programmatisch
              also NICHT verknüpft, ein Screen-Reader-Nutzer hätte beim
              Fokussieren des wichtigsten Felds auf dem sicherheitskritischen
              RO-Scoring-Screen keine Ankündigung bekommen. */}
          <label
            htmlFor="score-time"
            className="mb-2 block text-xs font-medium uppercase tracking-wide text-text-muted"
          >
            Zeit (Sekunden)
          </label>
          <input
            id="score-time"
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0.00"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-raised px-4 py-3 font-mono text-3xl focus:border-accent focus:outline-none"
          />
        </div>

        <div className="space-y-4">
          {scoringStage.targets.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <p className="mb-3 text-sm font-semibold">{t.label}</p>
              {/* 5 volle Stepper (je 2 Buttons + Wert, ~116px) passen bei
                  Handybreite nicht nebeneinander — grid-cols-5 hat das ohne
                  sichtbares Seiten-Overflow einfach in jeder Spalte
                  kollidieren lassen (die Spalten selbst schrumpfen ja,
                  grid-cols-N ist repeat(N, minmax(0,1fr)); der fixbreite
                  Button/Wert-Inhalt in der Spalte aber nicht). 2 Spalten auf
                  Mobile geben jedem Stepper genug Platz, ab sm passen alle 5
                  nebeneinander. */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-5 sm:gap-2">
                <Stepper
                  label="A"
                  value={targets[t.id].A}
                  onChange={(v) =>
                    setTargets((p) => ({ ...p, [t.id]: { ...p[t.id], A: v } }))
                  }
                />
                <Stepper
                  label="C"
                  value={targets[t.id].C}
                  onChange={(v) =>
                    setTargets((p) => ({ ...p, [t.id]: { ...p[t.id], C: v } }))
                  }
                />
                <Stepper
                  label="D"
                  value={targets[t.id].D}
                  onChange={(v) =>
                    setTargets((p) => ({ ...p, [t.id]: { ...p[t.id], D: v } }))
                  }
                />
                <Stepper
                  label="M"
                  tone="warning"
                  value={targets[t.id].M}
                  onChange={(v) =>
                    setTargets((p) => ({ ...p, [t.id]: { ...p[t.id], M: v } }))
                  }
                />
                <Stepper
                  label="NS"
                  tone="live"
                  value={targets[t.id].NS}
                  onChange={(v) =>
                    setTargets((p) => ({
                      ...p,
                      [t.id]: { ...p[t.id], NS: v },
                    }))
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <p className="mb-3 text-sm font-semibold">Strafen</p>
          <div className="flex gap-8">
            <Stepper
              label="Procedural"
              tone="warning"
              value={procedural}
              onChange={setProcedural}
            />
            <Stepper
              label="Sonstige"
              tone="warning"
              value={other}
              onChange={setOther}
            />
          </div>
        </div>

        <PreviewBar points={points} time={timeNum} hitFactor={hitFactor} />

        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] border-t border-border bg-bg/95 backdrop-blur px-4 py-4 md:bottom-0">
          <div className="mx-auto max-w-2xl">
            {timeNum <= 0 && (
              <p className="mb-2 text-center text-sm text-warning">
                Zeit fehlt — ein Schuss dauert nie 0.00 Sekunden.
              </p>
            )}
            <button
              disabled={timeNum <= 0}
              onClick={() => setMode("review")}
              className="w-full rounded-xl bg-accent py-4 text-lg font-semibold text-bg active:scale-[0.99] transition-transform disabled:opacity-30 disabled:pointer-events-none"
            >
              REVIEW SCORE
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Review & Confirm ───────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 pb-[calc(12rem+env(safe-area-inset-bottom))] pt-6 md:pb-32">
      <ScoreHeader
        shooter={shooter}
        offline={offline}
        pendingSync={pendingSync}
        onToggleOffline={() => setOffline((v) => !v)}
      />

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Zur Kontrolle — {shooter.name}
        </p>
        <div className="space-y-3">
          {scoringStage.targets.map((t) => {
            const h = targets[t.id];
            return (
              <div
                key={t.id}
                className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0"
              >
                <span className="font-medium">{t.label}</span>
                <span className="font-mono text-text-muted">
                  A{h.A} C{h.C} D{h.D} M{h.M} NS{h.NS}
                </span>
              </div>
            );
          })}
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Procedural / Sonstige</span>
            <span className="font-mono">
              {procedural} / {other}
            </span>
          </div>
        </div>
      </div>

      <PreviewBar points={points} time={timeNum} hitFactor={hitFactor} />

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] border-t border-border bg-bg/95 backdrop-blur px-4 py-4 md:bottom-0">
        <div className="mx-auto flex max-w-2xl gap-3">
          <button
            onClick={() => setMode("score")}
            className="flex-1 rounded-xl border border-border py-4 text-lg font-medium hover:bg-surface-raised transition-colors"
          >
            Zurück
          </button>
          <button
            onClick={confirmScore}
            className="flex-[2] rounded-xl bg-accent py-4 text-lg font-semibold text-bg active:scale-[0.99] transition-transform"
          >
            CONFIRM →
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreHeader({
  shooter,
  offline,
  pendingSync,
  onToggleOffline,
}: {
  shooter: ScoringShooter;
  offline: boolean;
  pendingSync: number;
  onToggleOffline: () => void;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {scoringStage.name}
        </p>
        <h1 className="text-2xl font-semibold">{shooter.name}</h1>
        <p className="text-sm text-text-muted">{shooter.division}</p>
      </div>
      <button
        onClick={onToggleOffline}
        aria-pressed={offline}
        className="text-right"
        title="Offline nur zu Demo-Zwecken simulierbar"
      >
        <Badge tone={offline ? "warning" : "accent"}>
          {offline ? `Offline · ${pendingSync} ausstehend` : "Synchronisiert"}
        </Badge>
      </button>
    </div>
  );
}

function PreviewBar({
  points,
  time,
  hitFactor,
}: {
  points: number;
  time: number;
  hitFactor: number;
}) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      <div className="rounded-2xl border border-border bg-surface p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-text-muted">
          Points
        </p>
        <p className="mt-1 font-mono text-2xl font-semibold">{points}</p>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-text-muted">
          Time
        </p>
        <p className="mt-1 font-mono text-2xl font-semibold">
          {time.toFixed(2)}
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-4 text-center">
        <p className="text-xs uppercase tracking-wide text-text-muted">
          Hit Factor
        </p>
        <p className="mt-1 font-mono text-2xl font-semibold text-accent">
          {hitFactor.toFixed(4)}
        </p>
      </div>
    </div>
  );
}
