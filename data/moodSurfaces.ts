/** Renderer texture and style-reference metadata.
 * Crops are normalized, top-left image coordinates; exclude joints, objects,
 * silhouettes and cast shadows. Sample sizes are visual finish scales in cm,
 * not surveyed dimensions. These references are not verified site photographs.
 */
export type MoodSurface = {
  /** Source albedo texture; authored swatches can be separate from references. */
  image: string;
  referenceImage?: string;
  crop: readonly [number, number, number, number];
  sampleCm: readonly [number, number];
  color: string;
  detail: number;
  space: "object" | "world";
  /** Generated, evenly lit material swatch rather than a mood-board photograph. */
  albedo?: boolean;
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
    image: "/textures/door-oak-albedo.jpg",
    referenceImage: "/references/moods/mood-kitchen-16.jpeg",
    crop: [0, 0, 1, 1], sampleCm: [72, 118],
    color: "#fffaf2", detail: 0.94, space: "world", albedo: true,
  },
  travertine: {
    image: "/references/moods/mood-kitchen-detail.jpeg",
    crop: [0.47, 0.09, 0.23, 0.22], sampleCm: [48, 32],
    color: "#ded0b9", detail: 0.85, space: "object",
  },
  plaster: {
    image: "/textures/lime-plaster-albedo.jpg",
    referenceImage: "/references/moods/mood-living-14.jpeg",
    crop: [0, 0, 1, 1], sampleCm: [225, 225],
    color: "#fffaf3", detail: 0.9, space: "world", albedo: true,
    mineralFinish: { reliefMm: 0.35, roughness: [0.91, 0.985], illuminationLod: 6 },
  },
  mineral: {
    image: "/references/moods/mood-living-14.jpeg",
    // Foreground floor only: below the timber skirting, away from the window.
    crop: [0.46, 0.86, 0.22, 0.12], sampleCm: [80, 38],
    color: "#ac8d68", detail: 0.9, space: "world",
    mineralFinish: { reliefMm: 0.45, roughness: [0.46, 0.68], illuminationLod: 4.8 },
  },
  linen: {
    image: "/textures/linen-washed-albedo.jpg",
    referenceImage: "/references/moods/mood-living-08.jpeg",
    crop: [0, 0, 1, 1], sampleCm: [38, 38],
    color: "#fffdf9", detail: 0.96, space: "object", albedo: true,
  },
  woven: {
    image: "/textures/chair-rush-albedo.jpg",
    referenceImage: "/references/moods/mood-kitchen-06.jpeg",
    crop: [0, 0, 1, 1], sampleCm: [42, 42],
    color: "#fffaf0", detail: 0.95, space: "object", albedo: true,
  },
} as const satisfies Record<string, MoodSurface>;

export type MoodSurfaceId = keyof typeof moodSurfaces;
