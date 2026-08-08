"use client";
import { Blk, Prop } from "./shared";
import type { Palette } from "./shared";

export function MasterBedroom({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      {/* Real bed frame (closest neutral wood match in the free catalog).
          Pulled 0.4m north of the plan draft: the model's actual footprint
          (~0.9 x 2.0m) ran the south end 0.3m past the z=12.1 wall. */}
      <Prop slug="old_bed_frame" x={1.7} z={11.0} y={base} rotationY={Math.PI} />

      {/* Procedural mattress/linen slab on top, in the room's warm palette,
          since the frame model ships without bedding. */}
      <Blk x={1.7} z={10.8} y={base + 0.32} w={1.6} d={2.0} h={0.18} material={palette.upholstery} />

      {/* Nightstands flanking the bed. */}
      <Prop slug="ClassicNightstand_01" x={0.55} z={11.35} y={base} />
      <Prop slug="ClassicNightstand_01" x={2.85} z={11.35} y={base} rotationY={Math.PI} />

      {/* Wardrobe against the free (west) wall. Shifted from the plan draft:
          the model is a ~2.44m-long cabinet, not a compact wardrobe, so the
          original x=0.3/z=8.6 placement clipped through the west and north
          walls; moved to x=0.35/z=9.45 to sit flush inside the room. */}
      <Prop slug="modern_wooden_cabinet" x={0.35} z={9.45} y={base} rotationY={Math.PI / 2} />
    </group>
  );
}
