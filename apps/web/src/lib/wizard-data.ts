export const availableDivisions = [
  "Production Optics",
  "Production",
  "Standard",
  "Open",
  "Classic",
  "PCC Optics",
];

export const availableCategories = [
  "Lady",
  "Junior",
  "Senior",
  "Super Senior",
  "Law Enforcement",
];

export const availableOfficialRoles = [
  "Match Director",
  "Range Master",
  "Chief RO",
  "Range Officer",
  "Scorekeeper",
  "Stats Officer",
];

export const staffPool = [
  "Tobias Hartmann",
  "Nina Brandt",
  "Felix Krüger",
  "Sophie Lang",
  "David Reiter",
  "Carla Voss",
];

export interface WizardStage {
  id: string;
  number: number;
  name: string;
  targets: number;
}

export interface WizardOfficial {
  id: string;
  name: string;
  role: string;
}

export interface WizardState {
  ruleset: "ipsc-handgun" | "custom" | null;
  info: {
    name: string;
    range: string;
    level: string;
    dateFrom: string;
    dateTo: string;
  };
  divisions: string[];
  categories: string[];
  stages: WizardStage[];
  registration: {
    fee: string;
    currency: string;
    opensAt: string;
    closesAt: string;
    capacity: string;
  };
  squads: {
    count: string;
    capacityPerSquad: string;
  };
  officials: WizardOfficial[];
}

export const initialWizardState: WizardState = {
  ruleset: null,
  info: { name: "", range: "", level: "Club", dateFrom: "", dateTo: "" },
  divisions: [],
  categories: [],
  stages: [],
  registration: {
    fee: "",
    currency: "EUR",
    opensAt: "",
    closesAt: "",
    capacity: "",
  },
  squads: { count: "", capacityPerSquad: "" },
  officials: [],
};

export const wizardSteps = [
  { id: "ruleset", label: "Ruleset" },
  { id: "info", label: "Match-Info" },
  { id: "divisions", label: "Divisionen" },
  { id: "categories", label: "Kategorien" },
  { id: "stages", label: "Stages" },
  { id: "registration", label: "Registrierung" },
  { id: "squads", label: "Squads" },
  { id: "officials", label: "Officials" },
  { id: "review", label: "Review & Publish" },
] as const;

export type WizardStepId = (typeof wizardSteps)[number]["id"];
