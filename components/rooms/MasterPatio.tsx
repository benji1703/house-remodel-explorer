"use client";
import { Blk } from "./shared";
import type { Palette } from "./shared";
import { designAssumptions } from "@/data/house";
import { EditableFurniture, type FurnitureEditingState } from "./EditableFurniture";
import { FoliageCluster, LoungeChair, PlanterBox, PotPlant } from "./furniture";
import { SideTable } from "./LuxuryDetails";

/**
 * Private master patio — easy boho timber pergola west of the bedroom.
 * Outside the measured footprint; atmosphere only (not surveyed).
 * Zone roughly x∈[-2.5,-0.1] z∈[8.5,11.5].
 */
export function MasterPatio({
  palette,
  quality,
  furnitureEditing,
}: {
  palette: Palette;
  quality: "high" | "light";
  furnitureEditing: FurnitureEditingState;
}) {
  const w = designAssumptions.masterPergola.widthCm / 100;
  const d = designAssumptions.masterPergola.depthCm / 100;
  const h = designAssumptions.masterPergola.heightCm / 100;
  // Deck centre just west of master west wall (x=0).
  const cx = -w / 2 - 0.38;
  const cz = 10.0;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const z0 = cz - d / 2;
  const z1 = cz + d / 2;

  const reedCount = quality === "high" ? 16 : 9;
  const fabricCount = quality === "high" ? 3 : 2;
  const posts: Array<[number, number]> = [
    [x0 + 0.12, z0 + 0.12],
    [x1 - 0.12, z0 + 0.12],
    [x0 + 0.12, z1 - 0.12],
    [x1 - 0.12, z1 - 0.12],
  ];

  return (
    <group>
      {/* Timber deck planks feel — single slab stand-in */}
      <Blk x={cx} z={cz} y={0} w={w} d={d} h={0.06} material={palette.timber} />

      {/* Round-ish rustic posts (square, slightly thick) */}
      {posts.map(([x, z]) => (
        <Blk key={`mp-${x}-${z}`} x={x} z={z} y={0.06} w={0.16} d={0.16} h={h - 0.06} material={palette.timber} />
      ))}

      {/* Perimeter beams */}
      <Blk x={cx} z={z0 + 0.12} y={h - 0.16} w={w - 0.1} d={0.14} h={0.14} material={palette.timber} />
      <Blk x={cx} z={z1 - 0.12} y={h - 0.16} w={w - 0.1} d={0.14} h={0.14} material={palette.timber} />
      <Blk x={x0 + 0.12} z={cz} y={h - 0.16} w={0.14} d={d - 0.1} h={0.14} material={palette.timber} />
      <Blk x={x1 - 0.12} z={cz} y={h - 0.16} w={0.14} d={d - 0.1} h={0.14} material={palette.timber} />

      {/* Dense reed / bamboo-style roof — thin irregular slats */}
      {Array.from({ length: reedCount }, (_, i) => {
        const t = i / Math.max(reedCount - 1, 1);
        const jitter = ((i * 17) % 7) * 0.008 - 0.02;
        return (
          <Blk
            key={`reed-${i}`}
            x={cx}
            z={z0 + 0.18 + t * (d - 0.36) + jitter}
            y={h}
            w={w - 0.28}
            d={0.045}
            h={0.05}
            material={palette.timber}
          />
        );
      })}

      {/* Soft canvas shade strips — casual boho hang */}
      {Array.from({ length: fabricCount }, (_, i) => {
        const t = (i + 0.5) / fabricCount;
        return (
          <Blk
            key={`shade-${i}`}
            x={x0 + 0.35 + t * (w - 0.7)}
            z={cz}
            y={h - 0.35}
            w={0.28}
            d={d - 0.5}
            h={0.02}
            material={palette.upholstery}
          />
        );
      })}

      {/* Light greenery + lounge */}
      <EditableFurniture id="master-patio-chair" editing={furnitureEditing} x={cx - 0.35} z={cz + 0.4} base={0.06} swapPlanAxes>
        <LoungeChair base={0.06} palette={palette} x={cx - 0.35} z={cz + 0.4} face="e" />
      </EditableFurniture>
      <SideTable base={0.06} palette={palette} x={cx + 0.48} z={cz + 0.42} />
      <PlanterBox base={0.06} palette={palette} x={x0 + 0.35} z={z0 + 0.45} />
      <PlanterBox base={0.06} palette={palette} x={x0 + 0.35} z={z1 - 0.45} />
      {/* Keep the west exit landing clear for the door leaf and first step. */}
      <PotPlant base={0.06} palette={palette} x={x1 - 0.35} z={z1 - 0.4} scale={0.95} />

      {quality === "high" &&
        [0, 1, 2].map((i) => {
          const px = i % 2 === 0 ? x0 + 0.14 : x1 - 0.14;
          const pz = z0 + 0.5 + i * 0.7;
          return (
            <FoliageCluster
              key={`vine-${i}`}
              x={px}
              y={h * 0.55}
              z={pz}
              scale={0.9 + (i % 3) * 0.12}
              palette={palette}
            />
          );
        })}
    </group>
  );
}
