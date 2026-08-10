// Fake-Daten für den Prototyp. Keine echten Personen/Ergebnisse.
// Ersetzt in Phase 7 durch echte Supabase-Queries gegen das Schema
// aus docs/PHASE3_DATABASE_SCHEMA.md.

export type MatchStatus = "live" | "upcoming" | "completed";
export type RegistrationStatus = "open" | "waitlist" | "closed";

export interface MatchSummary {
  id: string;
  name: string;
  city: string;
  country: string;
  discipline: string;
  level: string;
  dateLabel: string;
  status: MatchStatus;
  registrationStatus: RegistrationStatus;
  spotsFilled: number;
  spotsTotal: number;
  currency: string;
  fee: number;
  stagesTotal: number;
  stagesDone: number;
}

export const matches: MatchSummary[] = [
  {
    id: "saarland-open-2027",
    name: "IPSC Saarland Open 2027",
    city: "Saarbrücken",
    country: "Deutschland",
    discipline: "IPSC Handgun",
    level: "Level III",
    dateLabel: "18.–19. April 2027",
    status: "live",
    registrationStatus: "closed",
    spotsFilled: 118,
    spotsTotal: 120,
    currency: "EUR",
    fee: 95,
    stagesTotal: 12,
    stagesDone: 8,
  },
  {
    id: "dudweiler-feierabendmatch-14",
    name: "Dudweiler Feierabendmatch #14",
    city: "Dudweiler",
    country: "Deutschland",
    discipline: "Custom / Club Match",
    level: "Club",
    dateLabel: "12. September 2026",
    status: "upcoming",
    registrationStatus: "open",
    spotsFilled: 42,
    spotsTotal: 60,
    currency: "EUR",
    fee: 20,
    stagesTotal: 6,
    stagesDone: 0,
  },
  {
    id: "rheinland-pfalz-cup-2026",
    name: "Rheinland-Pfalz Cup 2026",
    city: "Mainz",
    country: "Deutschland",
    discipline: "IPSC PCC",
    level: "Level II",
    dateLabel: "5.–6. Juli 2026",
    status: "completed",
    registrationStatus: "closed",
    spotsFilled: 95,
    spotsTotal: 95,
    currency: "EUR",
    fee: 65,
    stagesTotal: 10,
    stagesDone: 10,
  },
];

export interface LeaderboardEntry {
  athleteId: string;
  rank: number;
  name: string;
  country: string;
  division: string;
  points: number;
  percentage: number;
  hitFactor: number;
  movement: number; // + = aufgestiegen, - = abgestiegen, 0 = unverändert
}

export const divisions = ["Overall", "Production Optics", "Standard", "Open"];

export const leaderboard: Record<string, LeaderboardEntry[]> = {
  Overall: [
    { athleteId: "l-hoffmann", rank: 1, name: "L. Hoffmann", country: "DE", division: "Production Optics", points: 642.38, percentage: 100.0, hitFactor: 7.9214, movement: 0 },
    { athleteId: "j-keller", rank: 2, name: "J. Keller", country: "DE", division: "Open", points: 628.11, percentage: 97.78, hitFactor: 7.7103, movement: 1 },
    { athleteId: "m-schneider", rank: 3, name: "M. Schneider", country: "AT", division: "Standard", points: 601.54, percentage: 93.64, hitFactor: 7.3820, movement: -1 },
    { athleteId: "p-richter", rank: 4, name: "P. Richter", country: "CH", division: "Production Optics", points: 588.02, percentage: 91.53, hitFactor: 7.2189, movement: 2 },
    { athleteId: "a-novak", rank: 5, name: "A. Novak", country: "CZ", division: "Open", points: 579.65, percentage: 90.23, hitFactor: 7.1160, movement: 0 },
    { athleteId: "s-weber", rank: 6, name: "S. Weber", country: "DE", division: "Production Optics", points: 561.40, percentage: 87.39, hitFactor: 6.8933, movement: -2 },
    { athleteId: "t-dubois", rank: 7, name: "T. Dubois", country: "FR", division: "Standard", points: 549.87, percentage: 85.60, hitFactor: 6.7515, movement: 0 },
    { athleteId: "k-nowak", rank: 8, name: "K. Nowak", country: "PL", division: "Open", points: 533.10, percentage: 83.00, hitFactor: 6.5457, movement: 1 },
  ],
  "Production Optics": [
    { athleteId: "l-hoffmann", rank: 1, name: "L. Hoffmann", country: "DE", division: "Production Optics", points: 642.38, percentage: 100.0, hitFactor: 7.9214, movement: 0 },
    { athleteId: "p-richter", rank: 2, name: "P. Richter", country: "CH", division: "Production Optics", points: 588.02, percentage: 91.53, hitFactor: 7.2189, movement: 1 },
    { athleteId: "s-weber", rank: 3, name: "S. Weber", country: "DE", division: "Production Optics", points: 561.40, percentage: 87.39, hitFactor: 6.8933, movement: -1 },
  ],
  Standard: [
    { athleteId: "m-schneider", rank: 1, name: "M. Schneider", country: "AT", division: "Standard", points: 601.54, percentage: 100.0, hitFactor: 7.3820, movement: 0 },
    { athleteId: "t-dubois", rank: 2, name: "T. Dubois", country: "FR", division: "Standard", points: 549.87, percentage: 91.41, hitFactor: 6.7515, movement: 0 },
  ],
  Open: [
    { athleteId: "j-keller", rank: 1, name: "J. Keller", country: "DE", division: "Open", points: 628.11, percentage: 100.0, hitFactor: 7.7103, movement: 0 },
    { athleteId: "a-novak", rank: 2, name: "A. Novak", country: "CZ", division: "Open", points: 579.65, percentage: 92.29, hitFactor: 7.1160, movement: 1 },
    { athleteId: "k-nowak", rank: 3, name: "K. Nowak", country: "PL", division: "Open", points: 533.10, percentage: 84.87, hitFactor: 6.5457, movement: -1 },
  ],
};

