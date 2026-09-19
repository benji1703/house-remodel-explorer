export type LightingProfile = {
  dpr: [number, number];
  shadowMap: number;
  environmentResolution: number;
  contactResolution: number;
  transmission: boolean;
  localLights: boolean;
};

/** Rendering budgets are architectural presentation policy, separate from JSX. */
export const lightingProfiles = {
  high: {
    dpr: [1, 1.5], shadowMap: 2048, environmentResolution: 128, contactResolution: 512,
    transmission: false, localLights: true,
  },
  light: {
    // Keep the mobile canvas at one device pixel per CSS pixel. A sub-1 DPR
    // made iPhone text and furniture visibly soft without buying enough frame
    // time once the expensive effects were already disabled.
    dpr: [1, 1], shadowMap: 512, environmentResolution: 16, contactResolution: 192,
    transmission: false, localLights: false,
  },
} satisfies Record<"high" | "light", LightingProfile>;

/** Proposed practical fixtures, in plan centimetres. Shared by the runtime
 * lights and the orthographic lighting plan markers. */
export const houseLightingFixtures = [
  { id: "kitchen-pendant-west", room: "Kitchen", positionCm: [495, 242] as const, color: "#ffd09a" },
  { id: "kitchen-pendant-east", room: "Kitchen", positionCm: [575, 242] as const, color: "#ffd09a" },
  { id: "living-pendant", room: "Living", positionCm: [540, 610] as const, color: "#ffd09a" },
  { id: "master-pendant", room: "Master", positionCm: [170, 1095] as const, color: "#ffc27f" },
  { id: "bathroom-vanity", room: "Bathroom", positionCm: [525, 1142] as const, color: "#ffe0b5" },
  { id: "ensuite-vanity", room: "Ensuite", positionCm: [373, 1045] as const, color: "#ffe0b5" },
] as const;

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
