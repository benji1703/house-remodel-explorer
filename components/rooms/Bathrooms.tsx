"use client";
import { Blk, Cyl, Prop } from "./shared";
import type { Palette } from "./shared";

function BathroomFixtures({
  base,
  palette,
  vanity,
  toilet,
  shower,
}: {
  base: number;
  palette: Palette;
  vanity: { x: number; z: number; w: number };
  toilet: { x: number; z: number };
  shower?: { x: number; z: number };
}) {
  return (
    <group>
      <Blk x={vanity.x} z={vanity.z} y={base} w={vanity.w} d={0.48} h={0.82} material={palette.oak} />
      <Blk x={vanity.x} z={vanity.z} y={base + 0.82} w={vanity.w} d={0.5} h={0.04} material={palette.stone} />
      <Cyl x={vanity.x} z={vanity.z} y={base + 0.86} r={0.19} h={0.12} material={palette.stone} />
      <Blk x={toilet.x} z={toilet.z} y={base} w={0.38} d={0.6} h={0.4} material={palette.stone} />
      <Blk x={toilet.x} z={toilet.z + 0.34} y={base} w={0.38} d={0.16} h={0.78} material={palette.stone} />
      {shower && <Blk x={shower.x} z={shower.z} y={base} w={0.9} d={0.9} h={0.05} material={palette.stone} />}
    </group>
  );
}

export function MainBathroom({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      <BathroomFixtures
        base={base}
        palette={palette}
        vanity={{ x: 6.2, z: 11.8, w: 1.6 }}
        toilet={{ x: 5.25, z: 10.65 }}
        shower={{ x: 7.05, z: 10.75 }}
      />
      <Prop slug="ornate_mirror_01" x={6.2} z={12.05} y={base + 1.1} scale={0.6} />
    </group>
  );
}

export function EnsuiteBathroom({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      <BathroomFixtures
        base={base}
        palette={palette}
        vanity={{ x: 4.15, z: 11.8, w: 1.1 }}
        toilet={{ x: 3.8, z: 10.65 }}
      />
      <Prop slug="ornate_mirror_01" x={4.15} z={12.05} y={base + 1.1} scale={0.5} />
    </group>
  );
}
