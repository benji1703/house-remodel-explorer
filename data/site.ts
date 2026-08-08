/**
 * Public brand + share surface for Sage Court.
 * Quiet luxury remodel of a measured single-storey house —
 * lime-wash, oak, microcement, Belgian sage frames.
 */
export const site = {
  name: "Sage Court",
  shortName: "Sage Court",
  wordmark: { primary: "Sage", secondary: "Court" },
  tagline: "A quiet single-storey remodel",
  description:
    "A measured single-storey remodel — plan, model, and room finishes in one quiet place.",
  /** ~150 chars — WhatsApp / iMessage preview. */
  shareDescription:
    "A quiet single-storey remodel. Plan, model, and finishes — lime-wash, oak, sage Belgian frames.",
  ogAlt:
    "Living opening to a timber terrace at dusk — lime-wash plaster, microcement, sage frames.",
  locale: "en_IL",
  keywords: [
    "house remodel",
    "Belgian frames",
    "lime-wash",
    "microcement",
    "single-storey",
    "Israel",
  ],
  ogImage: {
    path: "/og.jpg",
    width: 1200,
    height: 630,
  },
} as const;

/** Production homepage (GitHub → Vercel). Override with NEXT_PUBLIC_SITE_URL. */
export const DEFAULT_SITE_URL = "https://house-remodel-murex.vercel.app";

export const siteUrl = () => {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return DEFAULT_SITE_URL;
};
