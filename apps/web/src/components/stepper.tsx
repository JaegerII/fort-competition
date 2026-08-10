"use client";

export function Stepper({
  label,
  value,
  onChange,
  tone = "neutral",
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
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
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface-raised text-lg font-semibold active:scale-95 transition-transform"
          aria-label={`${label} verringern`}
        >
          –
        </button>
        <span
          className={`w-8 text-center font-mono text-lg font-semibold ${valueColor}`}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface-raised text-lg font-semibold active:scale-95 transition-transform"
          aria-label={`${label} erhöhen`}
        >
          +
        </button>
      </div>
    </div>
  );
}
