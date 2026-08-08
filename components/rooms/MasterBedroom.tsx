"use client";
import type { Palette } from "./shared";
import { Nightstand, Pendant, QueenBed } from "./furniture";

/**
 * Master bedroom — queen bed (160×200) against south wall.
 * West wall: remodel exit door to private boho pergola patio.
 * Zone x∈[0,3.4] z∈[8.3,12.1].
 */
export function MasterBedroom({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      {/* Queen centred on width; head against south wall. */}
      <QueenBed base={base} palette={palette} x={1.7} z={10.95} along="z" headToward="+" />

      <Nightstand base={base} palette={palette} x={0.55} z={11.55} />
      <Nightstand base={base} palette={palette} x={2.85} z={11.55} />

      <Pendant base={base} palette={palette} x={1.7} z={10.95} />
    </group>
  );
}
