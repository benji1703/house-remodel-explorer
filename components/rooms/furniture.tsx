"use client";

import * as THREE from "three";
import { Blk, Cyl, CX, CZ, SoftBox } from "./shared";
import type { Palette } from "./shared";

/**
 * Furniture sizing — Israeli / European residential standards.
 * Queen mattress is the bedroom reference for every bed in the house.
 */
export const FURN = {
  /** Queen mattress — sizing reference for all beds. */
  queen: { w: 1.6, d: 2.0, h: 0.55, mattress: 0.22 },
  nightstand: { w: 0.45, d: 0.4, h: 0.55 },
  wardrobe: { w: 1.8, d: 0.6, h: 2.1 },
  dresser: { w: 1.2, d: 0.5, h: 0.85 },
  sofa3: { w: 2.2, d: 0.9, h: 0.75, back: 0.4 },
  lounge: { w: 0.85, d: 0.9, h: 0.7, back: 0.4 },
  coffee: { w: 1.2, d: 0.7, h: 0.4 },
  stool: { w: 0.4, d: 0.4, h: 0.7 },
  fridge: { w: 0.7, d: 0.7, h: 1.9 },
  hob: { w: 0.6, d: 0.55, h: 0.04 },
  oven: { w: 0.6, d: 0.6, h: 0.7 },
  pendant: { r: 0.18, h: 0.28 },
  diningTable: { w: 1.6, d: 0.85, h: 0.75 },
  diningChair: { w: 0.45, d: 0.5, h: 0.45, back: 0.4 },
  planter: { w: 0.7, d: 0.35, h: 0.4 },
  pot: { r: 0.22, h: 0.35, plant: 0.45 },
  rug: { h: 0.015 },
} as const;

function Cabinet({
  base,
  palette,
  x,
  z,
  w,
  d,
  h,
  fronts = 1,
  frontAxis = "z",
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  fronts?: number;
  frontAxis?: "x" | "z";
}) {
  return (
    <group>
      <SoftBox x={x} z={z} y={base + 0.06} w={w} d={d} h={h - 0.06} radius={0.025} material={palette.oak} />
      {Array.from({ length: fronts }, (_, index) => {
        const frontW = frontAxis === "z" ? w / fronts - 0.018 : 0.018;
        const frontD = frontAxis === "x" ? d / fronts - 0.018 : 0.018;
        const frontX = frontAxis === "z" ? x - w / 2 + w / fronts * (index + 0.5) : x - w / 2 - 0.006;
        const frontZ = frontAxis === "x" ? z - d / 2 + d / fronts * (index + 0.5) : z - d / 2 - 0.006;
        const handleX = frontAxis === "z" ? frontX + frontW * 0.32 : x - w / 2 - 0.025;
        const handleZ = frontAxis === "x" ? frontZ + frontD * 0.32 : z - d / 2 - 0.025;
        return (
          <group key={index}>
            <SoftBox x={frontX} z={frontZ} y={base + 0.11} w={frontW} d={frontD} h={h - 0.2} radius={0.007} material={palette.oak} />
            <Cyl x={handleX} z={handleZ} y={base + h * 0.48} r={0.009} h={0.08} material={palette.frame} />
          </group>
        );
      })}
    </group>
  );
}

