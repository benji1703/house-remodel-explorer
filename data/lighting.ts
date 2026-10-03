import { house } from "./house";
import { exteriorOpenings } from "./structuralWalls";

export type LightingProfile = {
  dpr: [number, number];
  shadowMap: number;
  environmentResolution: number;
  contactResolution: number;
  idlePixelBudget: number;
  movingDpr: number;
  transmission: boolean;
  localLights: boolean;
  maxLocalShadows: number;
};

/** Rendering budgets are architectural presentation policy, separate from JSX. */
export const lightingProfiles = {
  high: {
    dpr: [1, 1.8], shadowMap: 2048, environmentResolution: 128, contactResolution: 512,
    idlePixelBudget: 3_200_000, movingDpr: 1.05,
    transmission: false, localLights: true, maxLocalShadows: 3,
  },
  light: {
    // Balanced rendering keeps its textures modest but still uses filtered,
    // adequately sized shadow maps to avoid visibly pixelated silhouettes.
    dpr: [0.75, 1.15], shadowMap: 1024, environmentResolution: 16, contactResolution: 192,
    idlePixelBudget: 1_350_000, movingDpr: 0.85,
    transmission: false, localLights: false, maxLocalShadows: 3,
  },
} satisfies Record<"high" | "light", LightingProfile>;

/** Full material/geometry detail on iPhone, with a mobile-safe shadow and
 * framebuffer budget. Desktop high remains the very-high presentation tier. */
export const mobileHighLightingProfile: LightingProfile = {
  dpr: [0.75, 1.5], shadowMap: 1024, environmentResolution: 32, contactResolution: 384,
  idlePixelBudget: 1_250_000, movingDpr: 0.9,
  transmission: false, localLights: true, maxLocalShadows: 2,
};

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
  environment: 0.34,
  environmentColor: "#f5f6fa",
  skyColor: "#edf2fb",
  groundColor: "#cbbda7",
  hemisphere: 0.25,
  ambient: 0.025,
  directionalFill: 0.065,
  eveningHemisphere: 0.42,
  eveningAmbient: 0.18,
  contactOpacity: 0.34,
  windowIntensity: 3.2,
  windowColor: "#f3f6ff",
  roomContactSpanCm: 650,
  roomContactFarCm: 110,
} as const;

/** Diffuse sky bounce at the existing glazing, not additional fixtures or
 * architectural openings. Store derived positions in cm until rendering. */
export const interiorWindowLights = house.footprint.flatMap((a, edge) => {
  const b = house.footprint[(edge + 1) % house.footprint.length];
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const length = Math.hypot(dx, dz);
  const inward = [-dz / length, dx / length] as const;
  return (exteriorOpenings[edge] ?? []).filter(opening => opening.sill > 0 || opening.fixed).map((opening, index) => {
    const x = a[0] + dx / length * opening.at;
    const z = a[1] + dz / length * opening.at;
    const zone = house.zones.find(room => x + inward[0] * 0.15 >= room.x && x + inward[0] * 0.15 <= room.x + room.width && z + inward[1] * 0.15 >= room.z && z + inward[1] * 0.15 <= room.z + room.depth);
    return {
      id: `window-bounce-${edge}-${index}`,
      zone: zone?.id,
      positionCm: [(x + inward[0] * 0.025) * 100, (opening.sill + opening.head) * 50, (z + inward[1] * 0.025) * 100] as const,
      widthCm: opening.width * 100,
      heightCm: (opening.head - opening.sill) * 100,
      rotation: Math.atan2(-inward[0], -inward[1]),
    };
  });
});
