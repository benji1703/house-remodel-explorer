import { designAssumptions, house } from "./house";

// Existing renderer coordinates in metres; shared without changing the measured shell.
export const EXT_THICKNESS = designAssumptions.exteriorWallThicknessCm / 100;
export const INT_THICKNESS = designAssumptions.interiorWallThicknessCm / 100;
const DOOR_HEAD = 2.1;
const WINDOW_SILL = designAssumptions.bedroomWindow.sillHeightCm / 100;
const WINDOW_HEAD = designAssumptions.bedroomWindow.headHeightCm / 100;
const WEST_OPENING_WIDTH = designAssumptions.livingWestOpening.widthCm / 100;
const WEST_OPENING_HEAD = designAssumptions.livingWestOpening.headHeightCm / 100;
const MASTER_EXIT_WIDTH = designAssumptions.masterWestExit.widthCm / 100;
const MASTER_EXIT_HEAD = designAssumptions.masterWestExit.headHeightCm / 100;
const KITCHEN_ENTRY_WIDTH = designAssumptions.kitchenMainEntry.widthCm / 100;
const KITCHEN_ENTRY_HEAD = designAssumptions.kitchenMainEntry.headHeightCm / 100;

export type Opening = {
  at: number;
  width: number;
  sill: number;
  head: number;
  style?: "hinged" | "sliding";
  /** Hinged: +1 opens toward local +Z, −1 toward local −Z. */
  swing?: 1 | -1;
  /** Sliding: +1 stacks toward local +X, −1 toward local −X. */
  slide?: 1 | -1;
  fixed?: boolean;
  /** Sliding: +1 local +Z face, −1 local −Z face. */
  face?: 1 | -1;
};

const door = (
  at: number,
  width = 0.9,
  opts: { style?: "hinged" | "sliding"; swing?: 1 | -1; slide?: 1 | -1; face?: 1 | -1 } = {},
): Opening => ({
  at,
  width,
  sill: 0,
  head: DOOR_HEAD,
  style: opts.style ?? "hinged",
  swing: opts.swing ?? 1,
  slide: opts.slide ?? 1,
  face: opts.face ?? 1,
});
const window_ = (at: number, width = 1.4): Opening => ({
  at,
  width,
  sill: WINDOW_SILL,
  head: WINDOW_HEAD,
});

// Approved sill/head dimensions are above finished floor. The floor slab's
// world elevation must be included, otherwise the kitchen counter buries the
// bottom 10 cm of the window frame.
const kitchenWindow = (at: number, width: number): Opening => {
  const floorLevel = house.zones.find((zone) => zone.id === "north-extension")!.level;
  return { ...window_(at, width), sill: WINDOW_SILL + floorLevel, head: WINDOW_HEAD + floorLevel };
};

// Keyed by footprint edge index (edge n runs from point n to point n+1).
export const exteriorOpenings: Record<number, Opening[]> = {
  // Kitchen north bay window.
  0: [kitchenWindow(2.1, 1.6)],
  // Kitchen east: window north; main entry further south (near living open).
  1: [
    kitchenWindow(0.85, 1.2),
    // Hinge outward so the entry leaf never swings across the kitchen joinery.
    { at: 3.15, width: KITCHEN_ENTRY_WIDTH, sill: 0, head: KITCHEN_ENTRY_HEAD, swing: -1 },
  ],
  2: [window_(1.9)],
  3: [window_(1.8), window_(5.0)],
  // South facade (east→west): E2, main bath, ensuite, master.
  4: [window_(1.9), window_(5.2, 1.0), window_(7.25, 0.7), window_(9.7, 1.5)],
  // Master west exit (remodel) — north of bed, clear of south nightstands.
  5: [{ at: 2.9, width: MASTER_EXIT_WIDTH, sill: 0, head: MASTER_EXIT_HEAD, swing: 1 }],
  6: [window_(1.7)],
  7: [{ at: 2.2, width: WEST_OPENING_WIDTH, sill: 0, head: WEST_OPENING_HEAD, fixed: true }],
};

export function openingKind(opening: Opening): "window" | "door" | "terrace" {
  if (opening.fixed) return "window";
  if (opening.sill <= 0 && opening.width >= 2.4) return "terrace";
  if (opening.sill <= 0) return "door";
  return "window";
}

// Proposed internal partitions, derived from the zone boxes in data/house.ts.
// Owner request (2026-08-07): no wall between kitchen and living room — that
// run (a=[3.4,3.8] b=[7.6,3.8]) is intentionally omitted, open-plan.
//
// Wall local frame (OpeningOnWall rot −atan2): for northbound runs, local +Z
// is west (−X world), local −Z is east (+X world).
export const partitions: Array<{ a: [number, number]; b: [number, number]; openings: Opening[] }> = [
  // Living↔E1/E2: bedrooms east → local −Z → swing −1.
  { a: [7.6, 5.0], b: [7.6, 12.1], openings: [door(1.8, 0.9, { swing: -1 }), door(4.3, 0.9, { swing: -1 })] },
  { a: [7.6, 8.55], b: [11.4, 8.55], openings: [] },
  // Master (west, +Z) ↔ baths (east): BR hinged into master; ensuite slides on master face.
  {
    a: [3.4, 8.3],
    b: [3.4, 12.1],
    openings: [
      door(1.0, 0.9, { swing: 1 }),
      door(3.0, 0.8, { style: "sliding", slide: -1, face: 1 }),
    ],
  },
  // Living↔main bath: bath south → local +Z on eastbound run → swing +1.
  { a: [3.4, 10.2], b: [7.6, 10.2], openings: [door(2.4, 0.8, { swing: 1 })] },
  { a: [4.9, 10.2], b: [4.9, 12.1], openings: [] },
];
