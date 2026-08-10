import { ReactNode } from "react";

type Tone = "accent" | "live" | "warning" | "neutral";

const toneClasses: Record<Tone, string> = {
  // "accent" bewusst nur als Outline (nicht gefüllt) — der markante gefüllte
  // Rot-Ton ist für "live"/dringend reserviert (FORT-Markenfarbe, ein
  // einziger Akzent statt separater Grün/Rot-Semantik).
  accent: "border border-accent/50 text-accent",
  live: "bg-live-dim text-live",
  warning: "bg-warning-dim text-warning",
  neutral: "bg-surface-raised text-text-muted",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide ${toneClasses[tone]}`}
    >
      {tone === "live" && (
        <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse" />
      )}
      {children}
    </span>
  );
}
