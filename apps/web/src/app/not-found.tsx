import Link from "next/link";
import { FortLogo } from "@/components/fort-logo";

// Ohne diese Datei fällt Next.js auf sein unstyled Standard-"404 | This
// page could not be found." zurück — komplett unbrandet, saß bisher als
// nackter Text in der ansonsten dunklen App. Betrifft real jeden falschen
// /athletes/[id]- oder /matches/[id]-Link (beide dynamicParams: false,
// jede unbekannte ID landet hier), nicht nur Tippfehler in der URL.
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-24 text-center">
      <FortLogo className="mb-6 h-10 w-auto text-text-faint" />
      <p className="font-mono text-sm uppercase tracking-wide text-text-faint">
        404
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Seite nicht gefunden</h1>
      <p className="mt-2 text-sm text-text-muted">
        Diese Seite existiert nicht oder wurde verschoben.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-xl bg-accent px-5 py-3 font-medium text-bg hover:opacity-90 transition-opacity"
        >
          Zur Startseite
        </Link>
        <Link
          href="/athletes"
          className="rounded-xl border border-border px-5 py-3 font-medium hover:bg-surface-raised transition-colors"
        >
          Athleten durchsuchen
        </Link>
      </div>
    </div>
  );
}
