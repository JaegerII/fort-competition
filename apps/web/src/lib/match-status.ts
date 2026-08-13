import type { MatchStatus } from "./mock-data";

// Eine Quelle für Status-Beschriftung und -Farbton. Dieselbe Zuordnung lag
// vorher dreifach parallel im Code: als statusLabel im Discovery-Filter
// (app/page.tsx), als statusLabel+statusTone im Director-Dashboard
// (app/manage/page.tsx) und als Inline-Bedingungen auf der Match-Detailseite
// (app/matches/[id]/page.tsx). Jede Kopie hätte bei einem neuen Status
// (z. B. "abgesagt") einzeln nachgezogen werden müssen — und die
// MatchCard-Kopie fehlte schlicht, weshalb beendete Matches in der
// Discovery-Übersicht gar nicht als solche erkennbar waren.
export const matchStatusLabel: Record<MatchStatus, string> = {
  live: "Live",
  upcoming: "Bevorstehend",
  completed: "Beendet",
};

export const matchStatusTone: Record<
  MatchStatus,
  "live" | "accent" | "neutral"
> = {
  live: "live",
  upcoming: "accent",
  completed: "neutral",
};
