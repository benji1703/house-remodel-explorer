/** Actual mood-board images used by the renderer, not replacement textures.
 * Crops are normalized, top-left image coordinates; exclude joints, objects,
 * silhouettes and cast shadows. Sample sizes are visual finish scales in cm,
 * not surveyed dimensions. These references are not verified site photographs.
 */
export type MoodSurface = {
  image: string;
  crop: readonly [number, number, number, number];
  sampleCm: readonly [number, number];
  color: string;
  detail: number;
  space: "object" | "world";
  /** Appearance estimates from the photograph, not scanned surface metrology. */
  mineralFinish?: { reliefMm: number; roughness: readonly [number, number]; illuminationLod: number };
};

export const moodSurfaces = {
  clay: {
    image: "/references/moods/mood-terrace-08.jpeg",
    crop: [0.045, 0.43, 0.22, 0.28], sampleCm: [22, 28],
    color: "#c1a17b", detail: 0.8, space: "object",
  },
  oak: {
    image: "/references/moods/mood-kitchen-16.jpeg",
    crop: [0.23, 0.57, 0.11, 0.30], sampleCm: [26, 64],
    color: "#c6a77e", detail: 0.85, space: "object",
  },
  travertine: {
    image: "/references/moods/mood-kitchen-detail.jpeg",
    crop: [0.47, 0.09, 0.23, 0.22], sampleCm: [48, 32],
    color: "#ded0b9", detail: 0.85, space: "object",
  },
  plaster: {
    image: "/references/moods/mood-living-14.jpeg",
    crop: [0.18, 0.08, 0.25, 0.46], sampleCm: [60, 74],
    color: "#dcc39f", detail: 0.95, space: "world",
    mineralFinish: { reliefMm: 1.2, roughness: [0.87, 0.98], illuminationLod: 6 },
  },
  mineral: {
    image: "/references/moods/mood-living-14.jpeg",
    // Foreground floor only: below the timber skirting, away from the window.
    crop: [0.46, 0.86, 0.22, 0.12], sampleCm: [80, 38],
    color: "#ac8d68", detail: 0.9, space: "world",
    mineralFinish: { reliefMm: 0.45, roughness: [0.46, 0.68], illuminationLod: 4.8 },
  },
  linen: {
    image: "/references/moods/mood-living-08.jpeg",
    crop: [0.46, 0.26, 0.13, 0.25], sampleCm: [16, 30],
    color: "#e5ddd0", detail: 0.7, space: "object",
  },
} as const satisfies Record<string, MoodSurface>;

export type MoodSurfaceId = keyof typeof moodSurfaces;
