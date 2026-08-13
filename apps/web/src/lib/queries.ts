import { supabase } from "./supabase";
import {
  athleteProfiles as mockAthleteProfiles,
  divisions as mockDivisions,
  leaderboard as mockLeaderboard,
  matches as mockMatches,
  type AthleteProfile,
  type LeaderboardEntry,
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

// Slugs aller öffentlichen Matches — für generateStaticParams beim
// statischen Export. Fällt wie alles andere auf die Mock-Daten zurück,
// damit ein Build ohne Datenbank (GitHub-Pages-Demo) weiterhin
// funktioniert.
export async function getMatchSlugs(): Promise<string[]> {
  if (!supabase) return mockMatches.map((m) => m.id);

  const { data, error } = await supabase.from("competitions").select("slug");
  if (error || !data) {
    console.error("Supabase: Match-Slugs konnten nicht geladen werden.", error);
    return mockMatches.map((m) => m.id);
  }
  return data.map((c) => c.slug);
}

export async function getMatch(slug: string): Promise<MatchSummary | null> {
  const all = await getMatches();
  return all.find((m) => m.id === slug) ?? null;
}

// "Lena Hoffmann" -> "L. Hoffmann", wie bisher in der Rangliste dargestellt.
// Die Kurzform ist Anzeigelogik, kein Datenbankfeld — display_name bleibt
// vollständig, damit Suche und Profilseite den echten Namen zeigen.
function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  const last = parts[parts.length - 1];
  return `${parts[0][0]}. ${last}`;
}

export interface LeaderboardData {
  divisions: string[];
  entries: Record<string, LeaderboardEntry[]>;
}

export async function getLeaderboard(slug: string): Promise<LeaderboardData> {
  if (!supabase) {
    return { divisions: mockDivisions, entries: mockLeaderboard };
  }

  const { data: competition, error: compError } = await supabase
    .from("competitions")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (compError || !competition) {
    console.error("Supabase: Match nicht gefunden für Rangliste.", compError);
    return { divisions: mockDivisions, entries: mockLeaderboard };
  }

  // Liest die öffentliche View statt results direkt: der Weg vom Ergebnis
  // zum Namen führt über registrations, und die ist per RLS geschützt — für
  // anonyme Besucher wäre der Join leer und die Rangliste damit leer
  // (s. Migration 20260813121000).
  const { data, error } = await supabase
    .from("public_leaderboard")
    .select(
      `
      scope, scope_ref_id, rank, points, percentage, hit_factor,
      shooter_slug, shooter_name, shooter_country, division_name
    `,
    )
    .eq("competition_id", competition.id)
    .order("rank", { ascending: true });

  if (error || !data) {
    console.error("Supabase: Rangliste konnte nicht geladen werden.", error);
    return { divisions: mockDivisions, entries: mockLeaderboard };
  }

  // Divisionsnamen für die Tab-Beschriftung: aus den Ergebniszeilen selbst,
  // damit nur Divisionen erscheinen, für die es tatsächlich Wertungen gibt.
  const divisionNameById = new Map<string, string>();
  for (const row of data) {
    if (row.scope === "division" && row.scope_ref_id && row.division_name) {
      divisionNameById.set(row.scope_ref_id, row.division_name);
    }
  }

  const entries: Record<string, LeaderboardEntry[]> = {};

  for (const row of data) {
    if (!row.shooter_name) continue;

    const key =
      row.scope === "overall"
        ? "Overall"
        : row.scope === "division" && row.scope_ref_id
          ? (divisionNameById.get(row.scope_ref_id) ?? null)
          : null;
    if (!key) continue;

    (entries[key] ??= []).push({
      athleteId: row.shooter_slug ?? "",
      rank: row.rank ?? 0,
      name: abbreviateName(row.shooter_name),
      country: row.shooter_country ?? "",
      division: row.division_name ?? "",
      points: Number(row.points ?? 0),
      percentage: Number(row.percentage ?? 0),
      hitFactor: Number(row.hit_factor ?? 0),
      // Auf-/Abstieg gegenüber dem vorherigen Stand: dafür bräuchte es einen
      // historisierten Rang, den results (ein Cache des aktuellen Standes)
      // bewusst nicht führt. Ehrlich 0 statt einer erfundenen Bewegung —
      // kommt zurück, wenn die Rules Engine Zwischenstände schreibt.
      movement: 0,
    });
  }

  // "Overall" immer zuerst, danach die Divisionen alphabetisch.
  const divisionKeys = Object.keys(entries).filter((k) => k !== "Overall");
  divisionKeys.sort((a, b) => a.localeCompare(b));

  return {
    divisions: [...(entries.Overall ? ["Overall"] : []), ...divisionKeys],
    entries,
  };
}

// ── Athletenprofile ───────────────────────────────────────────────────

// ISO-Code -> ausgeschriebener Name. Die Datenbank speichert bewusst den
// Code (kurz, stabil, sprachneutral); ob "DE" oder "Deutschland" angezeigt
// wird, ist Darstellungssache: die Rangliste zeigt den Code, weil dort jede
// Spalte zählt, das Profil den vollen Namen im Fließtext.
const countryNames: Record<string, string> = {
  DE: "Deutschland",
  AT: "Österreich",
  CH: "Schweiz",
  CZ: "Tschechien",
  FR: "Frankreich",
  PL: "Polen",
};

function countryLabel(code: string | null): string {
  if (!code) return "";
  return countryNames[code] ?? code;
}


