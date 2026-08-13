import { getMatches } from "@/lib/queries";
import { DiscoveryClient } from "@/components/discovery-client";

// Server-Komponente: lädt die Matches beim Rendern aus Supabase (bzw. fällt
// auf die Mock-Daten zurück, wenn keine Datenbank konfiguriert ist) und
// übergibt sie an die Client-Komponente, die nur noch filtert.
//
// Beim aktuellen statischen Export passiert das zur BUILD-Zeit. Das reicht
// für Discovery vollkommen — eine Match-Liste ändert sich nicht sekündlich.
// Sobald wirklich Laufzeit-Frische gebraucht wird (Live-Ergebnisse), holt
// die Live-Seite ihre Daten clientseitig direkt nach; dafür muss der Export
// nicht aufgegeben werden.
export default async function DiscoverPage() {
  const matches = await getMatches();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Matches entdecken
        </h1>
        <p className="mt-2 text-text-muted">
          Kein Login nötig, um zu suchen oder live mitzuverfolgen — Anmeldung
          erst zum Registrieren.
        </p>
      </div>

      <DiscoveryClient matches={matches} />
    </div>
  );
}