/** Queen bed: platform + mattress + low headboard. `along` = long axis on plan. */
export function QueenBed({
  base,
  palette,
  x,
  z,
  along = "z",
  headToward = "+",
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
  /** Which plan axis the 2.0 m length runs along. */
  along?: "x" | "z";
  /** Headboard on the − or + end of that axis. */
  headToward?: "+" | "-";
}) {
  const { w, d, h, mattress } = FURN.queen;
  const planW = along === "z" ? w : d;
  const planD = along === "z" ? d : w;
  const headOnZ = along === "z";
  const sign = headToward === "+" ? 1 : -1;
  const headX = headOnZ ? x : x + sign * (planW / 2 - 0.04);
  const headZ = headOnZ ? z + sign * (planD / 2 - 0.04) : z;
  const headW = headOnZ ? planW : 0.08;
  const headD = headOnZ ? 0.08 : planD;

  return (
    <group>
      <SoftBox x={x} z={z} y={base + 0.07} w={planW} d={planD} h={h - mattress - 0.04} radius={0.055} material={palette.oak} />
      <SoftBox x={x} z={z} y={base + h - mattress} w={planW - 0.05} d={planD - 0.05} h={mattress} radius={0.075} material={palette.upholstery} />
      <SoftBox x={headX} z={headZ} y={base + 0.12} w={headW} d={headD} h={0.72} radius={0.035} material={palette.oak} />
      {headOnZ ? (
        <>
          <SoftBox x={x - 0.38} z={z + sign * (planD / 2 - 0.34)} y={base + h} w={0.58} d={0.3} h={0.11} radius={0.055} material={palette.upholstery} />
          <SoftBox x={x + 0.38} z={z + sign * (planD / 2 - 0.34)} y={base + h} w={0.58} d={0.3} h={0.11} radius={0.055} material={palette.upholstery} />
        </>
      ) : (
        <>
          <SoftBox x={x + sign * (planW / 2 - 0.34)} z={z - 0.38} y={base + h} w={0.3} d={0.58} h={0.11} radius={0.055} material={palette.upholstery} />
          <SoftBox x={x + sign * (planW / 2 - 0.34)} z={z + 0.38} y={base + h} w={0.3} d={0.58} h={0.11} radius={0.055} material={palette.upholstery} />
        </>
      )}
    </group>
  );
}

export function Nightstand({
  base,
  palette,
  x,
  z,
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
}) {
  const { w, d, h } = FURN.nightstand;
  return <Cabinet base={base} palette={palette} x={x} z={z} w={w} d={d} h={h} />;
}

export function Wardrobe({
  base,
  palette,
  x,
  z,
  along = "z",
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
  along?: "x" | "z";
}) {
  const { w, d, h } = FURN.wardrobe;
  const planW = along === "z" ? d : w;
  const planD = along === "z" ? w : d;
  return <Cabinet base={base} palette={palette} x={x} z={z} w={planW} d={planD} h={h} fronts={3} frontAxis={along === "z" ? "x" : "z"} />;
}

export function Dresser({
  base,
  palette,
  x,
  z,
  along = "z",
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
  along?: "x" | "z";
}) {
  const { w, d, h } = FURN.dresser;
  const planW = along === "z" ? d : w;
  const planD = along === "z" ? w : d;
  return <Cabinet base={base} palette={palette} x={x} z={z} w={planW} d={planD} h={h} fronts={2} frontAxis={along === "z" ? "x" : "z"} />;
}

