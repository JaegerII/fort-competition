import path from "path";
import type { NextConfig } from "next";

// GITHUB_PAGES wird nur im Deploy-Workflow gesetzt (.github/workflows/
// deploy-pages.yml), damit `next dev`/lokale Builds ohne Subpfad laufen —
// GitHub Pages liefert ein Projekt-Repo unter /<repo-name>/, nicht unter /.
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoName = "fort-competition";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true }, // next/image-Optimierungsserver gibt es bei statischem Export nicht
  basePath: isGithubPages ? `/${repoName}` : undefined,
  assetPrefix: isGithubPages ? `/${repoName}/` : undefined,
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
