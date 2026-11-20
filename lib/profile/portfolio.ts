export type PortfolioLinkKind = "github" | "figma" | "behance" | "other";

/** Which cover a portfolio item without an image gets, from its link's domain (PRD F-PRF-04). */
export function portfolioLinkKind(url: string): PortfolioLinkKind {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "other";
  }
  const is = (domain: string) => host === domain || host.endsWith(`.${domain}`);
  if (is("github.com") || is("github.io")) return "github";
  if (is("figma.com")) return "figma";
  if (is("behance.net")) return "behance";
  return "other";
}

export const PORTFOLIO_LINK_LABELS: Record<PortfolioLinkKind, string> = {
  github: "GitHub",
  figma: "Figma",
  behance: "Behance",
  other: "Tautan",
};