export interface AthleteHistoryEntry {
  matchName: string;
  date: string;
  place: string;
  matchPct: number;
}

export interface AthleteProfile {
  id: string;
  fullName: string;
  country: string;
  primaryDivision: string;
  matches: number;
  stages: number;
  podiums: number;
  wins: number;
  avgMatchPct: number;
  avgStagePct: number;
  avgHitFactor: number;
  aZonePct: number;
  penaltyRate: number;
  dnfRate: number;
  insight: string | null;
  history: AthleteHistoryEntry[];
}

// Ein vollständig ausgearbeitetes Profil (Lena Hoffmann, die wiederkehrende
// Beispiel-Athletin aus RO-Scoring/Leaderboard) plus schlanker generierte
// Profile für den Rest der Rangliste — genug, damit jeder Leaderboard-Link
// auf eine echte Seite führt, ohne 8× denselben Detailgrad von Hand zu
// pflegen. "insight" ist nur bei Lena gesetzt: Spec §13 verlangt, dass jeder
// Insight aus echten Wettkampfdaten abgeleitet ist, nicht erfunden — für die
// Nebenrollen ohne ausgearbeitete Historie lassen wir ihn bewusst weg statt
// einen Fake-Text zu zeigen.
export const athleteProfiles: Record<string, AthleteProfile> = {
  "l-hoffmann": {
    id: "l-hoffmann",
    fullName: "Lena Hoffmann",
    country: "Deutschland",
    primaryDivision: "Production Optics",
    matches: 34,
    stages: 287,
    podiums: 6,
    wins: 2,
    avgMatchPct: 91.4,
    avgStagePct: 88.9,
    avgHitFactor: 7.42,
    aZonePct: 82.3,
    penaltyRate: 3.1,
    dnfRate: 0,
    insight:
      "Deine Stage-Prozente auf kurzen, transitionslastigen Stages liegen im Schnitt 6.2 Prozentpunkte unter deinem Match-Durchschnitt.",
    history: [
      { matchName: "IPSC Saarland Open 2027", date: "18.–19. April 2027", place: "#1 Production Optics", matchPct: 100.0 },
      { matchName: "Rheinland-Pfalz Cup 2026", date: "5.–6. Juli 2026", place: "#2 Overall", matchPct: 96.4 },
      { matchName: "Dudweiler Feierabendmatch #12", date: "14. März 2026", place: "#1 Overall", matchPct: 100.0 },
      { matchName: "IPSC Saarland Open 2026", date: "12.–13. April 2026", place: "#4 Production Optics", matchPct: 89.1 },
      { matchName: "Winter Classic 2025", date: "8. Dezember 2025", place: "#3 Overall", matchPct: 92.7 },
    ],
  },
};

