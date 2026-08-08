/**
 * Public brand + share surface for Sage Court.
 * Single-storey remodel — lime-wash, oak, microcement, Belgian sage frames.
 */
export const site = {
  name: "Sage Court",
  shortName: "Sage Court",
  wordmark: { primary: "Sage Court", secondary: "" },
  tagline: "Measured single-storey remodel",
  description:
    "Plan, model, and room finishes for a single-storey remodel — lime-wash, oak, microcement, Belgian sage frames.",
  /** ~150 chars — WhatsApp / iMessage preview. */
  shareDescription:
    "Single-storey remodel in Israel. Measured plan, 3D model, finishes — lime-wash, oak, sage Belgian frames.",
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
