"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Generischer Zurück-Link für Seiten, die von mehreren Stellen aus
// erreichbar sind (z.B. Athletenprofile — von jeder Ranglisten-Zeile auf
// jeder Match-Seite verlinkt) und deshalb kein einzelnes sinnvolles festes
// Linkziel haben. Browser-History statt fixem href, mit Fallback auf die
// Startseite, falls die Seite direkt aufgerufen wurde (kein history-Eintrag).
export function BackLink({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
      className="mb-4 flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
    >
      <ArrowLeft size={16} />
      Zurück
    </button>
  );
}
