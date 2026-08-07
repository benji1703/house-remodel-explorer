export type ZoneId =
  | "north-extension"
  | "central-core"
  | "southwest-room"
  | "east-upper-room"
  | "east-lower-room"
  | "service-core";

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
      shortLabel: "N",
      label: "North extension",
      description: "Clearly dimensioned 420 × 380 cm volume at the top of the measured plan.",
      status: "measured",
      x: 3.4,
      z: 0,
      width: 4.2,
      depth: 3.8,
      level: 0.12,
    },
    {
      id: "central-core",
      shortLabel: "C",
      label: "Central core",
      description: "Main connecting space traced from the photographed plan. Internal use is not yet assigned here.",
      status: "traced",
      x: 3.4,
      z: 3.8,
      width: 4.2,
      depth: 8.3,
      level: 0.1,
    },
    {
      id: "southwest-room",
      shortLabel: "SW",
      label: "South-west room",
      description: "Dimensioned lower-left volume, approximately 340 × 390 cm at the exterior shell.",
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
      shortLabel: "S",
      label: "Service core",
      description: "Bathroom/service area traced from the plan. Fixture geometry is intentionally excluded until audited.",
      status: "needs-confirmation",
      x: 4.9,
      z: 10.2,
      width: 2.7,
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
