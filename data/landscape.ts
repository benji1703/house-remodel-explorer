/** Landscape proposals only. Plan coordinates and specimen sizes in centimetres.
 * No site boundary, architectural dimension or floor datum is approved here.
 */
export const landscapeSpecies = {
  "olea-europaea": { name: "Olive", botanical: "Olea europaea", heightCm: 365, spreadCm: 430, role: "Silver canopy · nursery-grown specimen", reference: 2 },
  "salvia-rosmarinus": { name: "Rosemary", botanical: "Salvia rosmarinus", heightCm: 75, spreadCm: 105, role: "Aromatic evergreen · narrow needle-like leaves", reference: 5 },
  "salvia-fruticosa": { name: "Israeli sage", botanical: "Salvia fruticosa", heightCm: 78, spreadCm: 110, role: "Soft silver foliage · occasional violet flowers", reference: 4 },
  "myrtus-communis": { name: "Myrtle", botanical: "Myrtus communis", heightCm: 110, spreadCm: 105, role: "Dark evergreen structure · small opposite leaves", reference: 3 },
  "limonium-perezii": { name: "Sea lavender", botanical: "Limonium perezii", heightCm: 78, spreadCm: 85, role: "Broad basal rosette · airy violet flower sprays", reference: 7 },
  "leymus-arenarius": { name: "Dune grass", botanical: "Leymus arenarius", heightCm: 90, spreadCm: 115, role: "Blue-green blades · proposed contained clumps", reference: 8 },
  "lomandra-longifolia": { name: "Lomandra", botanical: "Lomandra longifolia", heightCm: 60, spreadCm: 100, role: "Fine arching foliage · warm straw accents", reference: 9 },
  "bougainvillea-glabra": { name: "Bougainvillea", botanical: "Bougainvillea glabra", heightCm: 300, spreadCm: 250, role: "Magenta bracts · trained on the outer pergola beam", reference: 6 },
} as const;

export type LandscapeSpeciesId = keyof typeof landscapeSpecies;
export type LandscapePlant = {
  id: string;
  species: LandscapeSpeciesId;
  positionCm: readonly [number, number, number]; // x, elevation, plan z
  scale: number;
  rotation: number;
  status: "proposed";
};

// Existing architectural surfaces are exclusions, never inferred garden boundaries.
export type LandscapeRect = { id: string; minX: number; maxX: number; minZ: number; maxZ: number; maxY?: number };
export const landscapeClearances: readonly LandscapeRect[] = [
  { id: "terrace-access", minX: -900, maxX: 30, minZ: 540, maxZ: 660, maxY: 215 },
  { id: "east-arrival", minX: 765, maxX: 1750, minZ: 255, maxZ: 390, maxY: 215 },
  { id: "master-patio-access", minX: -430, maxX: 0, minZ: 930, maxZ: 1110, maxY: 215 },
];
export const houseExclusions: readonly LandscapeRect[] = [
  { id: "north-central-shell", minX: 310, maxX: 790, minZ: -30, maxZ: 1240 },
  { id: "east-shell", minX: 730, maxX: 1170, minZ: 470, maxZ: 1240 },
  { id: "southwest-shell", minX: -30, maxX: 370, minZ: 800, maxZ: 1240 },
  { id: "terrace", minX: 0, maxX: 360, minZ: 320, maxZ: 850, maxY: 225 },
  { id: "master-deck", minX: -278, maxX: 10, minZ: 830, maxZ: 1170 },
];

export type LandscapeBounds = { minCm: readonly [number, number, number]; maxCm: readonly [number, number, number] };
/** Full transformed exported bounds, checked in height bands at the renderer.
 * Only the two trained vines may enter their existing post sleeves below 225cm.
 * Their canopy can overhang circulation only above the stated head clearance.
 */
