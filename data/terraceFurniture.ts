/** Terrace furniture proposals, authored in centimetres and converted at the scene boundary. */
export const terraceFurnitureSpec = {
  table: { widthCm: 160, depthCm: 85, heightCm: 75, topCm: 8, pedestalWidthCm: 54 },
  chair: { widthCm: 45, depthCm: 50, seatHeightCm: 45, backHeightCm: 40, cushionCm: 7 },
  joinery: { timberPostCm: 7, stretcherCm: 5, edgeRadiusCm: 2.5 },
} as const;

export type TerraceFurnitureSpec = typeof terraceFurnitureSpec;
