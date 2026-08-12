"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import type { RegistrationStatus } from "@/lib/mock-data";

// Eigene Client-Komponente, weil die Match-Seite ein Server Component ist
// (statischer Export) und useAuth clientseitigen State (localStorage)
// braucht — hier bewusst so klein wie möglich geschnitten.
export function RegisterCta({
  matchId,
  registrationStatus,
}: {
  matchId: string;
  registrationStatus: RegistrationStatus;
}) {
  const { user } = useAuth();
  const registerHref = `/matches/${matchId}/register`;
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