export function isLandscapeBoundsClear(bounds: LandscapeBounds, vine = false) {
  const [minX, minY, minZ] = bounds.minCm;
  const [maxX, , maxZ] = bounds.maxCm;
  return [...landscapeClearances, ...houseExclusions].every((r) => {
    if (minY >= (r.maxY ?? Infinity)) return true;
    if (maxX <= r.minX || minX >= r.maxX || maxZ <= r.minZ || minZ >= r.maxZ) return true;
    if (vine && r.id === "terrace") {
      return minX >= 28 && maxX <= 70 && ((minZ >= 378 && maxZ <= 422) || (minZ >= 760 && maxZ <= 804));
    }
    return false;
  });
}

const plant = (id: string, species: LandscapeSpeciesId, x: number, z: number, scale = 1, rotation = 0, elevation = -3.5): LandscapePlant =>
  ({ id, species, positionCm: [Math.round(x), elevation, Math.round(z)], scale, rotation, status: "proposed" });
const anchors: LandscapePlant[] = [
  plant("olive-west-specimen", "olea-europaea", -320, 275, 0.97, 0.6),
  plant("olive-east-specimen", "olea-europaea", 1470, 995, 0.68, 2.1),
  plant("bougainvillea-outer-south", "bougainvillea-glabra", 44, 782, 1, 0, 8),
  plant("bougainvillea-outer-north", "bougainvillea-glabra", 44, 400, 1, Math.PI, 8),
];

// Golden-angle cluster samples use jittered radius and coherent species groups.
// The dimensions describe proposed planting drifts; they are not edged beds.
type Drift = { id: string; x: number; z: number; species: LandscapeSpeciesId[]; count: number; widthCm: number; depthCm: number; angle: number; scale?: number };
const drifts: Drift[] = [
  { id: "olive-understory", x: -420, z: 245, species: ["salvia-fruticosa", "salvia-fruticosa", "lomandra-longifolia", "limonium-perezii"], count: 16, widthCm: 380, depthCm: 300, angle: 0.2 },
  { id: "north-courtyard", x: 50, z: 175, species: ["myrtus-communis", "myrtus-communis", "salvia-fruticosa", "salvia-rosmarinus"], count: 12, widthCm: 360, depthCm: 230, angle: 0.15, scale: 1.06 },
  { id: "terrace-north", x: -180, z: 425, species: ["salvia-rosmarinus", "salvia-rosmarinus", "limonium-perezii", "salvia-fruticosa", "lomandra-longifolia"], count: 16, widthCm: 310, depthCm: 140, angle: -0.08 },
  { id: "terrace-south", x: -210, z: 755, species: ["myrtus-communis", "myrtus-communis", "salvia-fruticosa", "salvia-rosmarinus"], count: 15, widthCm: 400, depthCm: 115, angle: 0.03 },
  { id: "east-upper", x: 1340, z: 650, species: ["salvia-rosmarinus", "leymus-arenarius", "limonium-perezii"], count: 10, widthCm: 320, depthCm: 170, angle: Math.PI / 2 },
  { id: "east-olive", x: 1415, z: 1120, species: ["myrtus-communis", "salvia-fruticosa", "lomandra-longifolia"], count: 10, widthCm: 300, depthCm: 220, angle: Math.PI / 2 },
  { id: "south-edge", x: 615, z: 1425, species: ["salvia-rosmarinus", "salvia-fruticosa", "limonium-perezii", "lomandra-longifolia"], count: 20, widthCm: 970, depthCm: 175, angle: 0 },
  { id: "front-foreground", x: 590, z: 1310, species: ["salvia-rosmarinus", "salvia-fruticosa", "limonium-perezii", "lomandra-longifolia", "leymus-arenarius"], count: 18, widthCm: 970, depthCm: 100, angle: 0.02 },
  { id: "west-foreground", x: -550, z: 795, species: ["myrtus-communis", "salvia-fruticosa", "salvia-fruticosa", "salvia-rosmarinus", "limonium-perezii"], count: 15, widthCm: 370, depthCm: 180, angle: Math.PI / 2, scale: 1.05 },
  { id: "north-west-layer", x: -535, z: 435, species: ["myrtus-communis", "salvia-fruticosa", "lomandra-longifolia", "limonium-perezii"], count: 12, widthCm: 320, depthCm: 120, angle: -0.12 },
];
export const landscapeRandom = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export function isPlantClear(p: LandscapePlant) {
  // Early conservative placement pass; runtime rechecks the actual GLB geometry.
  // Olive and vine height bands are checked there, so upper foliage may frame paths.
  const radius = p.species === "olea-europaea" ? 65 * p.scale : p.species === "bougainvillea-glabra" ? 10 : landscapeSpecies[p.species].spreadCm * p.scale * 0.55;
  const [x, y, z] = p.positionCm;
  return isLandscapeBoundsClear({ minCm: [x - radius, y, z - radius], maxCm: [x + radius, y + 100, z + radius] }, p.species === "bougainvillea-glabra");
}
const proposedDrifts = drifts.flatMap((drift, di) => Array.from({ length: drift.count }, (_, i) => {
  // Retry within the same designed mass; never silently push planting onto a route.
  for (let attempt = 0; attempt < 35; attempt++) {
    const seed = di * 411 + i * 19 + attempt * 271;
    const a = i * 2.399963 + attempt * 1.73 + landscapeRandom(seed) * 0.52;
    const radius = Math.sqrt((i + 0.35) / drift.count) * (0.82 + landscapeRandom(seed + 1) * 0.22);
    const along = Math.cos(a) * drift.widthCm * radius / 2;
    const across = Math.sin(a) * drift.depthCm * radius / 2;
    const p = plant(`${drift.id}-${i + 1}`, drift.species[i % drift.species.length],
      drift.x + Math.cos(drift.angle) * along - Math.sin(drift.angle) * across,
      drift.z + Math.sin(drift.angle) * along + Math.cos(drift.angle) * across,
      (0.84 + landscapeRandom(seed + 2) * 0.28) * (drift.scale ?? 1), landscapeRandom(seed + 3) * Math.PI * 2);
    if (isPlantClear(p)) return p;
  }
  return null;
}).filter((p): p is LandscapePlant => p !== null));
export const landscapePlants = [...anchors, ...proposedDrifts].filter(isPlantClear);

