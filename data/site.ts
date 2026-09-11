/**
 * Public brand + share surface for Villa Nehama.
 * Single-storey remodel — lime-wash, oak, microcement, Belgian bronze frames.
 */
export const site = {
  name: "Villa Nehama",
  shortName: "Villa Nehama",
  wordmark: { primary: "Villa Nehama", secondary: "11.4 × 12.1 m · Israel" },
  tagline: "North light in the kitchen, west terrace at dusk",
  description:
    "Villa Nehama — single-storey remodel in Israel. Measured plan, model, and finishes: lime-wash, oak, microcement, Belgian bronze frames.",
  /** ~150 chars — WhatsApp / iMessage preview. */
  shareDescription:
    "Villa Nehama, Israel. Measured plan and 3D model — lime-wash, oak, bronze Belgian frames, west terrace.",
  ogAlt:
    "Living opening to a timber terrace at dusk — lime-wash plaster, microcement, bronze frames.",
  locale: "en_IL",
  keywords: [
    "Villa Nehama",
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
