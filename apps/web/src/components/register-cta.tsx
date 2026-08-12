"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useRegistrations } from "@/contexts/registrations-context";
import type { RegistrationStatus } from "@/lib/mock-data";

// Eigene Client-Komponente, weil die Match-Seite ein Server Component ist
// (statischer Export) und useAuth/useRegistrations clientseitigen State
// (localStorage) brauchen — hier bewusst so klein wie möglich geschnitten.
export function RegisterCta({
  matchId,
  registrationStatus,
}: {
  matchId: string;
  registrationStatus: RegistrationStatus;
}) {
  const { user } = useAuth();
  const { isRegistered } = useRegistrations();
  const registerHref = `/matches/${matchId}/register`;

  const existing = user ? isRegistered(matchId) : undefined;
  if (existing) {
    const waitlisted = existing.status === "waitlisted";
    return (
      <Link
        href={registerHref}
        className={`w-full shrink-0 rounded-xl border px-5 py-3 text-center font-medium transition-opacity hover:opacity-90 sm:w-auto ${
          waitlisted
            ? "border-warning/50 text-warning"
            : "border-accent/50 text-accent"
        }`}
      >
        {waitlisted ? "⏳ Auf Warteliste" : "✓ Angemeldet"}
      </Link>
    );
  }

  const href = user
    ? registerHref
    : `/login?returnTo=${encodeURIComponent(registerHref)}`;

  return (
    <Link
      href={href}
      className="w-full shrink-0 rounded-xl bg-accent px-5 py-3 text-center font-medium text-bg transition-opacity hover:opacity-90 sm:w-auto"
    >
      {registrationStatus === "open" ? "Registrieren" : "Auf Warteliste setzen"}
    </Link>
  );
}
