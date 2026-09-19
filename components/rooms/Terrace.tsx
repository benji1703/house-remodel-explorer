"use client";
import { Blk, Cyl, SoftBox, type Palette } from "./shared";
import { designAssumptions } from "@/data/house";
import { EditableFurniture, type FurnitureEditingState } from "./EditableFurniture";
import { PlanterBox, PotPlant } from "./furniture";
import { DecorTray } from "./LuxuryDetails";
import { terraceCushionMaterial, terraceIronMaterial, terraceStoneMaterial } from "./terraceMaterials";
import { terraceFurnitureSpec } from "@/data/terraceFurniture";

function TerraceChair({ x, z, base, rotation = 0 }: { x: number; z: number; base: number; rotation?: number }) {
  const c = terraceFurnitureSpec.chair;
  return (
    <group position={[x - 5.7, 0, z - 6.05]} rotation-y={rotation}>
      {/* Local coordinates keep every frame member attached to its seat while
          rotating side chairs around the table. */}
      <SoftBox x={5.7} z={6.05} y={base + c.seatHeightCm / 100} w={c.widthCm / 100} d={c.depthCm / 100} h={c.cushionCm / 100} radius={0.055} material={terraceCushionMaterial} />
      <SoftBox x={5.7} z={6.20} y={base + 0.49} w={0.38} d={0.055} h={0.055} radius={0.018} material={terraceIronMaterial} />
      {[-1, 1].map((side) => <SoftBox key={`rail-${side}`} x={5.7 + side * 0.17} z={6.22} y={base + 0.52} w={0.045} d={0.055} h={0.38} radius={0.018} material={terraceIronMaterial} />)}
      <SoftBox x={5.7} z={6.22} y={base + 0.84} w={0.38} d={0.055} h={0.055} radius={0.02} material={terraceIronMaterial} />
      <SoftBox x={5.7} z={6.205} y={base + 0.57} w={0.30} d={0.07} h={0.25} radius={0.035} material={terraceCushionMaterial} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Cyl key={`${sx}-${sz}`} x={5.7 + sx * 0.17} z={6.05 + sz * 0.18} y={base} r={0.018} h={0.45} segments={12} material={terraceIronMaterial} />))}
    </group>
  );
}

function TerraceDiningSet({ base, x, z }: { base: number; x: number; z: number }) {
  const t = terraceFurnitureSpec.table;
  const tw = t.widthCm / 100, td = t.depthCm / 100, th = t.heightCm / 100;
  return (
    <group>
      <SoftBox x={x} z={z} y={base + th - t.topCm / 100} w={tw} d={td} h={t.topCm / 100} radius={0.07} material={terraceStoneMaterial} />
      <SoftBox x={x} z={z} y={base} w={t.pedestalWidthCm / 100} d={0.48} h={th - t.topCm / 100} radius={0.055} material={terraceStoneMaterial} />
      <SoftBox x={x} z={z} y={base + 0.05} w={0.72} d={0.62} h={0.07} radius={0.025} material={terraceStoneMaterial} />
      <SoftBox x={x} z={z} y={base + th - 0.015} w={1.34} d={0.7} h={0.018} radius={0.012} material={terraceStoneMaterial} />
      <TerraceChair base={base} x={x} z={z - 0.70} rotation={Math.PI} />
      <TerraceChair base={base} x={x} z={z + 0.70} />
      <TerraceChair base={base} x={x - 1.07} z={z} rotation={-Math.PI / 2} />
      <TerraceChair base={base} x={x + 1.07} z={z} rotation={Math.PI / 2} />
    </group>
  );
}

/** Terrace / pergola — timber structure + basic outdoor furniture (no weird GLBs). */
export function Terrace({ palette, quality, furnitureEditing }: { palette: Palette; quality: "high" | "light"; furnitureEditing: FurnitureEditingState }) {
  const pergolaH = designAssumptions.pergola.heightCm / 100;
  const slats = quality === "high" ? 13 : 7;
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

      <EditableFurniture id="terrace-dining-set" editing={furnitureEditing} x={1.85} z={6.0} base={0.08}>
        <TerraceDiningSet base={0.08} x={1.85} z={6.0} />
      </EditableFurniture>
      <DecorTray base={0.83} palette={palette} x={1.85} z={6.0} />
      <PlanterBox base={0.08} palette={palette} x={0.45} z={5.1} />
      <PlanterBox base={0.08} palette={palette} x={0.45} z={6.7} />
      <PotPlant base={0.08} palette={palette} x={0.45} z={3.7} scale={1.15} />
      <PotPlant base={0.08} palette={palette} x={3.15} z={8.0} scale={1.05} />
    </group>
  );
}
