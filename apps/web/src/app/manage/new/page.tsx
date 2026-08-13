"use client";

import { useState } from "react";
import Link from "next/link";
import {
  availableCategories,
  availableDivisions,
  availableOfficialRoles,
  initialWizardState,
  staffPool,
  wizardSteps,
  type WizardOfficial,
  type WizardStage,
  type WizardState,
  type WizardStepId,
} from "@/lib/wizard-data";
import { Chip } from "@/components/chip";
import { useAuth } from "@/contexts/auth-context";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-surface-raised px-4 py-2.5 focus:border-accent focus:outline-none";

export default function NewMatchWizardPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<WizardStepId>("ruleset");
  const [data, setData] = useState<WizardState>(initialWizardState);
  const [published, setPublished] = useState(false);

  const stepIndex = wizardSteps.findIndex((s) => s.id === step);
  const canGoNext = stepIndex < wizardSteps.length - 1;
  const canGoBack = stepIndex > 0;
  // "Weiter" blockiert bei fehlenden Pflichtangaben — vorher konnte man
  // ohne Ruleset oder Match-Namen bis zum Review durchklicken (die
  // Step-Sidebar links erlaubt weiterhin freies, nicht-lineares Springen,
  // das bleibt bewusst so; nur der lineare "Weiter"-Pfad validiert).
  // Divisionen/Kategorien/Stages/Registrierung/Squads/Officials bleiben
  // absichtlich optional, gleiches Prinzip wie bei den Kategorien im
  // Athleten-Registrierungs-Flow.
  const canProceed =
    step === "ruleset"
      ? data.ruleset !== null
      : step === "info"
        ? data.info.name.trim() !== ""
        : true;
  // Sidebar-Navigation erlaubt weiterhin freies Springen zum Review-Schritt
  // ohne die lineare "Weiter"-Prüfung zu durchlaufen — PUBLISH braucht
  // deshalb seine eigene, unabhängige Prüfung derselben Pflichtfelder.
  const canPublish = data.ruleset !== null && data.info.name.trim() !== "";
  // Nur Ruleset/Info haben echte Pflichtfelder (s. canProceed oben) — die
  // Sidebar-Checkmarks zeigten "✓" aber bisher rein nach Position
  // (i < stepIndex), unabhängig davon, ob überhaupt etwas eingetragen war.
  // Wer über die freie Sidebar-Navigation direkt zu Review springt, sah so
  // ein fälschliches "✓ Ruleset" ohne gewähltes Ruleset. Für die übrigen,
  // bewusst optionalen Schritte bleibt "besucht" (Position) weiterhin ein
  // sinnvoller Indikator — dafür gibt es keinen echten "vollständig"-Status.
  function isStepFilled(id: WizardStepId): boolean {
    if (id === "ruleset") return data.ruleset !== null;
    if (id === "info") return data.info.name.trim() !== "";
    return true;
  }
  const duplicateOfficialNames = Array.from(
    new Set(
      data.officials
        .map((o) => o.name)
        .filter(
          (name, i, names) => names.indexOf(name) !== names.lastIndexOf(name),
        ),
    ),
  );

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function toggleInList(key: "divisions" | "categories", value: string) {
    setData((d) => {
      const list = d[key];
      const next = list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value];
      return { ...d, [key]: next };
    });
  }

  // Alle sechs Funktionen unten lesen den Vorzustand über die setData-
  // Updater-Funktion (d.stages/d.officials), NICHT über data.stages/
  // data.officials aus dem Render-Closure — sonst berechnen zwei Aufrufe,
  // die im selben React-Batch landen (z. B. schnelles Doppelklicken auf
  // "+ Stage hinzufügen"), beide denselben veralteten Vorzustand, und der
  // zweite Klick überschreibt den ersten anstatt ihn zu ergänzen. War real
  // reproduzierbar: mehrfaches "+ Official zuweisen" fügte nur einen
  // Official hinzu statt mehrerer.
  function addStage() {
    setData((d) => {
      const stage: WizardStage = {
        id: crypto.randomUUID(),
        number: d.stages.length + 1,
        name: `Stage ${d.stages.length + 1}`,
        targets: 4,
      };
      return { ...d, stages: [...d.stages, stage] };
    });
  }

  function updateStage(id: string, patch: Partial<WizardStage>) {
    setData((d) => ({
      ...d,
      stages: d.stages.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }

  function removeStage(id: string) {
    setData((d) => ({
      ...d,
      stages: d.stages.filter((s) => s.id !== id),
    }));
  }

  function addOfficial() {
    setData((d) => {
      const official: WizardOfficial = {
        id: crypto.randomUUID(),
        name: staffPool[d.officials.length % staffPool.length],
        role: availableOfficialRoles[1],
      };
      return { ...d, officials: [...d.officials, official] };
    });
  }

  function updateOfficial(id: string, patch: Partial<WizardOfficial>) {
    setData((d) => ({
      ...d,
      officials: d.officials.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
  }

  function removeOfficial(id: string) {
    setData((d) => ({
      ...d,
      officials: d.officials.filter((o) => o.id !== id),
    }));
  }

  // Gleiches Login-Gate wie /manage — s. Kommentar dort.
  if (!user) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Anmeldung erforderlich</h1>
        <p className="mt-2 text-sm text-text-muted">
          Melde dich an, um ein neues Match zu erstellen.
        </p>
        <Link
          href="/login?returnTo=%2Fmanage%2Fnew"
          className="mt-6 inline-block rounded-xl bg-accent px-5 py-3 font-medium text-bg hover:opacity-90 transition-opacity"
        >
          Zum Login
        </Link>
      </div>
    );
  }

  if (published) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent-dim text-3xl text-accent">
          ✓
        </div>
        <h1 className="text-2xl font-semibold">Match veröffentlicht</h1>
        <p className="mt-2 text-text-muted">
          {data.info.name || "Dein Match"} ist jetzt sichtbar. In der echten
          Implementierung entsteht hier eine neue öffentliche Match-Seite
          (Phase 7) — im Prototyp verlinken wir stattdessen zurück ins
          Dashboard.
        </p>
        <Link
          href="/manage"
          className="mt-6 inline-block rounded-xl bg-accent px-5 py-3 font-medium text-bg hover:opacity-90 transition-opacity"
        >
          Zurück zum Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Neues Match erstellen</h1>
      <p className="mb-8 text-text-muted">
        Jeder Schritt wird einzeln gespeichert — du kannst jederzeit
        nicht-linear zwischen Schritten springen.
      </p>

      {/* min-w-0 s. Kommentar in matches/[id]/page.tsx — sonst blähen die
          Review-Step dt/dd-Zeilen (z.B. "Squad · 12 × 15 Plätze") die
          Content-Spalte über den Viewport hinaus auf. */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex min-w-0 gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {wizardSteps.map((s, i) => {
            const isActive = s.id === step;
            const isDone = i < stepIndex && isStepFilled(s.id);
            return (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors lg:shrink ${
                  isActive
                    ? "bg-accent-dim text-accent"
                    : "text-text-muted hover:bg-surface-raised hover:text-text"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-mono ${
                    isActive
                      ? "bg-accent text-bg"
                      : isDone
                        ? "bg-accent/20 text-accent"
                        : "bg-surface-raised text-text-faint"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </span>
                <span className="whitespace-nowrap">{s.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          <div className="rounded-2xl border border-border bg-surface p-6 min-h-[420px]">
            {step === "ruleset" && (
              <div>
                <h2 className="mb-4 text-lg font-semibold">Ruleset wählen</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        id: "ipsc-handgun" as const,
                        title: "IPSC Handgun",
                        desc: "Offizielles Ruleset, versioniert, A/C/D-Scoring, Hit Factor.",
                      },
                      {
                        id: "custom" as const,
                        title: "Custom / Club Match",
                        desc: "Eigenes Scoring ohne Programmierung — Zeit, Punkte oder beides.",
                      },
                    ]
                  ).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => update("ruleset", r.id)}
                      aria-pressed={data.ruleset === r.id}
                      className={`rounded-2xl border p-5 text-left transition-colors ${
                        data.ruleset === r.id
                          ? "border-accent bg-accent-dim"
                          : "border-border bg-surface-raised hover:border-accent/40"
                      }`}
                    >
                      <p className="font-semibold">{r.title}</p>
                      <p className="mt-1 text-sm text-text-muted">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === "info" && (
              <div>
                <h2 className="mb-4 text-lg font-semibold">
                  Match-Informationen
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name">
                    <input
                      className={inputClass}
                      value={data.info.name}
                      onChange={(e) =>
                        update("info", { ...data.info, name: e.target.value })
                      }
                      placeholder="z. B. IPSC Saarland Open 2027"
                    />
                  </Field>
                  <Field label="Range">
                    <input
                      className={inputClass}
                      value={data.info.range}
                      onChange={(e) =>
                        update("info", {
                          ...data.info,
                          range: e.target.value,
                        })
                      }
                      placeholder="z. B. Schießsportanlage Dudweiler"
                    />
                  </Field>
                  <Field label="Level">
                    <select
                      className={inputClass}
                      value={data.info.level}
                      onChange={(e) =>
                        update("info", {
                          ...data.info,
                          level: e.target.value,
                        })
                      }
                    >
                      {["Club", "Level I", "Level II", "Level III"].map(
                        (l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Von">
                      <input
                        type="date"
                        className={inputClass}
                        value={data.info.dateFrom}
                        onChange={(e) =>
                          update("info", {
                            ...data.info,
                            dateFrom: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="Bis">
                      <input
                        type="date"
                        className={inputClass}
                        value={data.info.dateTo}
                        onChange={(e) =>
                          update("info", {
                            ...data.info,
                            dateTo: e.target.value,
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>
                {/* Nicht blockierend, anders als Ruleset/Name: Datum bleibt
                    optional (kann später ergänzt werden), aber ein bereits
                    gesetztes Enddatum vor dem Startdatum ist nie sinnvoll —
                    ohne Hinweis würde das unbemerkt bis in den Review-Schritt
                    und potenziell bis zur Veröffentlichung durchrutschen. */}
                {data.info.dateFrom &&
                  data.info.dateTo &&
                  data.info.dateTo < data.info.dateFrom && (
                    <p className="mt-3 text-sm text-warning">
                      Enddatum liegt vor dem Startdatum.
                    </p>
                  )}
              </div>
            )}

            {step === "divisions" && (
              <div>
                <h2 className="mb-1 text-lg font-semibold">Divisionen</h2>
                <p className="mb-4 text-sm text-text-muted">
                  Aus dem gewählten Ruleset verfügbare Divisionen — wähle, was
                  für dieses Match freigeschaltet ist.
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableDivisions.map((d) => (
                    <Chip
                      key={d}
                      active={data.divisions.includes(d)}
                      onClick={() => toggleInList("divisions", d)}
                    >
                      {d}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {step === "categories" && (
              <div>
                <h2 className="mb-1 text-lg font-semibold">Kategorien</h2>
                <p className="mb-4 text-sm text-text-muted">
                  Überlappend, nicht exklusiv — ein Schütze kann z. B. Lady
                  und Senior gleichzeitig sein.
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((c) => (
                    <Chip
                      key={c}
                      active={data.categories.includes(c)}
                      onClick={() => toggleInList("categories", c)}
                    >
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {step === "stages" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Stages</h2>
                  <button
                    onClick={addStage}
                    className="rounded-lg border border-accent/50 px-3 py-1.5 text-sm text-accent hover:bg-accent-dim transition-colors"
                  >
                    + Stage hinzufügen
                  </button>
                </div>
                {data.stages.length === 0 && (
                  <p className="text-sm text-text-faint">
                    Noch keine Stages angelegt.
                  </p>
                )}
                <div className="space-y-2">
                  {/* flex-col sm:flex-row: Name-Input + Targets/Entfernen sind
                      zwei eigene Reihen, die auf Mobile untereinander statt
                      nebeneinander gezwängt werden — als eine Reihe (Nummer +
                      dehnbares Input + festes Targets-Feld + Label + Button)
                      lief das rechts aus dem Bildschirm. */}
                  {data.stages.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-3 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="w-8 shrink-0 text-center font-mono text-text-muted">
                          {s.number}
                        </span>
                        <input
                          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 focus:border-accent focus:outline-none"
                          value={s.name}
                          onChange={(e) =>
                            updateStage(s.id, { name: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <input
                          type="number"
                          min={1}
                          className="w-20 shrink-0 rounded-lg border border-border bg-surface px-3 py-2 text-center focus:border-accent focus:outline-none"
                          value={s.targets}
                          onChange={(e) =>
                            updateStage(s.id, {
                              targets: Number(e.target.value) || 0,
                            })
                          }
                        />
                        <span className="shrink-0 text-xs text-text-faint">
                          Targets
                        </span>
                        <button
                          onClick={() => removeStage(s.id)}
                          className="shrink-0 text-text-faint hover:text-live"
                          aria-label="Stage entfernen"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === "registration" && (
              <div>
                <h2 className="mb-4 text-lg font-semibold">Registrierung</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Gebühr">
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      value={data.registration.fee}
                      onChange={(e) =>
                        update("registration", {
                          ...data.registration,
                          fee: e.target.value,
                        })
                      }
                      placeholder="95"
                    />
                  </Field>
                  <Field label="Währung">
                    <select
                      className={inputClass}
                      value={data.registration.currency}
                      onChange={(e) =>
                        update("registration", {
                          ...data.registration,
                          currency: e.target.value,
                        })
                      }
                    >
                      {["EUR", "GBP", "CHF", "PLN", "CZK", "SEK", "NOK", "DKK"].map(
                        (c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>
                  <Field label="Öffnet am">
                    <input
                      type="date"
                      className={inputClass}
                      value={data.registration.opensAt}
                      onChange={(e) =>
                        update("registration", {
                          ...data.registration,
                          opensAt: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Schließt am">
                    <input
                      type="date"
                      className={inputClass}
                      value={data.registration.closesAt}
                      onChange={(e) =>
                        update("registration", {
                          ...data.registration,
                          closesAt: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Kapazität (Teilnehmer)">
                    <input
                      type="number"
                      min={1}
                      className={inputClass}
                      value={data.registration.capacity}
                      onChange={(e) =>
                        update("registration", {
                          ...data.registration,
                          capacity: e.target.value,
                        })
                      }
                      placeholder="120"
                    />
                  </Field>
                </div>
                {/* Gleiches Prinzip wie die Datumsprüfung im Info-Schritt —
                    nicht blockierend, nur ein Hinweis. */}
                {data.registration.opensAt &&
                  data.registration.closesAt &&
                  data.registration.closesAt < data.registration.opensAt && (
                    <p className="mt-3 text-sm text-warning">
                      Schließt-Datum liegt vor dem Öffnen-Datum.
                    </p>
                  )}
              </div>
            )}

            {step === "squads" && (
              <div>
                <h2 className="mb-4 text-lg font-semibold">Squads</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Anzahl Squads">
                    <input
                      type="number"
                      min={1}
                      className={inputClass}
                      value={data.squads.count}
                      onChange={(e) =>
                        update("squads", {
                          ...data.squads,
                          count: e.target.value,
                        })
                      }
                      placeholder="8"
                    />
                  </Field>
                  <Field label="Kapazität pro Squad">
                    <input
                      type="number"
                      min={1}
                      className={inputClass}
                      value={data.squads.capacityPerSquad}
                      onChange={(e) =>
                        update("squads", {
                          ...data.squads,
                          capacityPerSquad: e.target.value,
                        })
                      }
                      placeholder="15"
                    />
                  </Field>
                </div>
                {data.squads.count && data.squads.capacityPerSquad && (
                  <p className="mt-4 text-sm text-text-muted">
                    Gesamtkapazität:{" "}
                    <span className="font-mono text-accent">
                      {Number(data.squads.count) *
                        Number(data.squads.capacityPerSquad)}
                    </span>{" "}
                    Teilnehmer
                  </p>
                )}
              </div>
            )}

            {step === "officials" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Officials</h2>
                  <button
                    onClick={addOfficial}
                    className="rounded-lg border border-accent/50 px-3 py-1.5 text-sm text-accent hover:bg-accent-dim transition-colors"
                  >
                    + Official zuweisen
                  </button>
                </div>
                {data.officials.length === 0 && (
                  <p className="text-sm text-text-faint">
                    Noch keine Officials zugewiesen.
                  </p>
                )}
                {/* addOfficial zyklt bei > staffPool.length Officials durch
                    denselben Pool (z. B. wird der 7. wieder Person 1) — ohne
                    Hinweis würde die selbe Person unbemerkt für zwei Rollen
                    gleichzeitig eingeplant, was bei einem echten Match nie
                    funktioniert (kann nicht gleichzeitig Chief RO und
                    Scorekeeper sein). Betrifft genauso das manuelle
                    Umstellen eines Dropdowns auf einen bereits vergebenen
                    Namen. */}
                {duplicateOfficialNames.length > 0 && (
                  <p className="mb-3 text-sm text-warning">
                    Mehrfach zugewiesen: {duplicateOfficialNames.join(", ")}.
                  </p>
                )}
                <div className="space-y-2">
                  {/* Gleiches Muster wie bei den Stages: Name-Select bekommt
                      seine eigene Reihe, Rolle+Entfernen die zweite — das
                      feste w-44 der Rollen-Auswahl passte auf Mobile nicht
                      mehr neben ein zusätzliches flex-1 Select. */}
                  {data.officials.map((o) => (
                    <div
                      key={o.id}
                      className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-3 sm:flex-row sm:items-center"
                    >
                      <select
                        className={`min-w-0 flex-1 rounded-lg border bg-surface px-3 py-2 focus:border-accent focus:outline-none ${
                          duplicateOfficialNames.includes(o.name)
                            ? "border-warning/60"
                            : "border-border"
                        }`}
                        value={o.name}
                        onChange={(e) =>
                          updateOfficial(o.id, { name: e.target.value })
                        }
                      >
                        {staffPool.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <div className="flex shrink-0 items-center gap-3">
                        <select
                          className="w-full min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 focus:border-accent focus:outline-none sm:w-44 sm:flex-none"
                          value={o.role}
                          onChange={(e) =>
                            updateOfficial(o.id, { role: e.target.value })
                          }
                        >
                          {availableOfficialRoles.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeOfficial(o.id)}
                          className="shrink-0 text-text-faint hover:text-live"
                          aria-label="Official entfernen"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === "review" && (
              <div>
                <h2 className="mb-4 text-lg font-semibold">
                  Review & Publish
                </h2>
                <dl className="space-y-3 text-sm">
                  <Row label="Ruleset">
                    {data.ruleset === "ipsc-handgun"
                      ? "IPSC Handgun"
                      : data.ruleset === "custom"
                        ? "Custom / Club Match"
                        : "—"}
                  </Row>
                  <Row label="Match">
                    {data.info.name || "—"}
                    {data.info.range && ` · ${data.info.range}`}
                  </Row>
                  <Row label="Level">{data.info.level}</Row>
                  <Row label="Datum">
                    {data.info.dateFrom && data.info.dateTo
                      ? `${data.info.dateFrom} – ${data.info.dateTo}`
                      : "—"}
                  </Row>
                  <Row label="Divisionen">
                    {data.divisions.length > 0
                      ? data.divisions.join(", ")
                      : "—"}
                  </Row>
                  <Row label="Kategorien">
                    {data.categories.length > 0
                      ? data.categories.join(", ")
                      : "—"}
                  </Row>
                  <Row label="Stages">
                    {data.stages.length > 0
                      ? `${data.stages.length} Stages`
                      : "—"}
                  </Row>
                  <Row label="Gebühr">
                    {data.registration.fee
                      ? `${data.registration.fee} ${data.registration.currency}`
                      : "—"}
                  </Row>
                  <Row label="Squads">
                    {data.squads.count
                      ? `${data.squads.count} × ${data.squads.capacityPerSquad || "?"} Plätze`
                      : "—"}
                  </Row>
                  <Row label="Officials">
                    {data.officials.length > 0
                      ? `${data.officials.length} zugewiesen`
                      : "—"}
                  </Row>
                </dl>

                <div className="mt-8">
                  {!canPublish && (
                    <p className="mb-3 text-sm text-warning">
                      Ruleset und Match-Name sind Pflichtfelder — bitte vor
                      dem Veröffentlichen ergänzen.
                    </p>
                  )}
                  <button
                    disabled={!canPublish}
                    onClick={() => setPublished(true)}
                    className="w-full rounded-xl bg-accent py-4 text-lg font-semibold text-bg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:pointer-events-none"
                  >
                    PUBLISH
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-between">
            <button
              disabled={!canGoBack}
              onClick={() => setStep(wizardSteps[stepIndex - 1].id)}
              className="rounded-xl border border-border px-5 py-2.5 text-sm hover:bg-surface-raised transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              ← Zurück
            </button>
            {canGoNext && (
              <button
                disabled={!canProceed}
                onClick={() => setStep(wizardSteps[stepIndex + 1].id)}
                className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:pointer-events-none"
              >
                Weiter →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border pb-2">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
