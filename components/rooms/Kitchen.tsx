"use client";
import { Blk } from "./shared";
import type { Palette } from "./shared";
import { BarStool, Cooktop, FURN, Pendant, PotPlant } from "./furniture";

/**
 * Kitchen — measured north bay.
 * East wall: window north (~z 0.25–1.45), main entry further south (~z 2.65–3.65).
 * Cabinetry clears both openings.
 */
export function Kitchen({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      {/* North run — under north bay window. */}
      <Blk x={5.7} z={0.55} y={base} w={3.6} d={0.65} h={0.9} material={palette.oak} />
      <Blk x={5.7} z={0.55} y={base + 0.9} w={3.6} d={0.66} h={0.04} material={palette.stone} />

      {/* East stub — only between window and entry (clears both). */}
      <Blk x={7.25} z={1.95} y={base} w={0.5} d={0.55} h={0.9} material={palette.oak} />

      {/* Island — pulled west of east entry path. */}
      <Blk x={5.15} z={2.2} y={base} w={1.9} d={0.95} h={0.92} material={palette.oak} />
      <Blk x={5.15} z={2.2} y={base + 0.92} w={2.0} d={1.05} h={0.05} material={palette.stone} />

      <Blk
        x={4.05}
        z={0.6}
        y={base}
        w={FURN.fridge.w}
        d={FURN.fridge.d}
        h={FURN.fridge.h}
        material={palette.charcoal}
      />

      <Cooktop base={base} palette={palette} x={6.2} z={0.55} />

      <BarStool base={base} palette={palette} x={3.95} z={1.9} />
      <BarStool base={base} palette={palette} x={3.95} z={2.5} />

      <Pendant base={base} palette={palette} x={5.15} z={2.2} />
      <PotPlant base={base} palette={palette} x={6.85} z={1.55} scale={0.7} />
    </group>
  );
}
