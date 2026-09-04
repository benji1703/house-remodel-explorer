"use client";
import type { Palette } from "./shared";
import { EditableFurniture, type FurnitureEditingState } from "./EditableFurniture";
import { Dresser, LoungeChair, Nightstand, QueenBed } from "./furniture";

/**
 * East bedrooms — queen 160×200.
 * West doors at z≈6.8 (E1) / 9.3 (E2) — beds on east wall so leaves stay clear.
 * Envelopes: E1 x∈[7.6,11.4] z∈[5.0,8.55]; E2 x∈[7.6,11.4] z∈[8.55,12.1].
 */
export function EastUpperRoom({ base, palette, furnitureEditing }: { base: number; palette: Palette; furnitureEditing: FurnitureEditingState }) {
  return (
    <group>
      {/* Queen on east wall — west door at z≈6.8 stays clear. */}
      <EditableFurniture id="east-upper-bed" editing={furnitureEditing} x={10.5} z={6.4} base={base}>
        <QueenBed base={base} palette={palette} x={10.5} z={6.4} along="z" headToward="-" />
      </EditableFurniture>

      <EditableFurniture id="east-upper-nightstand" editing={furnitureEditing} x={9.45} z={5.5} base={base}>
        <Nightstand base={base} palette={palette} x={9.45} z={5.5} />
      </EditableFurniture>

      {/* Chair south-west, south of door swing. */}
      <EditableFurniture id="east-upper-chair" editing={furnitureEditing} x={8.35} z={7.7} base={base}>
        <LoungeChair base={base} palette={palette} x={8.35} z={7.7} face="n" />
      </EditableFurniture>
    </group>
  );
}

export function EastLowerRoom({ base, palette, furnitureEditing }: { base: number; palette: Palette; furnitureEditing: FurnitureEditingState }) {
  return (
    <group>
      {/* Queen on east wall — west door at z≈9.3 stays clear. */}
      <EditableFurniture id="east-lower-bed" editing={furnitureEditing} x={10.5} z={10.7} base={base}>
        <QueenBed base={base} palette={palette} x={10.5} z={10.7} along="z" headToward="+" />
      </EditableFurniture>

      <EditableFurniture id="east-lower-nightstand" editing={furnitureEditing} x={9.45} z={11.55} base={base}>
        <Nightstand base={base} palette={palette} x={9.45} z={11.55} />
      </EditableFurniture>

      {/* Dresser on south wall, west of bed foot clearance. */}
      <EditableFurniture id="east-lower-dresser" editing={furnitureEditing} x={8.5} z={11.75} base={base}>
        <Dresser base={base} palette={palette} x={8.5} z={11.75} along="x" />
      </EditableFurniture>
    </group>
  );
}
