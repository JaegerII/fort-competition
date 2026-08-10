// Inline statt <img>, damit `currentColor` tatsächlich die Textfarbe des
// Elternelements übernimmt (bei <img src="*.svg"> würde currentColor sonst
// im isolierten Dokumentkontext der SVG-Datei aufgelöst, nicht im Host-DOM).
export function FortLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 3508 4961"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M1753.937,375.183l1463.813,2882.054l0,553.689l-866.542,774.52l-412.414,0l-184.857,-2888.01l-184.857,2888.01l-412.414,0l-866.542,-774.52l0,-553.689l1463.813,-2882.054Z" />
    </svg>
  );
}
