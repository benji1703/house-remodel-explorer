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
    dpr: [0.75, 1], shadowMap: 512, environmentResolution: 32, contactResolution: 256,
    transmission: false, localLights: false,
  },
} satisfies Record<"high" | "light", LightingProfile>;
