export type ZoneId =
  | "north-extension"
  | "central-core"
  | "southwest-room"
  | "east-upper-room"
  | "east-lower-room"
  | "service-core"
  | "ensuite";

export type GeometryStatus = "measured" | "traced" | "needs-confirmation";

export type HouseZone = {
  id: ZoneId;
  shortLabel: string;
  label: string;
  description: string;
  status: GeometryStatus;
  x: number;
  z: number;
  width: number;
  depth: number;
  level: number;
};

export type ApprovalItem = {
  id: string;
  category: "dimension" | "opening" | "thickness" | "ceiling-height" | "floor-level" | "orientation";
  description: string;
  zone?: ZoneId;
  approved: boolean;
  notes?: string;
};

/**
 * Working geometry assumptions for the remodel model.
 * Closed 2026-08-08 by owner direction ("close open geometry using
 * intelligence"): typical Israeli single-storey practice + measured-plan
 * chains where readable. Still not a construction survey — elevations and
 * on-site checks remain before build docs — but they are no longer open
 * questions in the explorer.
 */
export const designAssumptions = {
  // Hollow block + plaster exterior; light internal partition — standard
  // for this house type; matches the plan's 10/20 corner marks as thickness.
  exteriorWallThicknessCm: 20,
  interiorWallThicknessCm: 10,
  // Israeli building code minimum finished height for habitable rooms;
  // appropriate for a modest single-storey home (not a lofted volume).
  finishedCeilingHeightCm: 250,
  livingWestOpening: {
    widthCm: 360,
    headHeightCm: 240,
    sillHeightCm: 0,
  },
  /** Main entry — measured-plan door into the kitchen (north bay). */
  kitchenMainEntry: {
    widthCm: 100,
    headHeightCm: 210,
    sillHeightCm: 0,
  },
  /** Master bedroom west exit onto private patio — remodel decision, not on measured plan. */
  masterWestExit: {
    widthCm: 120,
    headHeightCm: 210,
    sillHeightCm: 0,
  },
  /** Easy boho timber pergola west of master (outside footprint). Atmosphere only. */
  masterPergola: {
    widthCm: 240,
    depthCm: 300,
    heightCm: 240,
  },
  ensuiteBedroomDoor: {
    widthCm: 80,
    headHeightCm: 210,
    sillHeightCm: 0,
  },
  bedroomWindow: {
    eastWidthCm: 140,
    northWidthCm: 140,
    southWidthCm: 140,
    sillHeightCm: 95,
    headHeightCm: 220,
  },
  /**
   * Fenestration language: Klil Belgian 4300 thin aluminium frames +
   * Belgian 1300 hinged louvre shutters (45 mm slats) on exterior windows.
   * Visual reference only — not a shop drawing.
   */
  fenestration: {
    series: "Klil Belgian 4300 / 1300",
    frameDepthMm: 40,
    louvreSlatMm: 45,
  },
  pergola: {
    widthCm: 320,
    depthCm: 500,
    heightCm: 276,
  },
} as const;

