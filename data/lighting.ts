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
