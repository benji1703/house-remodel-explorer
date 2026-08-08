"use client";
import { Blk, Prop } from "./shared";
import type { Palette } from "./shared";

export function EastUpperRoom({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      <Prop slug="old_bed_frame" x={8.5} z={5.8} y={base} rotationY={Math.PI / 2} />
      <Blk x={8.5} z={5.8} y={base + 0.32} w={2.0} d={1.5} h={0.18} material={palette.upholstery} />
      <Prop slug="painted_wooden_nightstand" x={8.5} z={7.0} y={base} rotationY={Math.PI / 2} />

      {/* Reading corner. */}
      <Prop slug="WoodenChair_01" x={10.6} z={5.5} y={base} rotationY={-Math.PI / 2} />
      <Prop slug="side_table_01" x={10.6} z={6.1} y={base} />
    </group>
  );
}

export function EastLowerRoom({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      <Prop slug="vintage_day_bed" x={8.6} z={9.4} y={base} rotationY={Math.PI / 2} />
      <Prop slug="painted_wooden_nightstand" x={8.6} z={10.7} y={base} rotationY={Math.PI / 2} />
      <Prop slug="Ottoman_01" x={10.6} z={11.4} y={base} />
    </group>
  );
}
