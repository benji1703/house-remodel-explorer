/** Proposed fit-out inside the accepted shell. All dimensions in centimetres.
 * Fixture sizes are a design study, not approved plumbing / installation details.
 * North = decreasing z. The existing west door and south window stay in place.
 */
export const ensuiteProposal = {
  status: "proposed",
  room: { minX: 345, maxX: 485, minZ: 1025, maxZ: 1200 },
  door: { wallX: 340, fromZ: 1090, toZ: 1170 },
  shower: { id: "ensuite-shower", x: 443, z: 1067, width: 80, depth: 80 },
  vanity: { id: "ensuite-washbasin", x: 373, z: 1045, width: 48, depth: 32 },
  wc: { id: "ensuite-toilet", wallX: 469, z: 1156, width: 36, projection: 48 },
  cistern: { x: 477, z: 1156, width: 16, depth: 64, height: 112 },
  // Shared standing areas, not a claim of accessibility or code compliance.
  wcFrontClearance: 76,
  finishes: "Warm mineral floor, pale oak, ivory ceramic and brushed bronze",
} as const;
