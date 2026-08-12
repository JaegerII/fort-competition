"use client";

import { useState } from "react";
import { ChevronRight, Download, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRegistrations } from "@/contexts/registrations-context";

const placeholderRows: { label: string; value?: string }[] = [
  { label: "Spracheinstellungen", value: "Deutsch" },
  { label: "Benachrichtigungen" },
  { label: "Über FORT Competition" },
];

// "Datenschutz" ist die einzige Settings-Zeile, die tatsächlich etwas tut —
// Datenexport und Konto-/Datenlöschung sind in Spec §16 explizit als
// MVP-GDPR-Grundlagen genannt, und anders als Sprache/Benachrichtigungen
// (die eine echte Backend-/i18n-Infrastruktur bräuchten, um mehr als
// Kulisse zu sein) lässt sich das hier ehrlich umsetzen: alle
// personenbezogenen Daten des Prototyps liegen ohnehin nur in
// localStorage (auth-context.tsx, registrations-context.tsx).
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { registrations } = useRegistrations();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      account: user,
      registrations,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fort-competition-meine-daten.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function deleteAllData() {
    window.localStorage.removeItem("fort-competition-mock-registrations");
    logout();
    setConfirmingDelete(false);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Einstellungen</h1>

      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {placeholderRows.map((r) => (
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
      <p className="mt-2 text-xs text-text-faint">
        Platzhalter — nicht funktional verdrahtet.
      </p>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-text-muted">
        Datenschutz
      </h2>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        <button
          onClick={exportData}
          disabled={!user}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Download size={18} className="text-text-muted" />
          <span className="flex-1">Meine Daten exportieren</span>
          <ChevronRight size={16} className="text-text-faint" />
        </button>

        {confirmingDelete ? (
          <div className="px-4 py-3.5">
            <p className="mb-3 text-sm text-text-muted">
              Löscht deine Registrierungen und meldet dich ab. Kann nicht
              rückgängig gemacht werden.
            </p>
            <div className="flex gap-2">
              <button
                onClick={deleteAllData}
                className="rounded-lg bg-live px-3 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                Wirklich löschen
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-raised transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            disabled={!user}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm text-live transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Trash2 size={18} />
            <span className="flex-1">Meine Daten löschen</span>
            <ChevronRight size={16} className="text-text-faint" />
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-text-faint">
        {user
          ? "Exportiert/löscht die im Prototyp gespeicherten Mock-Daten (localStorage) — es gibt kein echtes Backend."
          : "Melde dich an, um deine Daten zu exportieren oder zu löschen."}
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
