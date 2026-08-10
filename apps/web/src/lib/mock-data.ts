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
    { rank: 1, name: "L. Hoffmann", country: "DE", division: "Production Optics", points: 642.38, percentage: 100.0, hitFactor: 7.9214, movement: 0 },
    { rank: 2, name: "J. Keller", country: "DE", division: "Open", points: 628.11, percentage: 97.78, hitFactor: 7.7103, movement: 1 },
    { rank: 3, name: "M. Schneider", country: "AT", division: "Standard", points: 601.54, percentage: 93.64, hitFactor: 7.3820, movement: -1 },
    { rank: 4, name: "P. Richter", country: "CH", division: "Production Optics", points: 588.02, percentage: 91.53, hitFactor: 7.2189, movement: 2 },
    { rank: 5, name: "A. Novak", country: "CZ", division: "Open", points: 579.65, percentage: 90.23, hitFactor: 7.1160, movement: 0 },
    { rank: 6, name: "S. Weber", country: "DE", division: "Production Optics", points: 561.40, percentage: 87.39, hitFactor: 6.8933, movement: -2 },
    { rank: 7, name: "T. Dubois", country: "FR", division: "Standard", points: 549.87, percentage: 85.60, hitFactor: 6.7515, movement: 0 },
    { rank: 8, name: "K. Nowak", country: "PL", division: "Open", points: 533.10, percentage: 83.00, hitFactor: 6.5457, movement: 1 },
  ],
  "Production Optics": [
    { rank: 1, name: "L. Hoffmann", country: "DE", division: "Production Optics", points: 642.38, percentage: 100.0, hitFactor: 7.9214, movement: 0 },
    { rank: 2, name: "P. Richter", country: "CH", division: "Production Optics", points: 588.02, percentage: 91.53, hitFactor: 7.2189, movement: 1 },
    { rank: 3, name: "S. Weber", country: "DE", division: "Production Optics", points: 561.40, percentage: 87.39, hitFactor: 6.8933, movement: -1 },
  ],
  Standard: [
    { rank: 1, name: "M. Schneider", country: "AT", division: "Standard", points: 601.54, percentage: 100.0, hitFactor: 7.3820, movement: 0 },
    { rank: 2, name: "T. Dubois", country: "FR", division: "Standard", points: 549.87, percentage: 91.41, hitFactor: 6.7515, movement: 0 },
  ],
  Open: [
    { rank: 1, name: "J. Keller", country: "DE", division: "Open", points: 628.11, percentage: 100.0, hitFactor: 7.7103, movement: 0 },
    { rank: 2, name: "A. Novak", country: "CZ", division: "Open", points: 579.65, percentage: 92.29, hitFactor: 7.1160, movement: 1 },
    { rank: 3, name: "K. Nowak", country: "PL", division: "Open", points: 533.10, percentage: 84.87, hitFactor: 6.5457, movement: -1 },
  ],
};

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
