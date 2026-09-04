"use client";
import type { Palette } from "./shared";
import { EditableFurniture, type FurnitureEditingState } from "./EditableFurniture";
import { BedsideLamp, FURN, Nightstand, Pendant, QueenBed } from "./furniture";

/**
 * Master bedroom — queen bed (160×200) against south wall.
 * West wall: remodel exit door to private boho pergola patio.
 * Zone x∈[0,3.4] z∈[8.3,12.1].
 */
export function MasterBedroom({
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
      {/* Queen centred on width; head against south wall. */}
      <EditableFurniture id="master-bed" editing={furnitureEditing} x={1.7} z={10.95} base={base}>
        <QueenBed base={base} palette={palette} x={1.7} z={10.95} along="z" headToward="+" />
      </EditableFurniture>

      <EditableFurniture id="master-nightstand-west" editing={furnitureEditing} x={0.55} z={11.55} base={base}>
        <Nightstand base={base} palette={palette} x={0.55} z={11.55} />
      </EditableFurniture>
      <EditableFurniture id="master-nightstand-east" editing={furnitureEditing} x={2.85} z={11.55} base={base}>
        <Nightstand base={base} palette={palette} x={2.85} z={11.55} />
      </EditableFurniture>

      <BedsideLamp base={base + FURN.nightstand.h} x={0.55} z={11.55} nightFactor={nightFactor} />
      <BedsideLamp base={base + FURN.nightstand.h} x={2.85} z={11.55} nightFactor={nightFactor} />

      <Pendant base={base} palette={palette} x={1.7} z={10.95} />
    </group>
  );
}
