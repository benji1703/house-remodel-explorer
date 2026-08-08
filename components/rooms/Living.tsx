"use client";
import { Blk, Prop } from "./shared";
import type { Palette } from "./shared";

export function Living({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      {/* Rug. */}
      <Blk x={5.6} z={6.1} y={base + 0.005} w={3.4} d={3.8} h={0.02} material={palette.stone} />

      {/* Sofa, facing the west glazing. */}
      <Prop slug="Sofa_01" x={6.6} z={5.9} y={base} rotationY={Math.PI / 2} />

      {/* Coffee table in front of the sofa. */}
      <Prop slug="CoffeeTable_01" x={5.6} z={5.9} y={base} />

      {/* Lounge chair, pulled clear of the bedroom-door swing at the south
          end of this wall (x=3.4, z≈8.75-9.65), same clearance rule as the
          previous blockout. */}
      <Prop slug="mid_century_lounge_chair" x={4.9} z={7.1} y={base} rotationY={-Math.PI / 4} />

      {/* Ceiling light and wall decor. */}
      <Prop slug="modern_ceiling_lamp_01" x={5.6} z={5.9} y={base + 2.3} />
      <Prop slug="ornate_mirror_01" x={4.05} z={4.1} y={base + 1.4} rotationY={Math.PI / 2} />
    </group>
  );
}