export const house = {
  title: "House Remodel",
  revision: "Geometry audit 01",
  units: "cm",
  dimensions: {
    maximumWidth: 1140,
    maximumDepth: 1210,
    northExtensionWidth: 420,
    northExtensionDepth: 380,
    southwestWidth: 340,
    // West outer chain on the measured plan: 830 + 380 = 1210 (see GEOMETRY_AUDIT).
    southwestDepth: 380,
  },
  // Metres. The photographed measured drawing is the only source for this shell.
  // West jog at z=8.3 m — plan label 830 cm (not the earlier 820 trace).
  footprint: [
    [3.4, 0],
    [7.6, 0],
    [7.6, 5.0],
    [11.4, 5.0],
    [11.4, 12.1],
    [0, 12.1],
    [0, 8.3],
    [3.4, 8.3],
  ] as Array<[number, number]>,
  zones: [
    {
      id: "north-extension",
      shortLabel: "K",
      label: "Kitchen",
      description:
        "North volume, 420 × 380 cm. Oak kitchen open to living; main entry on the east wall, bay window to the north.",
      status: "measured",
      x: 3.4,
      z: 0,
      width: 4.2,
      depth: 3.8,
      level: 0.1,
    },
    {
      id: "central-core",
      shortLabel: "LR",
      label: "Living room",
      description:
        "Central living volume toward the west terrace. Wide glazed opening on the west wall — a remodel addition beyond the survey drawing.",
      status: "traced",
      x: 3.4,
      z: 3.8,
      width: 4.2,
      depth: 6.4,
      level: 0.1,
    },
    {
      id: "southwest-room",
      shortLabel: "BR",
      label: "Master bedroom",
      description:
        "South-west bedroom, 340 × 380 cm. West door to a private timber court outside the measured footprint.",
      status: "measured",
      x: 0,
      z: 8.3,
      width: 3.4,
      depth: 3.8,
      level: 0.1,
    },
    {
      id: "east-upper-room",
      shortLabel: "E1",
      label: "Guest bedroom",
      description: "East upper bedroom. Survey doors retained; east and north windows as designed.",
      status: "traced",
      x: 7.6,
      z: 5.0,
      width: 3.8,
      depth: 3.55,
      level: 0.1,
    },
    {
      id: "east-lower-room",
      shortLabel: "E2",
      label: "East bedroom",
      description: "East lower room — bedroom or study. Survey doors retained; east and south windows as designed.",
      status: "traced",
      x: 7.6,
      z: 8.55,
      width: 3.8,
      depth: 3.55,
      level: 0.1,
    },
    {
      id: "service-core",
      shortLabel: "B",
      label: "Bathroom",
      description: "Main bath with vanity, toilet, and shower — working layout for the remodel.",
      status: "traced",
      x: 4.9,
      z: 10.2,
      width: 2.7,
      depth: 1.9,
      level: 0.1,
    },
    {
      id: "ensuite",
      shortLabel: "EN",
      label: "Ensuite",
      description: "Private bath between master and main bath; 80 cm door from the bedroom.",
      status: "traced",
      x: 3.4,
      z: 10.2,
      width: 1.5,
      depth: 1.9,
      level: 0.1,
    },
  ] satisfies HouseZone[],
};

export const statusCopy: Record<GeometryStatus, string> = {
  measured: "Measured",
  traced: "Confirmed",
  "needs-confirmation": "Pending",
};

/**
 * Geometry question ledger. Closed 2026-08-08 (owner: close with architectural
 * intelligence). Values match `designAssumptions` and the measured-plan chains
 * in docs/GEOMETRY_AUDIT.md. Construction still needs elevations / site check.
 */
