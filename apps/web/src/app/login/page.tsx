"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FortLogo } from "@/components/fort-logo";
import { useAuth } from "@/contexts/auth-context";

type Mode = "signin" | "signup";

function LoginForm() {
  const { signIn, signUp, isMockAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result =
      mode === "signup"
        ? await signUp(email.trim(), password, displayName.trim())
        : await signIn(email.trim(), password);

    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // Bei aktivierter E-Mail-Bestätigung existiert direkt nach signUp noch
    // keine Session — dann wäre eine Weiterleitung irreführend, weil der
    // Nutzer weiterhin abgemeldet ist.
    if (mode === "signup" && !isMockAuth) {
      setConfirmationSent(true);
      return;
    }

    router.push(searchParams.get("returnTo") || "/");
  }

  if (confirmationSent) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 text-center">
        <FortLogo className="mx-auto mb-6 h-10 w-auto text-accent" />
        <h1 className="text-2xl font-semibold">Konto angelegt</h1>
        <p className="mt-3 text-sm text-text-muted">
          Falls eine Bestätigung nötig ist, findest du sie in deinem
          Postfach. Danach kannst du dich anmelden.
        </p>
        <button
          onClick={() => {
            setConfirmationSent(false);
            setMode("signin");
            setPassword("");
          }}
          className="mt-6 rounded-xl bg-accent px-5 py-3 font-medium text-bg hover:opacity-90 transition-opacity"
        >
          Zur Anmeldung
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="mb-8 flex flex-col items-center text-center">
        <FortLogo className="mb-4 h-10 w-auto text-accent" />
        <h1 className="text-2xl font-semibold">
          {mode === "signup" ? "Konto erstellen" : "Anmelden"}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Dein FORT Athlete Account — auch für FORT Performance nutzbar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "signup" && (
          <div>
            <label
              htmlFor="signup-name"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              Anzeigename
            </label>
            <input
              id="signup-name"
              type="text"
              required
              autoComplete="name"
              placeholder="Vor- und Nachname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-raised px-4 py-3 focus:border-accent focus:outline-none"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="auth-email"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted"
          >
            E-Mail
          </label>
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            placeholder="deine@email.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-raised px-4 py-3 focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted"
          >
            Passwort
          </label>
          <input
            id="auth-password"
            type="password"
            required
            minLength={6}
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-raised px-4 py-3 focus:border-accent focus:outline-none"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-live">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-accent py-3 font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
        >
          {pending
            ? "Einen Moment…"
            : mode === "signup"
              ? "Konto erstellen"
              : "Anmelden"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setError(null);
        }}
        className="mt-6 w-full text-center text-sm text-text-muted hover:text-text transition-colors"
      >
        {mode === "signup"
          ? "Schon ein Konto? Anmelden"
          : "Noch kein Konto? Jetzt erstellen"}
      </button>

      {/* Google/Apple standen hier vorher als Buttons, taten aber nichts —
          sie riefen dieselbe Mock-Anmeldung auf. Echtes OAuth braucht beim
          Anbieter registrierte Client-IDs; bis dahin ehrlich als "bald"
          markiert statt als funktionierender Knopf getarnt. */}
      <p className="mt-8 text-center text-xs text-text-faint">
        Anmeldung mit Google und Apple folgt.
      </p>

      {isMockAuth && (
        <p className="mt-3 text-center text-xs text-warning">
          Demo ohne Datenbank: jede Eingabe meldet dich an, es wird kein
          echtes Konto angelegt.
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
