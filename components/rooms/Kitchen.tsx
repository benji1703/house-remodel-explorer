"use client";
import { Blk, Prop } from "./shared";
import type { Palette } from "./shared";

export function Kitchen({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      {/* Procedural cabinetry/counters/fridge — no real-world CC0 model
          matches custom carpentry at these dimensions, so these stay
          built-to-measure boxes. */}
      <Blk x={5.7} z={0.55} y={base} w={3.8} d={0.65} h={0.9} material={palette.oak} />
      <Blk x={7.25} z={2.2} y={base} w={0.6} d={2.6} h={0.9} material={palette.oak} />
      <Blk x={5.7} z={0.55} y={base + 0.9} w={3.8} d={0.66} h={0.04} material={palette.stone} />
      <Blk x={5.4} z={2.5} y={base} w={2.2} d={0.95} h={0.92} material={palette.oak} />
      <Blk x={5.4} z={2.5} y={base + 0.92} w={2.3} d={1.05} h={0.05} material={palette.stone} />
      <Blk x={4.0} z={0.6} y={base} w={0.78} d={0.72} h={1.9} material={palette.charcoal} />

      {/* Built-in oven/range, slotted into the main counter run. The
          downloaded asset is a full freestanding cooker (~0.61x0.88x0.72m,
          with an oven door and dials), not a thin countertop hob insert as
          the plan assumed, so it sits on the floor (y=base) rather than on
          top of the counter slab. */}
      <Prop slug="electric_stove" x={6.6} z={0.55} y={base} rotationY={Math.PI / 2} />

      {/* Island bar stools, pulled outside the island's own footprint
          (x in [4.3,6.5]) so they don't clip through the solid island
          carcass; seated along its west edge, facing the island. */}
      <Prop slug="bar_chair_round_01" x={4.0} z={2.3} y={base} rotationY={Math.PI} />
      <Prop slug="bar_chair_round_01" x={4.0} z={2.7} y={base} rotationY={Math.PI} />

      {/* Pendant light over the island. */}
      <Prop slug="caged_hanging_light" x={5.4} z={2.5} y={base + 2.3} />

      {/* Counter decor. */}
      <Prop slug="vintage_electric_kettle" x={5.9} z={0.65} y={base + 0.94} />

      {/* Corner plant, moved to the actual free floor corner (south of the
          side counter run, which occupies x in [6.95,7.55] z in [0.9,3.5])
          — the plan's original (7.35, 0.55) sits inside the main counter's
          footprint. */}
      <Prop slug="potted_plant_02" x={7.3} z={3.6} y={base} />
    </group>
  );
}
