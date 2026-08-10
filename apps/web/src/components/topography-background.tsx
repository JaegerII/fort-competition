// Topographie-Hintergrund: vom User bereitgestelltes Asset (public/topo-bg.png,
// transparentes PNG mit hellen Konturlinien), fixiert hinter dem gesamten
// App-Inhalt. Ersetzt die zuvor prozedural generierte SVG-Version — dieses
// Bild hat die tatsächliche Liniendichte/-optik des FORT-Timer-Referenzlooks.
export function TopographyBackground() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('${basePath}/topo-bg.png')`,
        opacity: 0.2,
      }}
      aria-hidden="true"
    />
  );
}