/** Sofa: seat + back. `face` = direction the sitter looks (into the room). */
export function Sofa({
  base,
  palette,
  x,
  z,
  face = "w",
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
  face?: "n" | "s" | "e" | "w";
}) {
  const { w, d, h } = FURN.sofa3;
  const alongNS = face === "e" || face === "w";
  const planW = alongNS ? d : w;
  const planD = alongNS ? w : d;
  const backOff =
    face === "w" ? { x: planW / 2 - 0.08, z: 0 } :
    face === "e" ? { x: -(planW / 2 - 0.08), z: 0 } :
    face === "n" ? { x: 0, z: planD / 2 - 0.08 } :
    { x: 0, z: -(planD / 2 - 0.08) };
  const backW = alongNS ? 0.16 : planW;
  const backD = alongNS ? planD : 0.16;
  const cushionW = alongNS ? planW - 0.18 : planW * 0.46;
  const cushionD = alongNS ? planD * 0.46 : planD - 0.18;

  return (
    <group>
      <SoftBox x={x} z={z} y={base + 0.14} w={planW} d={planD} h={0.3} radius={0.09} material={palette.upholstery} />
      <SoftBox
        x={x + backOff.x}
        z={z + backOff.z}
        y={base + 0.25}
        w={backW}
        d={backD}
        h={h - 0.18}
        radius={0.07}
        material={palette.upholstery}
      />
      {[-1, 1].map((side) => (
        <SoftBox
          key={`cushion-${side}`}
          x={x + (alongNS ? 0 : side * planW * 0.235)}
          z={z + (alongNS ? side * planD * 0.235 : 0)}
          y={base + 0.43}
          w={cushionW}
          d={cushionD}
          h={0.12}
          radius={0.055}
          material={palette.upholstery}
        />
      ))}
      {[-1, 1].map((side) => (
        <SoftBox
          key={`arm-${side}`}
          x={x + (alongNS ? 0 : side * (planW / 2 - 0.085))}
          z={z + (alongNS ? side * (planD / 2 - 0.085) : 0)}
          y={base + 0.22}
          w={alongNS ? planW - 0.08 : 0.17}
          d={alongNS ? 0.17 : planD - 0.08}
          h={0.42}
          radius={0.07}
          material={palette.upholstery}
        />
      ))}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <Cyl
          key={`leg-${sx}-${sz}`}
          x={x + sx * (planW / 2 - 0.13)}
          z={z + sz * (planD / 2 - 0.13)}
          y={base}
          r={0.025}
          h={0.16}
          material={palette.frame}
          segments={16}
        />
      )))}
    </group>
  );
}

export function LoungeChair({
  base,
  palette,
  x,
  z,
  face = "n",
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
  face?: "n" | "s" | "e" | "w";
}) {
  const { w, d, h } = FURN.lounge;
  const alongNS = face === "e" || face === "w";
  const planW = alongNS ? d : w;
  const planD = alongNS ? w : d;
  const backOff =
    face === "w" ? { x: planW / 2 - 0.08, z: 0 } :
    face === "e" ? { x: -(planW / 2 - 0.08), z: 0 } :
    face === "n" ? { x: 0, z: planD / 2 - 0.08 } :
    { x: 0, z: -(planD / 2 - 0.08) };
  const backW = alongNS ? 0.14 : planW;
  const backD = alongNS ? planD : 0.14;

  return (
    <group>
      <SoftBox x={x} z={z} y={base + 0.17} w={planW - 0.08} d={planD - 0.08} h={0.24} radius={0.08} material={palette.upholstery} />
      <SoftBox
        x={x + backOff.x}
        z={z + backOff.z}
        y={base + 0.26}
        w={backW}
        d={backD}
        h={h - 0.12}
        radius={0.07}
        material={palette.upholstery}
      />
      {[-1, 1].map((side) => (
        <SoftBox
          key={side}
          x={x + (alongNS ? 0 : side * (planW / 2 - 0.07))}
          z={z + (alongNS ? side * (planD / 2 - 0.07) : 0)}
          y={base + 0.2}
          w={alongNS ? planW - 0.05 : 0.13}
          d={alongNS ? 0.13 : planD - 0.05}
          h={0.35}
          radius={0.055}
          material={palette.upholstery}
        />
      ))}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <Cyl
          key={`leg-${sx}-${sz}`}
          x={x + sx * (planW / 2 - 0.13)}
          z={z + sz * (planD / 2 - 0.13)}
          y={base}
          r={0.022}
          h={0.19}
          material={palette.frame}
          segments={16}
        />
      )))}
    </group>
  );
}

export function CoffeeTable({
  base,
  palette,
  x,
  z,
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
}) {
  const { w, d, h } = FURN.coffee;
  return (
    <group>
      <SoftBox x={x} z={z} y={base + h - 0.09} w={w} d={d} h={0.09} radius={0.045} material={palette.stone} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <Cyl
          key={`${sx}-${sz}`}
          x={x + sx * (w / 2 - 0.15)}
          z={z + sz * (d / 2 - 0.14)}
          y={base}
          r={0.035}
          h={h - 0.09}
          segments={18}
          material={palette.frame}
        />
      )))}
    </group>
  );
}