export type LandscapeRock = { id: string; positionCm: readonly [number, number, number]; scale: readonly [number, number, number]; rotation: number; status: "proposed" };
// Broad, half-buried stones sit within the planting, not in the 120cm route.
export const landscapeRocks: readonly LandscapeRock[] = [
  { id: "olive-root-stone", positionCm: [-422, -12, 368], scale: [0.95, 0.66, 0.66], rotation: 0.35, status: "proposed" },
  { id: "foreground-limestone-a", positionCm: [-565, -12, 466], scale: [1.12, 0.78, 0.67], rotation: -0.38, status: "proposed" },
  { id: "foreground-limestone-b", positionCm: [-476, -15, 474], scale: [0.76, 0.7, 0.57], rotation: 0.22, status: "proposed" },
  { id: "south-path-limestone-a", positionCm: [-445, -14, 734], scale: [1.18, 0.82, 0.72], rotation: 0.65, status: "proposed" },
  { id: "south-path-limestone-b", positionCm: [-357, -15, 719], scale: [0.66, 0.62, 0.61], rotation: -0.25, status: "proposed" },
  { id: "terrace-north-stone", positionCm: [-88, -15, 448], scale: [0.88, 0.7, 0.61], rotation: -0.1, status: "proposed" },
  { id: "north-courtyard-stone", positionCm: [180, -14, 213], scale: [0.78, 0.68, 0.58], rotation: 1.1, status: "proposed" },
  { id: "east-olive-stone", positionCm: [1360, -15, 1080], scale: [0.8, 0.72, 0.6], rotation: 2.2, status: "proposed" },
];
export const landscapeGround = {
  // Continuous presentation field; these are not survey limits.
  centerCm: [320, -3.5, 650], sizeCm: [12000, 12000], textureTileCm: 140,
  pebbleCount: { high: 2500, light: 500 },
} as const;
export const gardenCamera = {
  positionCm: [-675, 155, 335],
  targetCm: [310, 118, 635],
} as const;
