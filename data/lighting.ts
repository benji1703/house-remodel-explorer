export type LightingProfile = {
  dpr: [number, number];
  shadowMap: number;
  environmentResolution: number;
  contactResolution: number;
  idlePixelBudget: number;
  movingDpr: number;
  transmission: boolean;
  localLights: boolean;
};

/** Rendering budgets are architectural presentation policy, separate from JSX. */
export const lightingProfiles = {
  high: {
    dpr: [1, 2], shadowMap: 2048, environmentResolution: 128, contactResolution: 512,
    idlePixelBudget: 4_000_000, movingDpr: 1.25,
    transmission: false, localLights: true,
  },
  light: {
    // Mobile uses fewer effects and a capped framebuffer. RenderBudget restores
    // up to 1.5x after interaction for readable edges on Retina displays.
    dpr: [1, 1.5], shadowMap: 512, environmentResolution: 16, contactResolution: 192,
    idlePixelBudget: 1_600_000, movingDpr: 1,
    transmission: false, localLights: false,
  },
} satisfies Record<"high" | "light", LightingProfile>;

/** Proposed practical fixtures, in plan centimetres. Shared by the runtime
 * lights and the orthographic lighting plan markers. */
export const houseLightingFixtures = [
  { id: "kitchen-pendant-west", room: "Kitchen", zone: "north-extension", kind: "pendant", positionCm: [495, 242], heightCm: 179.5, intensity: 15, rangeCm: 390, color: "#ffe0b5", normal: [0, 0] },
  { id: "kitchen-pendant-east", room: "Kitchen", zone: "north-extension", kind: "pendant", positionCm: [575, 242], heightCm: 179.5, intensity: 15, rangeCm: 390, color: "#ffe0b5", normal: [0, 0] },
  { id: "living-pendant", room: "Living", zone: "central-core", kind: "pendant", positionCm: [540, 610], heightCm: 179.5, intensity: 18, rangeCm: 420, color: "#ffe0b5", normal: [0, 0] },
  { id: "master-pendant", room: "Master", zone: "southwest-room", kind: "pendant", positionCm: [170, 1095], heightCm: 179.5, intensity: 14, rangeCm: 340, color: "#ffe0b5", normal: [0, 0] },
  { id: "bathroom-vanity", room: "Bathroom", zone: "service-core", kind: "wall", positionCm: [496, 1142], heightCm: 195, intensity: 9, rangeCm: 230, color: "#ffe0b5", normal: [1, 0] },
  { id: "ensuite-vanity", room: "Ensuite", zone: "ensuite", kind: "wall", positionCm: [373, 1028], heightCm: 200, intensity: 8, rangeCm: 210, color: "#ffe0b5", normal: [0, 1] },
] as const;
export type HouseLightingFixture = (typeof houseLightingFixtures)[number];

/** Proposed garden presentation: neutral sky bounce with a warm directional key.
 * This does not change the architectural room lighting or the modeled sun path.
 */
export const gardenLighting = {
  environmentIntensity: 0.55,
  directMultiplier: 1.07,
  hemisphereBase: 0.10,
  hemisphereDaylight: 0.58,
  ambientBase: 0.025,
  ambientDaylight: 0.04,
  fillBase: 0.045,
  fillDaylight: 0.14,
  gravelDatumCm: -3.5,
  contactElevationCm: -3.3, // 2 mm above the proposed gravel datum
  contactSpanCm: 2800,
  contactFarCm: 135,
  contactOpacity: 0.30,
  highContactResolution: 768,
  lightContactResolution: 256,
} as const;

/** Curated presentation light, not a change to surveyed orientation or fixtures. */
export const lightingScenes = [
  { id: "daylight", label: "Soft daylight", hour: 13.5 },
  { id: "golden", label: "Golden hour", hour: 17.25 },
  { id: "evening", label: "Evening glow", hour: 21 },
] as const;

/** Broad indirect illumination keeps pale mineral finishes clean under a ceiling.
 * Shared across quality profiles; no additional shadow maps or fixture meshes. */
export const interiorLighting = {
  environment: 0.44,
  environmentColor: "#fff8ee",
  skyColor: "#fff8ed",
  groundColor: "#eadbc5",
  hemisphere: 0.32,
  ambient: 0.045,
  directionalFill: 0.10,
  eveningHemisphere: 0.42,
  eveningAmbient: 0.18,
  contactOpacity: 0.28,
} as const;