export function BarStool({
  base,
  palette,
  x,
  z,
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
}) {
  const { w, d, h } = FURN.stool;
  return (
    <group>
      <Cyl x={x} z={z} y={base} r={0.035} h={h - 0.08} material={palette.frame} segments={20} />
      <Cyl x={x} z={z} y={base + 0.21} r={0.16} h={0.018} material={palette.frame} segments={24} />
      <SoftBox x={x} z={z} y={base + h - 0.08} w={w} d={d} h={0.08} radius={0.04} material={palette.oak} />
    </group>
  );
}

export function Pendant({
  base,
  palette,
  x,
  z,
  y = 2.3,
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
  y?: number;
}) {
  const { r, h } = FURN.pendant;
  return (
    <group>
      <mesh position={[x - CX, base + y + 0.2, z - CZ]} material={palette.frame}>
        <cylinderGeometry args={[0.008, 0.008, 0.4, 16]} />
      </mesh>
      <mesh position={[x - CX, base + y - h / 2, z - CZ]} material={palette.frame} castShadow>
        <cylinderGeometry args={[r * 0.5, r, h, 32, 1, true]} />
      </mesh>
      <mesh position={[x - CX, base + y - h + 0.025, z - CZ]} material={palette.upholstery}>
        <sphereGeometry args={[r * 0.22, 24, 16]} />
      </mesh>
    </group>
  );
}

export function Cooktop({
  base,
  palette,
  x,
  z,
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
}) {
  const { w, d, h } = FURN.hob;
  return (
    <group>
      <SoftBox x={x} z={z} y={base} w={w} d={d} h={h} radius={0.018} material={palette.charcoal} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <group key={`${sx}-${sz}`} position={[x - CX + sx * 0.16, base + h + 0.008, z - CZ + sz * 0.14]}>
          <mesh rotation-x={Math.PI / 2} material={palette.frame}>
            <torusGeometry args={[sx === sz ? 0.085 : 0.07, 0.008, 8, 24]} />
          </mesh>
          <mesh material={palette.frame}>
            <boxGeometry args={[0.19, 0.012, 0.018]} />
          </mesh>
          <mesh rotation-y={Math.PI / 2} material={palette.frame}>
            <boxGeometry args={[0.19, 0.012, 0.018]} />
          </mesh>
        </group>
      )))}
      {[-0.18, -0.06, 0.06, 0.18].map((offset) => (
        <Cyl key={offset} x={x + offset} z={z + d * 0.38} y={base + h} r={0.018} h={0.018} segments={16} material={palette.frame} />
      ))}
    </group>
  );
}

function StemBetween({
  from,
  to,
  radius,
  material,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius: number;
  material: THREE.Material;
}) {
  const start = new THREE.Vector3(from[0] - CX, from[1], from[2] - CZ);
  const end = new THREE.Vector3(to[0] - CX, to[1], to[2] - CZ);
  const direction = end.clone().sub(start);
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );

  return (
    <mesh position={midpoint} quaternion={quaternion} material={material} castShadow>
      <cylinderGeometry args={[radius * 0.72, radius, direction.length(), 10]} />
    </mesh>
  );
}

