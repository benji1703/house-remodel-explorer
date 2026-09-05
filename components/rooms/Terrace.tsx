"use client";
import { Blk } from "./shared";
import type { Palette } from "./shared";
import { designAssumptions } from "@/data/house";
import { EditableFurniture, type FurnitureEditingState } from "./EditableFurniture";
import { DiningSet, FoliageCluster, PlanterBox, PotPlant } from "./furniture";
import { DecorTray } from "./LuxuryDetails";

/** Terrace / pergola — timber structure + basic outdoor furniture (no weird GLBs). */
export function Terrace({ palette, quality, furnitureEditing }: { palette: Palette; quality: "high" | "light"; furnitureEditing: FurnitureEditingState }) {
  const pergolaH = designAssumptions.pergola.heightCm / 100;
  const slats = quality === "high" ? 13 : 7;
  const vines = quality === "high" ? 7 : 4;
  const posts: Array<[number, number]> = [
    [0.55, 4.0],
    [3.1, 4.0],
    [0.55, 7.8],
    [3.1, 7.8],
  ];
  return (
    <group>
      <Blk x={1.8} z={5.9} y={0} w={3.2} d={5.0} h={0.08} material={palette.stone} />

      {posts.map(([x, z]) => (
        <Blk key={`${x}-${z}`} x={x} z={z} y={0.08} w={0.14} d={0.14} h={pergolaH - 0.08} material={palette.timber} />
      ))}
      <Blk x={0.55} z={5.9} y={pergolaH - 0.14} w={0.12} d={4.2} h={0.14} material={palette.timber} />
      <Blk x={3.1} z={5.9} y={pergolaH - 0.14} w={0.12} d={4.2} h={0.14} material={palette.timber} />
      {Array.from({ length: slats }, (_, index) => (
        <Blk
          key={index}
          x={1.83}
          z={3.9 + (index * 4.0) / (slats - 1)}
          y={pergolaH}
          w={2.9}
          d={0.055}
          h={0.095}
          material={palette.timber}
        />
      ))}

      {Array.from({ length: vines }, (_, index) => {
        const t = index / Math.max(vines - 1, 1);
        const z = 4.05 + t * 3.7;
        const x = index % 3 === 0 ? 0.6 : 3.05;
        return (
          <FoliageCluster
            key={`vine-${index}`}
            x={x}
            y={pergolaH - 0.12}
            z={z}
            scale={quality === "high" ? 0.88 + (index % 3) * 0.1 : 0.72}
            palette={palette}
          />
        );
      })}

      <EditableFurniture id="terrace-dining-set" editing={furnitureEditing} x={1.85} z={6.0} base={0}>
        <DiningSet base={0} palette={palette} x={1.85} z={6.0} />
      </EditableFurniture>
      <DecorTray base={0.77} palette={palette} x={1.85} z={6.0} />
      <PlanterBox base={0} palette={palette} x={0.45} z={5.1} />
      <PlanterBox base={0} palette={palette} x={0.45} z={6.7} />
      <PotPlant base={0} palette={palette} x={0.45} z={3.7} scale={1.15} />
      <PotPlant base={0} palette={palette} x={3.15} z={8.0} scale={1.05} />
    </group>
  );
}
