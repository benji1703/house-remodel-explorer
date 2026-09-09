"use client";
import type { Palette } from "./shared";
import { EditableFurniture, type FurnitureEditingState } from "./EditableFurniture";
import { BedsideLamp, FURN, Nightstand, Pendant, QueenBed } from "./furniture";
import { ArtTV, BedroomRug, DraperyPair } from "./LuxuryDetails";

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
      <BedroomRug base={base} x={1.7} z={10.78} w={2.72} d={2.74} />
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

      <ArtTV base={base} x={3.285} z={10.32} wall="east" width={1.08} height={0.64} />
      <DraperyPair base={base} x={1.72} z={12.0} wall="south" span={1.5} />
      <Pendant base={base} palette={palette} x={1.7} z={10.95} />
    </group>
  );
}
