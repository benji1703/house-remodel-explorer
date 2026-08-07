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
    southwestDepth: 390,
  },
  // Metres. The photographed measured drawing is the only source for this shell.
  footprint: [
    [3.4, 0],
    [7.6, 0],
    [7.6, 5.0],
    [11.4, 5.0],
    [11.4, 12.1],
    [0, 12.1],
    [0, 8.2],
    [3.4, 8.2],
  ] as Array<[number, number]>,
  zones: [
    {
      id: "north-extension",
      shortLabel: "K",
      label: "Kitchen",
      description: "Proposed kitchen (owner program, 2026-08-07) in the dimensioned 420 × 380 cm north volume. Shell is measured; cabinetry/appliance layout is not designed yet — see the outdoor moodboard for the intended oak-and-warm-neutral material direction.",
      status: "measured",
      x: 3.4,
      z: 0,
      width: 4.2,
      depth: 3.8,
      level: 0.12,
    },
    {
      id: "central-core",
      shortLabel: "LR",
      label: "Living room",
      description: "Proposed living room (owner program, 2026-08-07). Owner has requested a large west-facing opening in this room's exterior wall (x=3.4 m) — a new remodel decision, not in the original measured plan; see geometryApprovalItems 'living-west-opening'. Shell south end overlaps the service-core/ensuite footprint below; depth trimmed to reduce that overlap.",
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
      description: "Proposed master bedroom (owner program, 2026-08-07) in the dimensioned lower-left volume, approximately 340 × 390 cm at the exterior shell.",
      status: "measured",
      x: 0,
      z: 8.2,
      width: 3.4,
      depth: 3.9,
      level: 0.14,
    },
    {
      id: "east-upper-room",
      shortLabel: "E1",
      label: "East upper room",
      description: "Room boundary is visible in the scan; exact clear internal dimensions still need confirmation.",
      status: "needs-confirmation",
      x: 7.6,
      z: 5.0,
      width: 3.8,
      depth: 3.55,
      level: 0.16,
    },
    {
      id: "east-lower-room",
      shortLabel: "E2",
      label: "East lower room",
      description: "Room boundary is visible in the scan; door, wall thickness and clear dimensions remain provisional.",
      status: "needs-confirmation",
      x: 7.6,
      z: 8.55,
      width: 3.8,
      depth: 3.55,
      level: 0.16,
    },
    {
      id: "service-core",
      shortLabel: "B",
      label: "Main bathroom",
      description: "Proposed main bathroom (owner program, 2026-08-07), traced from the plan. Fixture geometry is intentionally excluded until audited.",
      status: "needs-confirmation",
      x: 4.9,
      z: 10.2,
      width: 2.7,
      depth: 1.9,
      level: 0.2,
    },
    {
      id: "ensuite",
      shortLabel: "EN",
      label: "Ensuite bathroom",
      description: "Proposed ensuite (owner program, 2026-08-07) carved from the central-core volume between the master bedroom and the main bathroom. Not a separate room on the measured plan — this is a new internal partition proposal, not yet dimensioned or confirmed.",
      status: "needs-confirmation",
      x: 3.4,
      z: 10.2,
      width: 1.5,
      depth: 1.9,
      level: 0.2,
    },
  ] satisfies HouseZone[],
};

export const statusCopy: Record<GeometryStatus, string> = {
  measured: "Dimensioned",
  traced: "Visible in source",
  "needs-confirmation": "Confirm",
};

export const geometryApprovalItems: ApprovalItem[] = [
  {
    id: "north-orientation",
    category: "orientation",
    description: "Confirm north arrow orientation shown on measured plan",
    approved: false,
    notes: "Visual north indicator present; needs confirmation of true north",
  },
  {
    id: "ext-outer-walls-thickness",
    category: "thickness",
    description: "Exterior wall thickness (all perimeter)",
    zone: "north-extension",
    approved: false,
    notes: "Provisionally traced from plan; verify actual construction thickness",
  },
  {
    id: "ext-ceiling-height",
    category: "ceiling-height",
    description: "North extension ceiling height",
    zone: "north-extension",
    approved: false,
    notes: "Not dimensioned; requires field measurement",
  },
  {
    id: "central-wall-thickness",
    category: "thickness",
    description: "Internal partition walls (central core)",
    zone: "central-core",
    approved: false,
    notes: "Visible in plan; exact thickness unconfirmed",
  },
  {
    id: "central-ceiling-height",
    category: "ceiling-height",
    description: "Central core ceiling height",
    zone: "central-core",
    approved: false,
    notes: "Not dimensioned; requires field measurement",
  },
  {
    id: "sw-floor-level",
    category: "floor-level",
    description: "Southwest room floor level relative to main level",
    zone: "southwest-room",
    approved: false,
    notes: "Step visible in plan; height difference unconfirmed",
  },
  {
    id: "e1-opening-dims",
    category: "opening",
    description: "East upper room door/window dimensions and positions",
    zone: "east-upper-room",
    approved: false,
    notes: "Symbols visible; exact opening sizes unclear",
  },
  {
    id: "e1-internal-dims",
    category: "dimension",
    description: "East upper room internal clear dimensions",
    zone: "east-upper-room",
    approved: false,
    notes: "Plan boundary traced; verify against wall thickness",
  },
  {
    id: "e2-door-position",
    category: "opening",
    description: "East lower room door opening position and size",
    zone: "east-lower-room",
    approved: false,
    notes: "Symbol visible; requires clarification",
  },
  {
    id: "e2-internal-dims",
    category: "dimension",
    description: "East lower room internal clear dimensions",
    zone: "east-lower-room",
    approved: false,
    notes: "Plan boundary traced; verify dimensions",
  },
  {
    id: "svc-fixtures-scope",
    category: "opening",
    description: "Service core fixture positions (toilet, vanity, tub layout)",
    zone: "service-core",
    approved: false,
    notes: "Simplified outline only; detailed fixture coords pending",
  },
  {
    id: "living-west-opening",
    category: "opening",
    description: "Large west-facing opening (wide sliding doors) in the living room's exterior wall",
    zone: "central-core",
    approved: true,
    notes: "New remodel decision (2026-08-07, owner-approved), not present on the original measured plan. Placement follows the outdoor moodboard's indoor/outdoor sliding-door pattern. Exact width, head height, and structural lintel sizing still need an elevation drawing before construction.",
  },
  {
    id: "ensuite-partition",
    category: "opening",
    description: "New internal partition carving the ensuite out of the central-core volume",
    zone: "ensuite",
    approved: true,
    notes: "New remodel decision (2026-08-07, owner-approved): ensuite sits between the master bedroom and main bathroom. Partition position is a first pass, not yet dimensioned against the approved master overlay.",
  },
  {
    id: "floor-level-changes",
    category: "floor-level",
    description: "All floor level transitions across zones",
    approved: false,
    notes: "Provisional step locations identified; heights need confirmation",
  },
];
