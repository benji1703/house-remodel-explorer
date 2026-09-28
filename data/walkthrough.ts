import type { ZoneId } from "./house";

/** Viewer ergonomics and starting viewpoints, not architectural dimensions. */
export const walkSettings = { eyeHeightCm: 165, radiusCm: 18, speedCmPerSecond: 145, fov: 65 };
export const walkStarts: Record<ZoneId, { positionCm: [number, number]; yaw: number }> = {
  "north-extension": { positionCm: [680, 350], yaw: 0.35 },
  "central-core": { positionCm: [660, 880], yaw: 0 },
  "southwest-room": { positionCm: [235, 930], yaw: Math.PI },
  "east-upper-room": { positionCm: [820, 680], yaw: -Math.PI / 2 },
  "east-lower-room": { positionCm: [820, 940], yaw: -Math.PI / 2 },
  "service-core": { positionCm: [580, 1060], yaw: Math.PI },
  ensuite: { positionCm: [415, 1060], yaw: Math.PI },
};
