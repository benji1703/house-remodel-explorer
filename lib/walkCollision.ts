import { house } from "../data/house";
import { exteriorOpenings, partitions, EXT_THICKNESS, INT_THICKNESS } from "../data/structuralWalls";
import { walkSettings } from "../data/walkthrough";

const radius = walkSettings.radiusCm / 100;
const walls = [
  ...house.footprint.map((a, i) => ({ a, b: house.footprint[(i + 1) % house.footprint.length], openings: exteriorOpenings[i] ?? [], thickness: EXT_THICKNESS, prefix: `ext-${i}` })),
  ...partitions.map((wall, i) => ({ ...wall, thickness: INT_THICKNESS, prefix: `int-${i}` })),
];

/** Plan coordinates in metres, using the same runs/openings as the renderer. */
export function canWalkAt(x: number, z: number, allDoorsOpen: boolean, doorStates: Record<string, boolean>) {
  // Indoor walkthrough: the measured floor polygon is the navigation boundary.
  let inside = false;
  const points = house.footprint;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, zi] = points[i], [xj, zj] = points[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
  }
  if (!inside) return false;
  for (const wall of walls) {
    const dx = wall.b[0] - wall.a[0], dz = wall.b[1] - wall.a[1];
    const length = Math.hypot(dx, dz);
    const along = ((x - wall.a[0]) * dx + (z - wall.a[1]) * dz) / length;
    const across = Math.abs((x - wall.a[0]) * dz - (z - wall.a[1]) * dx) / length;
    const clearance = radius + wall.thickness / 2;
    if (along < -clearance || along > length + clearance || across >= clearance) continue;
    const passage = wall.openings.some((opening, index) =>
      opening.sill === 0 && !opening.fixed &&
      (opening.style === "sliding" || (doorStates[`${wall.prefix}-${index}`] ?? allDoorsOpen)) &&
      Math.abs(along - opening.at) < opening.width / 2 - radius - 0.035,
    );
    if (!passage) return false;
  }
  return true;
}

/** Small, axis-separated steps prevent tunnelling and slide along walls. */
export function moveWalkPosition(x: number, z: number, dx: number, dz: number, allowed: (x: number, z: number) => boolean) {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.04));
  for (let i = 0; i < steps; i++) {
    if (allowed(x + dx / steps, z)) x += dx / steps;
    if (allowed(x, z + dz / steps)) z += dz / steps;
  }
  return [x, z] as const;
}
