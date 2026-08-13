"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Rein clientseitiger Mock — kein Backend, kein echtes Session-Handling.
// Simuliert nur genug Zustand, damit der "Login vor Registrierung"-Flow aus
// Spec §6.1 im Prototyp erlebbar ist. Echte Auth (RBAC, sichere Sessions,
// s. Spec §21) ist Phase 7.
interface AuthUser {
  name: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "fort-competition-mock-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        // Bewusste Ausnahme von react-hooks/set-state-in-effect: das ist
        // kein Reagieren auf ein sich veränderndes externes System, sondern
        // ein einmaliges Hydration-Read direkt nach dem Mount (localStorage
        // existiert serverseitig nicht, s. Kommentar unten zum Zweck) — es
        // gibt dafür kein sinnvolles Nicht-Effect-Äquivalent.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(raw));
      } catch {
        // ignore malformed storage
      }
    }
    setHydrated(true);
  }, []);

  function login(email: string) {
    const name = email.includes("@") ? email.split("@")[0] : email;
    const nextUser: AuthUser = {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email,
    };
    setUser(nextUser);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  }

  function logout() {
    setUser(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  // Rendert erst nach der Hydration mit echtem Zustand, damit Server- und
  // Client-Markup beim ersten Paint identisch sind (localStorage existiert
  // serverseitig nicht) — sonst Hydration-Mismatch-Warnung.
  if (!hydrated) {
    return (
      <AuthContext.Provider value={{ user: null, login, logout }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth muss innerhalb von AuthProvider stehen");
  return ctx;
}