export async function getAthleteSlugs(): Promise<string[]> {
  if (!supabase) return Object.keys(mockAthleteProfiles);

  const { data, error } = await supabase
    .from("shooters")
    .select("slug")
    .not("slug", "is", null);

  if (error || !data) {
    console.error("Supabase: Athleten-Slugs nicht ladbar.", error);
    return Object.keys(mockAthleteProfiles);
  }
  return data.map((s) => s.slug).filter((s): s is string => Boolean(s));
}

// Kurzprofil für die Athletenliste — ohne Historie und Analytics, die
// braucht die Übersicht nicht.
export interface AthleteListItem {
  id: string;
  fullName: string;
  country: string;
  primaryDivision: string;
}

// Die "primäre" Division ist die, in der ein Schütze am häufigsten
// gewertet wurde — abgeleitet, nicht gepflegt. Ein eigenes Feld dafür
// müsste bei jeder Registrierung nachgeführt werden und würde still
// veralten.
function primaryDivisionOf(divisionNames: (string | null)[]): string {
  const counts = new Map<string, number>();
  for (const name of divisionNames) {
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  let best = "";
  let bestCount = 0;
  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

export async function getAthletes(): Promise<AthleteListItem[]> {
  if (!supabase) {
    return Object.values(mockAthleteProfiles).map((a) => ({
      id: a.id,
      fullName: a.fullName,
      country: a.country,
      primaryDivision: a.primaryDivision,
    }));
  }

  const [shootersResult, resultsResult] = await Promise.all([
    supabase
      .from("shooters")
      .select("slug, display_name, country")
      .not("slug", "is", null)
      .order("display_name", { ascending: true }),
    supabase.from("public_leaderboard").select("shooter_slug, division_name"),
  ]);

  if (shootersResult.error || !shootersResult.data) {
    console.error("Supabase: Athleten nicht ladbar.", shootersResult.error);
    return Object.values(mockAthleteProfiles).map((a) => ({
      id: a.id,
      fullName: a.fullName,
      country: a.country,
      primaryDivision: a.primaryDivision,
    }));
  }

  const divisionsBySlug = new Map<string, (string | null)[]>();
  for (const row of resultsResult.data ?? []) {
    if (!row.shooter_slug) continue;
    const list = divisionsBySlug.get(row.shooter_slug) ?? [];
    list.push(row.division_name);
    divisionsBySlug.set(row.shooter_slug, list);
  }

  return shootersResult.data.map((s) => ({
    id: s.slug ?? "",
    fullName: s.display_name,
    country: countryLabel(s.country),
    primaryDivision: primaryDivisionOf(divisionsBySlug.get(s.slug ?? "") ?? []),
  }));
}

export async function getAthlete(slug: string): Promise<AthleteProfile | null> {
  if (!supabase) return mockAthleteProfiles[slug] ?? null;

  const { data: shooter, error } = await supabase
    .from("shooters")
    .select(
      `
      slug, display_name, country,
      shooter_stats (
        matches_count, stages_count, podiums_count, wins_count,
        avg_match_pct, avg_stage_pct, avg_hit_factor,
        a_zone_pct, penalty_rate, dnf_rate, insight
      )
    `,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !shooter) {
    if (error) console.error("Supabase: Athlet nicht ladbar.", error);
    return mockAthleteProfiles[slug] ?? null;
  }

  // Historie und primäre Division aus derselben öffentlichen View, die auch
  // die Rangliste speist — nur andersherum gefiltert (s. Migration
  // 20260813121100).
  const { data: history } = await supabase
    .from("public_leaderboard")
    .select(
      `
      competition_name, competition_starts_at, competition_ends_at,
      scope, rank, percentage, division_name
    `,
    )
    .eq("shooter_slug", slug)
    .order("competition_starts_at", { ascending: false });

  const rows = history ?? [];
  // Kein [0] wie bei public_competition_stats: shooter_stats hat shooter_id
  // als Primärschlüssel und ist damit echtes 1:1 — Supabase liefert hier ein
  // Objekt, kein Array. Der generierte Typ hat den Unterschied aufgedeckt.
  const stats = shooter.shooter_stats;

  return {
    id: shooter.slug ?? slug,
    fullName: shooter.display_name,
    country: countryLabel(shooter.country),
    primaryDivision: primaryDivisionOf(rows.map((r) => r.division_name)),
    matches: stats?.matches_count ?? 0,
    stages: stats?.stages_count ?? 0,
    podiums: stats?.podiums_count ?? 0,
    wins: stats?.wins_count ?? 0,
    avgMatchPct: Number(stats?.avg_match_pct ?? 0),
    avgStagePct: Number(stats?.avg_stage_pct ?? 0),
    avgHitFactor: Number(stats?.avg_hit_factor ?? 0),
    aZonePct: Number(stats?.a_zone_pct ?? 0),
    penaltyRate: Number(stats?.penalty_rate ?? 0),
    dnfRate: Number(stats?.dnf_rate ?? 0),
    insight: stats?.insight ?? null,
    history: rows
      // Nur Gesamtwertungen in der Historie — die Divisionswertung desselben
      // Matches wäre sonst eine zweite Zeile für dieselbe Teilnahme.
      .filter((r) => r.scope === "overall")
      .map((r) => ({
        matchName: r.competition_name ?? "",
        date: formatDateRange(r.competition_starts_at, r.competition_ends_at),
        place: r.division_name
          ? `#${r.rank} ${r.division_name}`
          : `#${r.rank} Overall`,
        matchPct: Number(r.percentage ?? 0),
      })),
  };
}