const secondaryAthletes: { id: string; fullName: string; entry: LeaderboardEntry }[] = [
  { id: "j-keller", fullName: "Jonas Keller", entry: leaderboard.Overall[1] },
  { id: "m-schneider", fullName: "Mia Schneider", entry: leaderboard.Overall[2] },
  { id: "p-richter", fullName: "Paul Richter", entry: leaderboard.Overall[3] },
  { id: "a-novak", fullName: "Anna Novak", entry: leaderboard.Overall[4] },
  { id: "s-weber", fullName: "Sven Weber", entry: leaderboard.Overall[5] },
  { id: "t-dubois", fullName: "Tomas Dubois", entry: leaderboard.Overall[6] },
  { id: "k-nowak", fullName: "Karol Nowak", entry: leaderboard.Overall[7] },
];

const countryNames: Record<string, string> = {
  DE: "Deutschland",
  AT: "Österreich",
  CH: "Schweiz",
  CZ: "Tschechien",
  FR: "Frankreich",
  PL: "Polen",
};

for (const a of secondaryAthletes) {
  athleteProfiles[a.id] = {
    id: a.id,
    fullName: a.fullName,
    country: countryNames[a.entry.country] ?? a.entry.country,
    primaryDivision: a.entry.division,
    matches: 12 + Math.round(a.entry.percentage / 5),
    stages: (12 + Math.round(a.entry.percentage / 5)) * 8,
    podiums: Math.max(0, Math.round((100 - a.entry.rank * 8) / 20)),
    wins: a.entry.rank === 1 ? 1 : 0,
    avgMatchPct: Math.round((a.entry.percentage - 4) * 10) / 10,
    avgStagePct: Math.round((a.entry.percentage - 6.5) * 10) / 10,
    avgHitFactor: Math.round((a.entry.hitFactor - 0.3) * 100) / 100,
    aZonePct: Math.round((a.entry.percentage - 12) * 10) / 10,
    penaltyRate: Math.round((5 + a.entry.rank * 0.4) * 10) / 10,
    dnfRate: 0,
    insight: null,
    history: [
      {
        matchName: "IPSC Saarland Open 2027",
        date: "18.–19. April 2027",
        place: `#${a.entry.rank} ${a.entry.division}`,
        matchPct: a.entry.percentage,
      },
    ],
  };
}

export interface ScoringTarget {
  id: string;
  label: string;
  requiredHits: number;
}

export interface ScoringShooter {
  id: string;
  name: string;
  division: string;
}

export interface ScoringSquad {
  id: string;
  name: string;
  timeSlot: string;
  shooters: ScoringShooter[];
}

export const scoringStage = {
  id: "stage-04",
  number: 4,
  name: "Stage 04 — Speed Chaos",
  targets: [
    { id: "t1", label: "T1", requiredHits: 2 },
    { id: "t2", label: "T2", requiredHits: 2 },
    { id: "t3", label: "T3", requiredHits: 2 },
  ] as ScoringTarget[],
};

export interface RegistrationSquad {
  id: string;
  name: string;
  timeSlot: string;
  capacity: number;
  filled: number;
}

// Squads zur Auswahl im Registrierungs-Flow — pro Match, unabhängig von den
// scoringSquads oben (die sind für die RO-Scoring-Demo an Stage 04 gebunden).
// Squad 1 ist bewusst voll, um den "Squad voll → Warteliste"-Fall aus den
// Phase-2-Flows zu demonstrieren.
export const registrationSquads: Record<string, RegistrationSquad[]> = {
  "dudweiler-feierabendmatch-14": [
    { id: "reg-sq-1", name: "Squad 1", timeSlot: "12.09. 17:00", capacity: 10, filled: 10 },
    { id: "reg-sq-2", name: "Squad 2", timeSlot: "12.09. 18:00", capacity: 10, filled: 6 },
    { id: "reg-sq-3", name: "Squad 3", timeSlot: "12.09. 19:00", capacity: 10, filled: 3 },
  ],
};

export const scoringSquads: ScoringSquad[] = [
  {
    id: "squad-3",
    name: "Squad 3",
    timeSlot: "Sonntag 09:00",
    shooters: [
      { id: "s1", name: "Lena Hoffmann", division: "Production Optics" },
      { id: "s2", name: "Jonas Keller", division: "Open" },
      { id: "s3", name: "Mia Schneider", division: "Standard" },
      { id: "s4", name: "Paul Richter", division: "Production Optics" },
    ],
  },
  {
    id: "squad-4",
    name: "Squad 4",
    timeSlot: "Sonntag 10:30",
    shooters: [
      { id: "s5", name: "Anna Novak", division: "Open" },
      { id: "s6", name: "Sven Weber", division: "Production Optics" },
    ],
  },
];
