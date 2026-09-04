"use client";
import { Blk } from "./shared";
import type { Palette } from "./shared";
import { EditableFurniture, type FurnitureEditingState } from "./EditableFurniture";
import { CoffeeTable, FURN, LoungeChair, Pendant, PotPlant, Sofa } from "./furniture";

/** Living — conversation group faces west glazing. Basic shapes, real sizes. */
export function Living({ base, palette, furnitureEditing }: { base: number; palette: Palette; furnitureEditing: FurnitureEditingState }) {
  return (
    <group>
      <Blk
        x={5.4}
        z={6.15}
        y={base + 0.002}
        w={2.8}
        d={3.0}
        h={FURN.rug.h}
        material={palette.stone}
      />

      {/* Sofa on east side, sits facing west toward terrace. 220×90 cm. */}
      <EditableFurniture id="living-sofa" editing={furnitureEditing} x={6.7} z={6.1} base={base} swapPlanAxes>
        <Sofa base={base} palette={palette} x={6.7} z={6.1} face="w" />
      </EditableFurniture>

      {/* Coffee table 120×70 in front of sofa. */}
      <EditableFurniture id="living-coffee-table" editing={furnitureEditing} x={5.35} z={6.1} base={base}>
        <CoffeeTable base={base} palette={palette} x={5.35} z={6.1} />
      </EditableFurniture>

      {/* Lounge chair closes the triangle — clear of bedroom door swing. */}
      <EditableFurniture id="living-lounge-chair" editing={furnitureEditing} x={4.5} z={7.45} base={base}>
        <LoungeChair base={base} palette={palette} x={4.5} z={7.45} face="n" />
      </EditableFurniture>

      <Pendant base={base} palette={palette} x={5.4} z={6.1} />
      <PotPlant base={base} palette={palette} x={7.05} z={4.5} scale={0.9} />
    </group>
  );
}