export function FoliageCluster({
  palette,
  x,
  y,
  z,
  scale = 1,
}: {
  palette: Palette;
  x: number;
  y: number;
  z: number;
  scale?: number;
}) {
  const leaves = Array.from({ length: 9 }, (_, index) => {
    const angle = index * 2.39996;
    const distance = (0.055 + (index % 3) * 0.026) * scale;
    return {
      angle,
      x: x + Math.cos(angle) * distance,
      y: y - (index % 4) * 0.035 * scale,
      z: z + Math.sin(angle) * distance,
      length: (0.16 + (index % 3) * 0.035) * scale,
    };
  });

  return (
    <group>
      {leaves.map((leaf, index) => (
        <group key={index}>
          <StemBetween
            from={[x, y + 0.03 * scale, z]}
            to={[leaf.x, leaf.y, leaf.z]}
            radius={0.0045 * scale}
            material={palette.vine}
          />
          <mesh
            position={[leaf.x - CX, leaf.y, leaf.z - CZ]}
            rotation={[0.18 + (index % 3) * 0.12, Math.PI / 2 - leaf.angle, index % 2 === 0 ? 0.38 : -0.38]}
            scale={[leaf.length * 0.36, leaf.length * 0.055, leaf.length]}
            material={index % 3 === 0 ? palette.greenery : palette.vine}
            castShadow
          >
            <sphereGeometry args={[1, 16, 10]} />
          </mesh>
        </group>
      ))}
      <StemBetween
        from={[x, y, z]}
        to={[x + 0.025 * scale, y - 0.34 * scale, z - 0.02 * scale]}
        radius={0.004 * scale}
        material={palette.vine}
      />
    </group>
  );
}

export function PotPlant({
  base,
  palette,
  x,
  z,
  scale = 1,
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
  scale?: number;
}) {
  const { r, h, plant } = FURN.pot;
  const potR = r * scale;
  const potH = h * scale;
  const plantH = plant * scale;
  const crownY = base + potH * 0.82;
  const fronds = Array.from({ length: 13 }, (_, index) => {
    const angle = index * 2.39996 + 0.35;
    const tier = index % 4;
    const reach = plantH * (0.42 + tier * 0.075);
    const tipY = base + potH + plantH * (0.42 + ((index * 7) % 6) * 0.075);
    return {
      angle,
      tip: [x + Math.cos(angle) * reach, tipY, z + Math.sin(angle) * reach] as [number, number, number],
      leafLength: plantH * (0.43 + (index % 3) * 0.055),
      roll: (index % 2 === 0 ? 1 : -1) * (0.18 + tier * 0.035),
    };
  });

  return (
    <group>
      <mesh position={[x - CX, base + potH / 2, z - CZ]} material={palette.terracotta} castShadow receiveShadow>
        <cylinderGeometry args={[potR, potR * 0.76, potH, 32]} />
      </mesh>
      <mesh position={[x - CX, base + potH - 0.012, z - CZ]} rotation-x={Math.PI / 2} material={palette.charcoal}>
        <circleGeometry args={[potR * 0.86, 32]} />
      </mesh>
      <mesh position={[x - CX, base + potH - 0.01, z - CZ]} rotation-x={Math.PI / 2} material={palette.terracotta}>
        <torusGeometry args={[potR * 0.94, potR * 0.075, 10, 32]} />
      </mesh>
      {fronds.map((frond, index) => (
        <group key={index}>
          <StemBetween
            from={[x, crownY, z]}
            to={frond.tip}
            radius={0.012 * scale}
            material={palette.vine}
          />
          <mesh
            position={[frond.tip[0] - CX, frond.tip[1], frond.tip[2] - CZ]}
            rotation={[0.12 + (index % 3) * 0.08, Math.PI / 2 - frond.angle, frond.roll]}
            scale={[frond.leafLength * 0.34, frond.leafLength * 0.055, frond.leafLength]}
            material={index % 4 === 0 ? palette.vine : palette.greenery}
            castShadow
          >
            <sphereGeometry args={[1, 20, 12]} />
          </mesh>
          <StemBetween
            from={frond.tip}
            to={[
              frond.tip[0] + Math.cos(frond.angle) * frond.leafLength * 0.72,
              frond.tip[1] - plantH * 0.06,
              frond.tip[2] + Math.sin(frond.angle) * frond.leafLength * 0.72,
            ]}
            radius={0.006 * scale}
            material={palette.vine}
          />
        </group>
      ))}
    </group>
  );
}

