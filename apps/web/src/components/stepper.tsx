"use client";

// onChange nimmt eine Updater-Funktion (wie React setState), nicht den fertig
// berechneten nächsten Wert — Stepper selbst hält keinen State, `value` ist
// nur ein Prop. Zwei Klicks auf "+" im selben React-Batch (schnelles
// Doppeltippen ist bei einer flotten RO-Scoring-Eingabe real plausibel)
// lasen sonst beide denselben veralteten `value`-Prop und berechneten
// `value + 1` zweimal identisch — der zweite Klick "gewann" einfach nicht
// dazu, er ersetzte den ersten. Gleiche Fehlerklasse wie der Wizard-Fix
// (stale Closures bei gebatchten State-Updates), hier im Callback-Vertrag
// statt in einer setState-Struktur.
export function Stepper({
  label,
  value,
  onChange,
  tone = "neutral",
}: {
  label: string;
  value: number;
  onChange: (updater: (prev: number) => number) => void;
  tone?: "neutral" | "warning" | "live";
}) {
  const valueColor =
    tone === "warning"
      ? "text-warning"
      : tone === "live"
        ? "text-live"
        : "text-text";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange((prev) => Math.max(0, prev - 1))}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-raised text-lg font-semibold active:scale-95 transition-transform"
          aria-label={`${label} verringern`}
        >
          –
        </button>
        <span
          className={`w-7 shrink-0 text-center font-mono text-lg font-semibold ${valueColor}`}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange((prev) => prev + 1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-raised text-lg font-semibold active:scale-95 transition-transform"
          aria-label={`${label} erhöhen`}
        >
          +
        </button>
      </div>
    </div>
  );
}
