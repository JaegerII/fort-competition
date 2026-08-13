"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FortLogo } from "@/components/fort-logo";
import { useAuth } from "@/contexts/auth-context";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");

  function completeLogin(mockEmail: string) {
    login(mockEmail);
    const returnTo = searchParams.get("returnTo") || "/";
    router.push(returnTo);
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="mb-8 flex flex-col items-center text-center">
        <FortLogo className="mb-4 h-10 w-auto text-accent" />
        <h1 className="text-2xl font-semibold">Anmelden</h1>
        <p className="mt-2 text-sm text-text-muted">
          Dein FORT Athlete Account — auch für FORT Performance nutzbar.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => completeLogin("athlet@example.com")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 font-medium hover:bg-surface-raised transition-colors"
        >
          Mit Google fortfahren
        </button>
        <button
          onClick={() => completeLogin("athlet@icloud.com")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 font-medium hover:bg-surface-raised transition-colors"
        >
          Mit Apple fortfahren
        </button>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-text-faint">
        <div className="h-px flex-1 bg-border" />
        oder mit E-Mail
        <div className="h-px flex-1 bg-border" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) completeLogin(email.trim());
        }}
        className="space-y-3"
      >
        <input
          type="email"
          required
          placeholder="deine@email.de"
          aria-label="E-Mail-Adresse"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface-raised px-4 py-3 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="w-full rounded-xl bg-accent py-3 font-medium text-bg hover:opacity-90 transition-opacity"
        >
          Weiter
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-text-faint">
        Prototyp — jede E-Mail-Eingabe meldet dich sofort an, es gibt keine
        echte Authentifizierung.
      </p>
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
