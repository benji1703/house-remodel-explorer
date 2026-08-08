"use client";
import { Blk, Cyl, Prop } from "./shared";
import type { Palette } from "./shared";
import { designAssumptions } from "@/data/house";

export function Terrace({ palette, quality }: { palette: Palette; quality: "high" | "light" }) {
  const slats = quality === "high" ? 15 : 8;
  const vines = quality === "high" ? 11 : 5;
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
        <Blk key={`${x}-${z}`} x={x} z={z} y={0.08} w={0.14} d={0.14} h={2.5} material={palette.timber} />
      ))}
      <Blk x={0.55} z={5.9} y={designAssumptions.pergola.heightCm / 100 - 0.18} w={0.14} d={4.2} h={0.18} material={palette.timber} />
      <Blk x={3.1} z={5.9} y={designAssumptions.pergola.heightCm / 100 - 0.18} w={0.14} d={4.2} h={0.18} material={palette.timber} />
      {Array.from({ length: slats }, (_, index) => (
        <Blk
          key={index}
          x={1.83}
          z={3.9 + (index * 4.0) / (slats - 1)}
          y={designAssumptions.pergola.heightCm / 100}
          w={2.9}
          d={0.09}
          h={0.14}
          material={palette.timber}
        />
      ))}
      {Array.from({ length: vines }, (_, index) => {
        const z = 4.1 + (index * 3.6) / (vines - 1);
        const x = index % 2 === 0 ? 0.6 : 3.05;
        const radius = 0.24 + ((index * 7) % 5) * 0.035;
        return (
          <mesh
            key={`vine-${index}`}
            position={[x - 5.7, designAssumptions.pergola.heightCm / 100 + 0.02, z - 6.05]}
            material={palette.vine}
            castShadow
          >
            <icosahedronGeometry args={[radius, 0]} />
          </mesh>
        );
      })}

      {/* Real trees — closest Mediterranean-style stand-in available in the
          free CC0 catalog; no exact olive tree exists there. Decorative
          landscaping only, not measured/approved geometry. */}
      <Prop slug="island_tree_01" x={0.95} z={3.4} y={0} scale={1.1} />
      <Prop slug="island_tree_01" x={2.9} z={8.4} y={0} rotationY={Math.PI / 3} scale={0.95} />

      {/* Outdoor seating and planters. */}
      <Prop slug="outdoor_table_chair_set_01" x={1.8} z={6.3} y={0} />
      <Prop slug="planter_box_01" x={0.5} z={5.0} y={0} />
      <Prop slug="planter_box_01" x={3.15} z={5.0} y={0} rotationY={Math.PI} />
    </group>
  );
}
