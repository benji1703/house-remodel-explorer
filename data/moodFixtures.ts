/** Visual fit-out dimensions, cm. Mood images define appearance, never walls. */
export const moodFixtures = {
  toilet: {
    reference: "/references/moods/mood-ensuite-06.jpeg",
    widthCm: 36, projectionCm: 54, heightCm: 47.8,
    mainBathroom: { wallXCm: 495.5, zCm: 1105 },
    asset: "/models/mood/toilet-wall-hung.glb",
  },
  olivePot: {
    reference: "/references/moods/mood-terrace-08.jpeg",
    diameterCm: 46, potHeightCm: 48, overallHeightCm: 146,
    asset: "/models/mood/olive-pot.glb",
  },
  jasmine: {
    reference: "/references/moods/mood-terrace-05.jpeg",
    assetSpecies: "trachelospermum-jasminoides",
  },
} as const;