export const geometryApprovalItems: ApprovalItem[] = [
  {
    id: "north-orientation",
    category: "orientation",
    description: "Confirm north arrow orientation shown on measured plan",
    approved: true,
    notes: "Closed 2026-08-08: adopt plan graphic north (sheet arrow, top of drawing = north in the model). True-north survey bearing not on the sheet — model north = plan north.",
  },
  {
    id: "ext-outer-walls-thickness",
    category: "thickness",
    description: "Exterior wall thickness (all perimeter)",
    zone: "north-extension",
    approved: true,
    notes: "Closed 2026-08-08: 20 cm exterior (hollow block + plaster). Matches typical Israeli single-storey practice and the plan's 20 corner marks read as thickness.",
  },
  {
    id: "ext-ceiling-height",
    category: "ceiling-height",
    description: "North extension ceiling height",
    zone: "north-extension",
    approved: true,
    notes: "Closed 2026-08-08: 250 cm finished height — Israeli code minimum for habitable rooms; correct default for this modest single-storey shell.",
  },
  {
    id: "central-wall-thickness",
    category: "thickness",
    description: "Internal partition walls (central core)",
    zone: "central-core",
    approved: true,
    notes: "Closed 2026-08-08: 10 cm light internal partitions — standard for this build type; consistent with plan 10 marks.",
  },
  {
    id: "central-ceiling-height",
    category: "ceiling-height",
    description: "Central core ceiling height",
    zone: "central-core",
    approved: true,
    notes: "Closed 2026-08-08: 250 cm finished height, same as north extension — continuous flat ceiling across the open kitchen/living volume.",
  },
  {
    id: "sw-floor-level",
    category: "floor-level",
    description: "Southwest room floor level relative to main level",
    zone: "southwest-room",
    approved: true,
    notes: "Closed 2026-08-08: no level change. Plan step marks read as threshold/site symbols, not a raised bedroom slab; single FFL for the model.",
  },
  {
    id: "e1-opening-dims",
    category: "opening",
    description: "East upper room door/window dimensions and positions",
    zone: "east-upper-room",
    approved: true,
    notes: "Closed 2026-08-08: keep plan door; add east + north windows at 140 cm wide, sill 95 cm, head 220 cm (designAssumptions.bedroomWindow).",
  },
  {
    id: "e1-internal-dims",
    category: "dimension",
    description: "East upper room internal clear dimensions",
    zone: "east-upper-room",
    approved: true,
    notes: "Closed 2026-08-08: outer envelope 380 × 355 cm from the traced plan box; clear dims = envelope minus 20 cm exterior / 10 cm partition where they apply.",
  },
  {
    id: "e2-door-position",
    category: "opening",
    description: "East lower room door opening position and size",
    zone: "east-lower-room",
    approved: true,
    notes: "Closed 2026-08-08: keep plan door; add east + south windows at designAssumptions.bedroomWindow (140 / 95 / 220).",
  },
  {
    id: "e2-internal-dims",
    category: "dimension",
    description: "East lower room internal clear dimensions",
    zone: "east-lower-room",
    approved: true,
    notes: "Closed 2026-08-08: same traced envelope as E1 — 380 × 355 cm outer; clear dims after wall thicknesses.",
  },
  {
    id: "svc-fixtures-scope",
    category: "opening",
    description: "Service core fixture positions (toilet, vanity, tub layout)",
    zone: "service-core",
    approved: true,
    notes: "Closed 2026-08-08: accept the working vanity / toilet / shower layout for remodel visualisation. Final plumbing set-out still follows a wet-room drawing later.",
  },
  {
    id: "kitchen-main-entry",
    category: "opening",
    description: "Main entry door (כ.ב.) on the kitchen east wall",
    zone: "north-extension",
    approved: true,
    notes: "Closed 2026-08-08: 100 × 210 cm hinged light-oak door on kitchen east wall (~z 3.15, south of bay), east window north (~z 0.85). North bay keeps window only. Cabinetry clears both openings.",
  },
  {
    id: "living-west-opening",
    category: "opening",
    description: "Large west-facing opening (wide sliding doors) in the living room's exterior wall",
    zone: "central-core",
    approved: true,
    notes: "Owner remodel decision 2026-08-07: 360 cm wide, 240 cm head, zero sill. Structural lintel sizing still needs an elevation before construction.",
  },
  {
    id: "master-west-exit",
    category: "opening",
    description: "Master bedroom west exit door + private boho timber pergola patio",
    zone: "southwest-room",
    approved: true,
    notes: "Owner remodel decision 2026-08-08: 120 cm glazed exit on west wall (replaces prior west window), easy wood-base pergola patio outside footprint (~240×300×240 cm). Not on measured plan.",
  },
  {
    id: "ensuite-partition",
    category: "opening",
    description: "New internal partition carving the ensuite out of the central-core volume",
    zone: "ensuite",
    approved: true,
    notes: "Owner remodel decision 2026-08-07: 150 × 190 cm ensuite, 80 cm bedroom door between master and main bath.",
  },
  {
    id: "floor-level-changes",
    category: "floor-level",
    description: "All floor level transitions across zones",
    approved: true,
    notes: "Closed 2026-08-08: single finished floor level throughout. Southern ב.ס / ב.ר marks stay outside the shell (site pit/meter), not internal steps.",
  },
  {
    id: "west-jog-830",
    category: "dimension",
    description: "West outer chain jog (830 vs earlier 820 trace)",
    zone: "southwest-room",
    approved: true,
    notes: "Closed 2026-08-08: trust the measured-plan west chain 830 + 380 = 1210. Jog at z = 8.3 m; southwest depth 380 cm.",
  },
];
