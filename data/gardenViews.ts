/** Reproducible proposed-landscape comparison views. Plan coordinates in cm. */
export const gardenViews = {
  exterior: { positionCm: [-1100, 225, -90], targetCm: [280, 125, 650] },
  arrival: { positionCm: [-650, 165, 880], targetCm: [280, 125, 470] },
} as const;
export type GardenView = "hero" | keyof typeof gardenViews;
