"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MatchSummary, RegistrationSquad } from "@/lib/mock-data";
import { registrationSquads } from "@/lib/mock-data";
import { availableCategories, availableDivisions } from "@/lib/wizard-data";
import { Chip } from "@/components/chip";
import { useAuth } from "@/contexts/auth-context";
import { useRegistrations } from "@/contexts/registrations-context";

type Step = "selection" | "squad" | "payment";

export function RegisterFlow({ match }: { match: MatchSummary }) {
  const { user } = useAuth();
  const { registerFor, cancelRegistration, isRegistered } =
    useRegistrations();
  const pathname = usePathname();
  const [step, setStep] = useState<Step>("selection");
  const [division, setDivision] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [squad, setSquad] = useState<RegistrationSquad | null>(null);
  const [waitlisted, setWaitlisted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const squads = registrationSquads[match.id] ?? [];

  function toggleCategory(c: string) {
    setCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  function pickSquad(s: RegistrationSquad) {
    setSquad(s);
    setWaitlisted(s.filled >= s.capacity);
    setStep("payment");
  }

  // Zweite Absicherung neben der CTA auf der Match-Seite (register-cta.tsx)
  // — falls jemand direkt auf /matches/[id]/register navigiert (Bookmark,
  // Zurück-Button), ohne über den Button gegangen zu sein.
  if (!user) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Anmeldung erforderlich</h1>
        <p className="mt-2 text-sm text-text-muted">
          Melde dich an, um dich für {match.name} zu registrieren.
        </p>
        <Link
          href={`/login?returnTo=${encodeURIComponent(pathname ?? "")}`}
          className="mt-6 inline-block rounded-xl bg-accent px-5 py-3 font-medium text-bg hover:opacity-90 transition-opacity"
        >
          Zum Login
        </Link>
      </div>
    );
  }

  const existing = isRegistered(match.id);

  function handleCancel() {
    cancelRegistration(match.id);
    setConfirmed(false);
    setConfirmingCancel(false);
    setStep("selection");
  }

  if (confirmed || (existing && !confirmed && step === "selection")) {
    const w = confirmed ? waitlisted : existing?.status === "waitlisted";
    const div = confirmed ? division : existing?.division;
    const sq = confirmed
      ? squad
      : existing
        ? { name: existing.squadName, timeSlot: existing.squadTimeSlot }
        : null;
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div
          className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
            w ? "bg-warning-dim text-warning" : "bg-accent-dim text-accent"
          }`}
        >
          {w ? "⏳" : "✓"}
        </div>
        <h1 className="text-2xl font-semibold">
          {confirmed
            ? w
              ? "Auf Warteliste gesetzt"
              : "Registrierung bestätigt"
            : "Du bist bereits registriert"}
        </h1>
        <p className="mt-2 text-text-muted">
          {w ? (
            <>
              {sq?.name} ist aktuell voll. Du bekommst eine Benachrichtigung,
              sobald ein Platz frei wird und automatisch nachgerückt wirst.
            </>
          ) : (
            <>
              Du bist für {match.name} in {div} angemeldet
              {sq ? ` — ${sq.name} (${sq.timeSlot})` : ""}.
            </>
          )}
        </p>
        <Link
          href={`/matches/${match.id}`}
          className="mt-6 inline-block rounded-xl bg-accent px-5 py-3 font-medium text-bg hover:opacity-90 transition-opacity"
        >
          Zur Match-Seite
        </Link>

        <div className="mt-8 border-t border-border pt-6">
          {confirmingCancel ? (
            <div className="mx-auto max-w-xs">
              <p className="mb-3 text-sm text-text-muted">
                Registrierung wirklich stornieren? Dein Platz
                {sq ? ` in ${sq.name}` : ""} wird freigegeben.
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={handleCancel}
                  className="rounded-lg bg-live px-3 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                >
                  Wirklich stornieren
                </button>
                <button
                  onClick={() => setConfirmingCancel(false)}
                  className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-raised transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingCancel(true)}
              className="text-sm text-text-muted hover:text-live transition-colors"
            >
              Registrierung stornieren
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {match.name}
      </p>
      <h1 className="mb-6 text-2xl font-semibold">Registrieren</h1>

      <div className="mb-6 flex gap-2 text-xs text-text-muted">
        {(["selection", "squad", "payment"] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`flex-1 rounded-full h-1.5 ${
              step === s || i < ["selection", "squad", "payment"].indexOf(step)
                ? "bg-accent"
                : "bg-surface-raised"
            }`}
          />
        ))}
      </div>

      {step === "selection" && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-1 text-lg font-semibold">Division</h2>
          <p className="mb-4 text-sm text-text-muted">
            Wähle deine Division für dieses Match.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {availableDivisions.map((d) => (
              <button
                key={d}
                onClick={() => setDivision(d)}
                aria-pressed={division === d}
                className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                  division === d
                    ? "border-accent bg-accent-dim text-accent"
                    : "border-border bg-surface-raised hover:border-accent/40"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <h2 className="mt-6 mb-1 text-lg font-semibold">Kategorien</h2>
          <p className="mb-4 text-sm text-text-muted">
            Optional, überlappend — mehrere gleichzeitig möglich.
          </p>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((c) => (
              <Chip
                key={c}
                active={categories.includes(c)}
                onClick={() => toggleCategory(c)}
              >
                {c}
              </Chip>
            ))}
          </div>

          <button
            disabled={!division}
            onClick={() => setStep("squad")}
            className="mt-8 w-full rounded-xl bg-accent py-3.5 font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:pointer-events-none"
          >
            Weiter zu Squads
          </button>
        </div>
      )}

      {step === "squad" && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-1 text-lg font-semibold">Squad wählen</h2>
          <p className="mb-4 text-sm text-text-muted">
            Volle Squads kannst du trotzdem wählen — du landest dann auf der
            Squad-Warteliste.
          </p>
          <div className="space-y-2">
            {squads.map((s) => {
              const full = s.filled >= s.capacity;
              return (
                <button
                  key={s.id}
                  onClick={() => pickSquad(s)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-raised p-4 text-left hover:border-accent/40 transition-colors"
                >
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-text-muted">{s.timeSlot}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-mono text-sm ${full ? "text-warning" : "text-text-muted"}`}
                    >
                      {s.filled} / {s.capacity}
                    </p>
                    <p className="text-xs text-text-faint">
                      {full ? "Warteliste" : "Plätze frei"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setStep("selection")}
            className="mt-6 text-sm text-text-muted hover:text-text"
          >
            ← Zurück
          </button>
        </div>
      )}

      {step === "payment" && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {waitlisted ? "Zusammenfassung" : "Zahlung"}
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-text-muted">Division</dt>
              <dd>{division}</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-text-muted">Kategorien</dt>
              <dd>{categories.length > 0 ? categories.join(", ") : "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-text-muted">Squad</dt>
              <dd>
                {squad?.name} ({squad?.timeSlot}){" "}
                {waitlisted && (
                  <span className="text-warning">· Warteliste</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Gebühr</dt>
              <dd className="font-mono text-accent">
                {match.fee} {match.currency}
              </dd>
            </div>
          </dl>

          {waitlisted ? (
            <p className="mt-6 text-sm text-text-muted">
              Deine gewählte Squad ist voll. Du wirst zunächst auf die
              Squad-Warteliste gesetzt — die Gebühr wird erst bei Nachrücken
              fällig.
            </p>
          ) : null}

          <button
            onClick={() => {
              registerFor({
                matchId: match.id,
                matchName: match.name,
                division: division ?? "",
                categories,
                squadName: squad?.name ?? "",
                squadTimeSlot: squad?.timeSlot ?? "",
                status: waitlisted ? "waitlisted" : "confirmed",
              });
              setConfirmed(true);
            }}
            className="mt-6 w-full rounded-xl bg-accent py-3.5 font-medium text-bg hover:opacity-90 transition-opacity"
          >
            {waitlisted
              ? "Auf Warteliste setzen"
              : `Jetzt bezahlen · ${match.fee} ${match.currency}`}
          </button>
          <button
            onClick={() => setStep("squad")}
            className="mt-3 w-full text-center text-sm text-text-muted hover:text-text"
          >
            ← Andere Squad wählen
          </button>
        </div>
      )}
    </div>
  );
}
