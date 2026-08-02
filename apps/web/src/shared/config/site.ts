export const SITE = {
  name: "Leafitome",
  tagline: "Suivie de tache",
  version: "1.1.0",
  githubUrl: "https://github.com/prumme",
  githubLabel: "GitHub",
  copyrightStartYear: 2026,
} as const;

export function getCopyrightRange(now = new Date()): string {
  const currentYear = now.getFullYear();
  if (currentYear <= SITE.copyrightStartYear) {
    return String(SITE.copyrightStartYear);
  }
  return `${SITE.copyrightStartYear}–${currentYear}`;
}
