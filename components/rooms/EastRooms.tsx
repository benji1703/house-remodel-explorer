"use client";
import type { Palette } from "./shared";
import { EditableFurniture, type FurnitureEditingState } from "./EditableFurniture";
import { BedsideLamp, Dresser, FURN, LoungeChair, Nightstand, QueenBed, Wardrobe } from "./furniture";

/**
 * East bedrooms — queen 160×200.
 * West doors at z≈6.8 (E1) / 9.3 (E2) — beds on east wall so leaves stay clear.
 * Envelopes: E1 x∈[7.6,11.4] z∈[5.0,8.55]; E2 x∈[7.6,11.4] z∈[8.55,12.1].
 */
export function EastUpperRoom({
  base,
  palette,
  furnitureEditing,
  nightFactor = 0,
}: {
  base: number;
  palette: Palette;
  furnitureEditing: FurnitureEditingState;
  nightFactor?: number;
}) {
  return (
    <group>
      {/* Rotated east–west; the west entry and east/north glazing stay clear. */}
      <EditableFurniture id="east-upper-bed" editing={furnitureEditing} x={10.15} z={6.55} base={base} swapPlanAxes>
        <QueenBed base={base} palette={palette} x={10.15} z={6.55} along="x" headToward="+" />
      </EditableFurniture>

      <EditableFurniture id="east-upper-nightstand" editing={furnitureEditing} x={10.7} z={7.62} base={base}>
        <Nightstand base={base} palette={palette} x={10.7} z={7.62} />
      </EditableFurniture>
      <BedsideLamp base={base + FURN.nightstand.h} x={10.7} z={7.62} nightFactor={nightFactor} />

      <Wardrobe base={base} palette={palette} x={9.85} z={8.2} along="x" width={2.7} />

      {/* Chair in the free north-west corner, away from the wardrobe. */}
      <EditableFurniture id="east-upper-chair" editing={furnitureEditing} x={8.35} z={5.65} base={base}>
        <LoungeChair base={base} palette={palette} x={8.35} z={5.65} face="s" />
      </EditableFurniture>
    </group>
  );
}

export function EastLowerRoom({
  base,
  palette,
  furnitureEditing,
  nightFactor = 0,
}: {
  base: number;
  palette: Palette;
  furnitureEditing: FurnitureEditingState;
  nightFactor?: number;
}) {
  return (
    <group>
      {/* Rotated east–west; headboard remains on the solid east side. */}
      <EditableFurniture id="east-lower-bed" editing={furnitureEditing} x={10.15} z={10.7} base={base} swapPlanAxes>
        <QueenBed base={base} palette={palette} x={10.15} z={10.7} along="x" headToward="+" />
      </EditableFurniture>

      <EditableFurniture id="east-lower-nightstand" editing={furnitureEditing} x={10.7} z={11.72} base={base}>
        <Nightstand base={base} palette={palette} x={10.7} z={11.72} />
      </EditableFurniture>
      <BedsideLamp base={base + FURN.nightstand.h} x={10.7} z={11.72} nightFactor={nightFactor} />

      <Wardrobe base={base} palette={palette} x={9.85} z={8.9} along="x" width={2.7} />

      {/* Dresser on south wall, west of bed foot clearance. */}
      <EditableFurniture id="east-lower-dresser" editing={furnitureEditing} x={8.5} z={11.75} base={base}>
        <Dresser base={base} palette={palette} x={8.5} z={11.75} along="x" />
      </EditableFurniture>
    </group>
  );
}
