/** Camera locations are presentation choices, in plan centimetres. */
export const kitchenViews = [
  { id: "entrance", label: "Side view", position: [240, 225, 415], target: [550, 110, 145] },
  { id: "island", label: "Island", position: [745, 195, 415], target: [555, 115, 125] },
  { id: "worktop", label: "Worktop", position: [565, 155, 230], target: [595, 100, 55] },
  { id: "reverse", label: "Toward living", position: [425, 165, 115], target: [555, 110, 365] },
] as const;
export type KitchenView = (typeof kitchenViews)[number]["id"];
export type FloorFinish = "oak" | "sand-microtopping";

/** Existing remodel joinery, not survey dimensions or construction approval. */
export const kitchenPresentation = {
  pendantHeightCm: 205,
  counterHeightCm: 90,
  counterThicknessCm: 4.5,
  counterBoundsCm: [470.5, 749, 10.5, 91.5],
  sinkCutoutCm: [500, 560, 37, 73],
  hobCutoutCm: [645, 705, 27.5, 82.5],
} as const;