export function PlanterBox({
  base,
  palette,
  x,
  z,
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
}) {
  const { w, d, h } = FURN.planter;
  const shoots = Array.from({ length: 9 }, (_, index) => {
    const offsetX = (index - 4) * (w * 0.075);
    const angle = index * 1.73;
    const tip: [number, number, number] = [
      x + offsetX + Math.cos(angle) * 0.09,
      base + h + 0.22 + (index % 3) * 0.045,
      z + Math.sin(angle) * 0.12,
    ];
    return { angle, tip };
  });
  return (
    <group>
      <SoftBox x={x} z={z} y={base} w={w} d={d} h={h} radius={0.035} material={palette.terracotta} />
      <Blk x={x} z={z} y={base + h - 0.02} w={w - 0.07} d={d - 0.07} h={0.025} material={palette.charcoal} />
      {shoots.map((shoot, index) => (
        <group key={index}>
          <StemBetween from={[x + (index - 4) * (w * 0.075), base + h, z]} to={shoot.tip} radius={0.006} material={palette.vine} />
          <mesh
            position={[shoot.tip[0] - CX, shoot.tip[1], shoot.tip[2] - CZ]}
            rotation={[0.2, Math.PI / 2 - shoot.angle, index % 2 === 0 ? 0.28 : -0.28]}
            scale={[0.09, 0.018, 0.26]}
            material={index % 3 === 0 ? palette.vine : palette.greenery}
            castShadow
          >
            <sphereGeometry args={[1, 16, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function DiningSet({
  base,
  palette,
  x,
  z,
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
}) {
  const t = FURN.diningTable;
  const c = FURN.diningChair;
  const chairs = [
    { x, z: z - t.d / 2 - c.d / 2 - 0.05, backX: 0, backZ: -1 },
    { x, z: z + t.d / 2 + c.d / 2 + 0.05, backX: 0, backZ: 1 },
    { x: x - t.w / 2 - c.w / 2 - 0.05, z, backX: -1, backZ: 0 },
    { x: x + t.w / 2 + c.w / 2 + 0.05, z, backX: 1, backZ: 0 },
  ];
  return (
    <group>
      <SoftBox x={x} z={z} y={base + t.h - 0.08} w={t.w} d={t.d} h={0.08} radius={0.04} material={palette.timber} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <Cyl
          key={`table-leg-${sx}-${sz}`}
          x={x + sx * (t.w / 2 - 0.16)}
          z={z + sz * (t.d / 2 - 0.14)}
          y={base}
          r={0.035}
          h={t.h - 0.08}
          segments={16}
          material={palette.frame}
        />
      )))}
      {chairs.map((chair, index) => {
        const sideways = chair.backX !== 0;
        return (
          <group key={index}>
            <SoftBox x={chair.x} z={chair.z} y={base + c.h - 0.08} w={c.w} d={c.d} h={0.08} radius={0.035} material={palette.upholstery} />
            <SoftBox
              x={chair.x + chair.backX * (c.w / 2 - 0.035)}
              z={chair.z + chair.backZ * (c.d / 2 - 0.035)}
              y={base + c.h}
              w={sideways ? 0.07 : c.w}
              d={sideways ? c.d : 0.07}
              h={c.back}
              radius={0.03}
              material={palette.timber}
            />
            {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
              <Cyl
                key={`chair-leg-${sx}-${sz}`}
                x={chair.x + sx * (c.w / 2 - 0.07)}
                z={chair.z + sz * (c.d / 2 - 0.07)}
                y={base}
                r={0.018}
                h={c.h - 0.08}
                segments={12}
                material={palette.frame}
              />
            )))}
          </group>
        );
      })}
    </group>
  );
}
