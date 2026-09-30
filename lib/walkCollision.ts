import { designAssumptions, house } from "../data/house";
import { exteriorOpenings, partitions, EXT_THICKNESS, INT_THICKNESS } from "../data/structuralWalls";
import { landscapeGround } from "../data/landscape";
import { walkSettings } from "../data/walkthrough";

const radius = walkSettings.radiusCm / 100;
const walls = [
  ...house.footprint.map((a, i) => ({ a, b: house.footprint[(i + 1) % house.footprint.length], openings: exteriorOpenings[i] ?? [], thickness: EXT_THICKNESS, prefix: `ext-${i}` })),
  ...partitions.map((wall, i) => ({ ...wall, thickness: INT_THICKNESS, prefix: `int-${i}` })),
];

/** Plan coordinates in metres, using the same runs/openings as the renderer. */
export function canWalkAt(x: number, z: number, allDoorsOpen: boolean, doorStates: Record<string, boolean>) {
  // The proposed rendered terrain is an exploration limit, not a surveyed plot.
  const [cx, , cz] = landscapeGround.centerCm;
  const [width, depth] = landscapeGround.sizeCm;
  if (Math.abs(x - cx / 100) > width / 200 - radius || Math.abs(z - cz / 100) > depth / 200 - radius) return false;
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

/** Eye height follows existing rendered slabs and the proposed gravel datum. */
export function walkFloorAt(x: number, z: number) {
  const zone = house.zones.find(zone => x >= zone.x && x <= zone.x + zone.width && z >= zone.z && z <= zone.z + zone.depth);
  if (zone) return zone.level;
  if (x >= 0.2 && x <= 3.4 && z >= 3.4 && z <= 8.4) return 0.08;
  const width = designAssumptions.masterPergola.widthCm / 100;
  const depth = designAssumptions.masterPergola.depthCm / 100;
  if (x >= -width - 0.18 && x <= -0.18 && Math.abs(z - 10) <= depth / 2) return 0.06;
  return landscapeGround.centerCm[1] / 100;
}
