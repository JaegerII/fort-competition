"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

// Reagiert jetzt wirklich auf den Login-Status (Spec §11 Personal Match
// Dashboard), statt immer dieselben Beispieldaten mit Disclaimer zu zeigen.
// Die Zahlen selbst sind weiterhin Mock-Werte — es gibt keine Registrierungs-
// /Scoring-Verknüpfung zu einem echten Nutzer ohne Backend —, aber welcher
// Block überhaupt sichtbar ist, hängt jetzt vom echten Auth-State ab.
export function PersonalMatchCard() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) {
    return (
      <aside className="order-1 h-fit min-w-0 rounded-2xl border border-border bg-surface p-5 lg:order-none">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Dein Match
        </h2>
        <p className="mb-4 text-sm text-text-muted">
          Melde dich an, um deine Platzierung und deinen Fortschritt in
          diesem Match zu sehen.
        </p>
        <Link
          href={`/login?returnTo=${encodeURIComponent(pathname ?? "")}`}
          className="inline-block rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
        >
          Anmelden
        </Link>
      </aside>
    );
  }

  return (
    <aside className="order-1 h-fit min-w-0 rounded-2xl border border-border bg-surface p-5 lg:order-none">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
        Dein Match, {user.name}
      </h2>
      <dl className="space-y-4">
        <div className="flex items-baseline justify-between">
          <dt className="text-sm text-text-muted">Overall</dt>
          <dd className="font-mono text-lg">
            #14 <span className="text-text-faint text-sm">/ 127</span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-sm text-text-muted">Division</dt>
          <dd className="font-mono text-lg">
            #3 <span className="text-text-faint text-sm">/ 38</span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-sm text-text-muted">Match %</dt>
          <dd className="font-mono text-lg text-accent">91.27%</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-sm text-text-muted">Stages</dt>
          <dd className="font-mono text-lg">8 / 12</dd>
        </div>
        <div className="border-t border-border pt-4">
          <div className="flex items-baseline justify-between">
            <dt className="text-sm text-text-muted">Letzte Stage</dt>
            <dd className="text-sm">Stage 8 · Rang #4</dd>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <dt className="text-sm text-text-muted">Bewegung</dt>
            <dd className="text-sm text-accent">↑ 2 Plätze</dd>
          </div>
        </div>
      </dl>
      <p className="mt-4 text-xs text-text-faint">
        Illustrative Werte — echte Registrierungs-/Scoring-Verknüpfung folgt
        in Phase 7.
      </p>
    </aside>
  );
}
