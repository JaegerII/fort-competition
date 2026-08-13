"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface AuthUser {
  name: string;
  email: string;
  // shooterId ist die fachliche Identität (shooters.id), nicht die
  // Account-ID. Alles Wettkampfbezogene hängt am Schützen, nicht am Konto —
  // siehe die Entkopplung in Migration 20260813120000.
  shooterId: string | null;
}

interface AuthResult {
  error?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  // true, wenn keine Datenbank konfiguriert ist und der alte Mock greift.
  // Die Login-Seite weist darauf hin, statt echte Anmeldung vorzutäuschen.
  isMockAuth: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_STORAGE_KEY = "fort-competition-mock-auth";

// Supabase-Fehlermeldungen sind englisch und technisch. Die geläufigsten
// bekommen eine verständliche deutsche Entsprechung; alles andere wird
// unverändert durchgereicht, statt einen falschen Grund zu erfinden.
function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message))
    return "E-Mail oder Passwort stimmt nicht.";
  if (/user already registered/i.test(message))
    return "Für diese E-Mail existiert bereits ein Konto.";
  if (/password should be at least/i.test(message))
    return "Das Passwort ist zu kurz.";
  if (/unable to validate email/i.test(message))
    return "Diese E-Mail-Adresse sieht nicht gültig aus.";
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Lädt den zum Konto gehörenden Schützen. Der Trigger aus Migration
  // 20260813121200 legt ihn beim Registrieren an, daher sollte er existieren
  // — fehlt er trotzdem, bleibt shooterId null statt die Anmeldung zu
  // verweigern.
  const loadShooter = useCallback(
    async (userId: string, email: string): Promise<AuthUser> => {
      if (!supabase) return { name: email, email, shooterId: null };
      const { data } = await supabase
        .from("shooters")
        .select("id, display_name")
        .eq("user_id", userId)
        .maybeSingle();
      return {
        name: data?.display_name ?? email.split("@")[0],
        email,
        shooterId: data?.id ?? null,
      };
    },
    [],
  );

  useEffect(() => {
    // Ohne Datenbank: bisheriges Mock-Verhalten aus localStorage.
    if (!supabase) {
      const raw = window.localStorage.getItem(MOCK_STORAGE_KEY);
      if (raw) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setUser(JSON.parse(raw));
        } catch {
          // ignore malformed storage
        }
      }
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      if (session?.user?.email) {
        const profile = await loadShooter(session.user.id, session.user.email);
        if (active) setUser(profile);
      }
      if (active) setLoading(false);
    });

    // Hält den Zustand über Tabs und Token-Refresh hinweg synchron —
    // ein manuell gelesener Session-Wert würde still veralten.
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!active) return;
        if (session?.user?.email) {
          const profile = await loadShooter(session.user.id, session.user.email);
          if (active) setUser(profile);
        } else {
          setUser(null);
        }
      },
    );

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadShooter]);

  async function signIn(email: string, password: string): Promise<AuthResult> {
    if (!supabase) {
      const mockUser: AuthUser = {
        name: email.split("@")[0].replace(/^./, (c) => c.toUpperCase()),
        email,
        shooterId: null,
      };
      setUser(mockUser);
      window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
      return {};
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return error ? { error: translateAuthError(error.message) } : {};
  }

  async function signUp(
    email: string,
    password: string,
    displayName: string,
  ): Promise<AuthResult> {
    if (!supabase) return signIn(email, password);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      // Wird vom Trigger als Anzeigename des Schützenprofils übernommen.
      options: { data: { display_name: displayName } },
    });
    return error ? { error: translateAuthError(error.message) } : {};
  }

  async function logout() {
    if (!supabase) {
      setUser(null);
      window.localStorage.removeItem(MOCK_STORAGE_KEY);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isMockAuth: !isSupabaseConfigured,
        signIn,
        signUp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth muss innerhalb von AuthProvider stehen");
  return ctx;
}
