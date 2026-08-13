import { supabase } from "./supabase";
import {
  matches as mockMatches,
  type MatchStatus,
  type MatchSummary,
  type RegistrationStatus,
} from "./mock-data";

// Übersetzt zwischen DB-Modell und der Form, die die UI heute erwartet.
//
// Warum die UI-Form (MatchSummary) erhalten bleibt, statt die Komponenten
// direkt auf DB-Zeilen umzustellen: So ist der Umstieg VERIFIZIERBAR — die
// Discovery-Seite muss mit echten Daten exakt dasselbe zeigen wie vorher mit
// den Mocks. Jede Abweichung ist dann ein Fehler in der Anbindung, nicht ein
// beabsichtigter Unterschied. Die UI-Typen später aufzuräumen ist ein
// eigener, dann risikoloser Schritt.

// competitions.status ist feingliedriger als der UI-Status: die UI kennt nur
// live/upcoming/completed, die DB unterscheidet zusätzlich draft, published,
// registration_open/closed und archived.
function toMatchStatus(dbStatus: string): MatchStatus {
  switch (dbStatus) {
    case "in_progress":
      return "live";
    case "completed":
    case "archived":
      return "completed";
    default:
      return "upcoming";
  }
}

// Der Registrierungszustand ist im Schema kein eigenes Feld mehr, sondern
// ergibt sich aus Status und Auslastung — das ist die ehrlichere Modellierung:
// "Warteliste" IST der Zustand "offen, aber voll".
function toRegistrationStatus(
  dbStatus: string,
  filled: number,
  capacity: number | null,
): RegistrationStatus {
  if (dbStatus !== "registration_open") return "closed";
  if (capacity !== null && filled >= capacity) return "waitlist";
  return "open";
}

// "18.–19. April 2027" bzw. "12. September 2026" — dieselbe Schreibweise wie
// bisher in den Mock-Daten, damit der Vergleich stimmt.
function formatDateRange(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt) return "";
  const start = new Date(startsAt);
  const monthYear = new Intl.DateTimeFormat("de-DE", {
    month: "long",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(start);
  const startDay = start.getDate();

  if (!endsAt) return `${startDay}. ${monthYear}`;

  const end = new Date(endsAt);
  const endDay = end.getDate();
  if (startDay === endDay) return `${startDay}. ${monthYear}`;

  // Halbgeviertstrich wie im Mock ("18.–19."), nicht Bindestrich.
  return `${startDay}.–${endDay}. ${monthYear}`;
}

export async function getMatches(): Promise<MatchSummary[]> {
  // Ohne konfigurierte Datenbank bleibt der Prototyp lauffähig (s. supabase.ts).
  if (!supabase) return mockMatches;

  // Zwei getrennte Abfragen statt eines Joins: PostgREST kann nicht auf
  // public_competition_stats joinen, weil eine View keinen Fremdschlüssel
  // hat ("Could not find a relationship ... in the schema cache"). Statt der
  // Datenbank dafür eine künstliche FK-Beziehung unterzuschieben, holen wir
  // die Aggregate separat und führen sie über die id zusammen — explizit und
  // ohne Abhängigkeit von PostgREST-Beziehungserkennung.
  const [competitionsResult, statsResult] = await Promise.all([
    supabase
      .from("competitions")
      .select(
        `
        id, slug, name, level, status, starts_at, ends_at, currency,
        registration_fee, capacity,
        ranges ( city, country ),
        ruleset_versions ( rulesets ( disciplines ( name ) ) ),
        stages ( id )
      `,
      )
      .order("starts_at", { ascending: true }),
    supabase
      .from("public_competition_stats")
      .select("competition_id, registered_count"),
  ]);

  const { data, error } = competitionsResult;

  if (error) {
    // Bewusst kein Throw: eine nicht erreichbare Datenbank soll die Seite
    // nicht weißbrennen. Der Fehler ist in der Konsole sichtbar, die Seite
    // zeigt solange die Mock-Daten.
    console.error("Supabase: Matches konnten nicht geladen werden.", error);
    return mockMatches;
  }

  // Fehlende Statistiken sind nicht fatal — dann steht die Teilnehmerzahl auf
  // 0, statt die ganze Liste zu verlieren.
  if (statsResult.error) {
    console.error(
      "Supabase: Teilnehmerzahlen konnten nicht geladen werden.",
      statsResult.error,
    );
  }

  const registeredByCompetition = new Map(
    (statsResult.data ?? []).map((s) => [s.competition_id, s.registered_count]),
  );

  return (data ?? []).map((c) => {
    // Aus der View, nicht durch Zeilenzählen: einzelne Registrierungen sind
    // per RLS geschützt und für anonyme Besucher unsichtbar (s. Migration
    // 20260813120800).
    const filled = registeredByCompetition.get(c.id) ?? 0;
    const capacity = c.capacity;
    return {
      id: c.slug,
      name: c.name,
      city: c.ranges?.city ?? "",
      country: c.ranges?.country ?? "",
      // Die DISZIPLIN, nicht der Regelwerksname: bei IPSC heißen beide gleich
      // ("IPSC Handgun"), beim Club-Match nicht — dort hieße das Regelwerk
      // "Club Match Regelwerk" statt "Custom / Club Match". Die Discovery
      // filtert nach Disziplin, nicht nach Regelwerk.
      discipline: c.ruleset_versions?.rulesets?.disciplines?.name ?? "",
      level: c.level ?? "",
      dateLabel: formatDateRange(c.starts_at, c.ends_at),
      status: toMatchStatus(c.status),
      registrationStatus: toRegistrationStatus(c.status, filled, capacity),
      spotsFilled: filled,
      spotsTotal: capacity ?? 0,
      currency: c.currency,
      fee: Number(c.registration_fee ?? 0),
      stagesTotal: c.stages?.length ?? 0,
      // Wie viele Stages bereits durchgelaufen sind, steht erst fest, wenn
      // die Rules Engine Ergebnisse pro Stage schreibt. Bis dahin ehrlich 0
      // statt einer erfundenen Zahl.
      stagesDone: 0,
    };
  });
}
