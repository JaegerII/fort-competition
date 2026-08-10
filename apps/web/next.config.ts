import path from "path";
import type { NextConfig } from "next";

// GITHUB_PAGES wird nur im Deploy-Workflow gesetzt (.github/workflows/
// deploy-pages.yml), damit `next dev`/lokale Builds ohne Subpfad laufen —
// GitHub Pages liefert ein Projekt-Repo unter /<repo-name>/, nicht unter /.
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoName = "fort-competition";

const nextConfig: NextConfig = {
  output: "export",
  // GitHub Pages löst /pfad/ als /pfad/index.html auf, nicht als /pfad.html —
  // ohne trailingSlash erzeugt Next flache .html-Dateien, die bei einem
  // Trailing-Slash-Request (der Normalfall bei Link-Klicks) zu 404 führen.
  trailingSlash: true,
  images: { unoptimized: true }, // next/image-Optimierungsserver gibt es bei statischem Export nicht
  basePath: isGithubPages ? `/${repoName}` : undefined,
  assetPrefix: isGithubPages ? `/${repoName}/` : undefined,
  // basePath wird von Next nur bei <Link>/<Image> automatisch berücksichtigt,
  // nicht bei rohen url()-Strings in CSS/style — daher hier explizit für
  // Komponenten wie TopographyBackground, die public/-Assets per Hand referenzieren.
  env: {
    NEXT_PUBLIC_BASE_PATH: isGithubPages ? `/${repoName}` : "",
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
