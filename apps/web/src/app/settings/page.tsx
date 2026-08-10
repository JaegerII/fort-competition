import { ChevronRight } from "lucide-react";

const rows: { label: string; value?: string }[] = [
  { label: "Spracheinstellungen", value: "Deutsch" },
  { label: "Benachrichtigungen" },
  { label: "Datenschutz" },
  { label: "Über FORT Competition" },
];

export default function SettingsPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Einstellungen</h1>

      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {rows.map((r) => (
          <button
            key={r.label}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm transition-colors hover:bg-surface-raised"
          >
            <span>{r.label}</span>
            <span className="flex items-center gap-2 text-text-muted">
              {r.value}
              <ChevronRight size={16} className="text-text-faint" />
            </span>
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs text-text-faint">
        Platzhalter — keine der Optionen ist im Prototyp funktional
        verdrahtet.
      </p>

      <div className="mt-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          FORT Performance
        </p>
        <p className="mt-0.5 text-xs italic text-text-faint">
          Built Through Repetition.
        </p>
      </div>
    </div>
  );
}
