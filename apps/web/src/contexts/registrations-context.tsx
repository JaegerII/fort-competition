"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Gleiches Mock-Prinzip wie auth-context.tsx: rein clientseitig,
// localStorage-backed, kein Backend. Schließt die Lücke, dass eine
// abgeschlossene Registrierung sonst nirgends sichtbar bleibt — Match-Seite
// zeigt nach einem Reload wieder "Registrieren", als wäre nichts passiert.
// Leichte, MVP-taugliche Umsetzung von "Registered Matches auf dem Profil"
// (docs/ROADMAP_EXTENSIONS.md Punkt 1) — kein eigenes Karrieremodell, nur
// genug, damit der Zustand im Prototyp konsistent bleibt.
export interface Registration {
  matchId: string;
  matchName: string;
  division: string;
  categories: string[];
  squadName: string;
  squadTimeSlot: string;
  status: "confirmed" | "waitlisted";
  registeredAt: string;
}

interface RegistrationsContextValue {
  registrations: Registration[];
  registerFor: (reg: Omit<Registration, "registeredAt">) => void;
  cancelRegistration: (matchId: string) => void;
  isRegistered: (matchId: string) => Registration | undefined;
}

const RegistrationsContext = createContext<RegistrationsContextValue | null>(
  null,
);

const STORAGE_KEY = "fort-competition-mock-registrations";

export function RegistrationsProvider({ children }: { children: ReactNode }) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        // Gleiche bewusste Ausnahme wie in auth-context.tsx: einmaliges
        // Hydration-Read direkt nach dem Mount, kein Reagieren auf ein sich
        // veränderndes externes System.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRegistrations(JSON.parse(raw));
      } catch {
        // ignore malformed storage
      }
    }
    setHydrated(true);
  }, []);

  function registerFor(reg: Omit<Registration, "registeredAt">) {
    setRegistrations((prev) => {
      const next = [
        ...prev.filter((r) => r.matchId !== reg.matchId),
        { ...reg, registeredAt: new Date().toISOString() },
      ];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function cancelRegistration(matchId: string) {
    setRegistrations((prev) => {
      const next = prev.filter((r) => r.matchId !== matchId);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function isRegistered(matchId: string) {
    return registrations.find((r) => r.matchId === matchId);
  }

  if (!hydrated) {
    return (
      <RegistrationsContext.Provider
        value={{
          registrations: [],
          registerFor,
          cancelRegistration,
          isRegistered: () => undefined,
        }}
      >
        {children}
      </RegistrationsContext.Provider>
    );
  }

  return (
    <RegistrationsContext.Provider
      value={{ registrations, registerFor, cancelRegistration, isRegistered }}
    >
      {children}
    </RegistrationsContext.Provider>
  );
}

export function useRegistrations() {
  const ctx = useContext(RegistrationsContext);
  if (!ctx)
    throw new Error(
      "useRegistrations muss innerhalb von RegistrationsProvider stehen",
    );
  return ctx;
}
