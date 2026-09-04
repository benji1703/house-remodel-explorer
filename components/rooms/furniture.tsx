"use client";

import { Blk, Cyl, CX, CZ } from "./shared";
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
      <Blk x={x} z={z} y={base} w={planW} d={planD} h={h - mattress} material={palette.oak} />
      <Blk x={x} z={z} y={base + h - mattress} w={planW - 0.04} d={planD - 0.04} h={mattress} material={palette.upholstery} />
      <Blk x={headX} z={headZ} y={base + h - mattress} w={headW} d={headD} h={0.55} material={palette.oak} />
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
  return <Blk x={x} z={z} y={base} w={w} d={d} h={h} material={palette.oak} />;
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
  return <Blk x={x} z={z} y={base} w={planW} d={planD} h={h} material={palette.oak} />;
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
  return <Blk x={x} z={z} y={base} w={planW} d={planD} h={h} material={palette.oak} />;
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
  const { w, d, h, back } = FURN.sofa3;
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

  return (
    <group>
      <Blk x={x} z={z} y={base} w={planW} d={planD} h={h - back + 0.15} material={palette.upholstery} />
      <Blk
        x={x + backOff.x}
        z={z + backOff.z}
        y={base}
        w={backW}
        d={backD}
        h={h}
        material={palette.upholstery}
      />
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
      <Blk x={x} z={z} y={base} w={planW} d={planD} h={0.4} material={palette.upholstery} />
      <Blk
        x={x + backOff.x}
        z={z + backOff.z}
        y={base}
        w={backW}
        d={backD}
        h={h}
        material={palette.upholstery}
      />
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
  return <Blk x={x} z={z} y={base} w={w} d={d} h={h} material={palette.oak} />;
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
      <Cyl x={x} z={z} y={base} r={0.04} h={h - 0.05} material={palette.frame} />
      <Blk x={x} z={z} y={base + h - 0.05} w={w} d={d} h={0.05} material={palette.oak} />
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
        <cylinderGeometry args={[0.008, 0.008, 0.4, 8]} />
      </mesh>
      <Cyl x={x} z={z} y={base + y - h} r={r} h={h} material={palette.frame} />
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
  return <Blk x={x} z={z} y={base} w={w} d={d} h={h} material={palette.charcoal} />;
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
  const leafRadius = plant * scale * 0.28;
  return (
    <group>
      <Cyl x={x} z={z} y={base} r={r * scale} h={h * scale} material={palette.terracotta} />
      <mesh position={[x - CX, base + h * scale + plant * scale * 0.36, z - CZ]} material={palette.vine} castShadow>
        <cylinderGeometry args={[0.018 * scale, 0.028 * scale, plant * scale * 0.72, 8]} />
      </mesh>
      {[
        [-0.34, 0.28, 0.08, -0.5],
        [0.34, 0.34, -0.08, 0.55],
        [-0.18, 0.58, -0.22, -0.2],
        [0.2, 0.66, 0.18, 0.25],
        [0, 0.82, 0, 0],
        [-0.3, 0.48, 0.2, -0.7],
        [0.3, 0.5, -0.2, 0.7],
      ].map(([ox, oy, oz, rotation], index) => (
        <mesh
          key={index}
          position={[
            x - CX + ox * plant * scale,
            base + h * scale + oy * plant * scale,
            z - CZ + oz * plant * scale,
          ]}
          rotation={[0.12 * (index % 3), rotation, index % 2 === 0 ? -0.38 : 0.38]}
          scale={[1.45, 0.5, 0.78]}
          material={index % 3 === 0 ? palette.vine : palette.greenery}
          castShadow
        >
          <sphereGeometry args={[leafRadius, 16, 10]} />
        </mesh>
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
  return (
    <group>
      <Blk x={x} z={z} y={base} w={w} d={d} h={h} material={palette.terracotta} />
      <Blk x={x} z={z} y={base + h} w={w - 0.08} d={d - 0.08} h={0.12} material={palette.greenery} />
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
  return (
    <group>
      <Blk x={x} z={z} y={base} w={t.w} d={t.d} h={t.h} material={palette.timber} />
      {[
        [x, z - t.d / 2 - c.d / 2 - 0.05],
        [x, z + t.d / 2 + c.d / 2 + 0.05],
        [x - t.w / 2 - c.w / 2 - 0.05, z],
        [x + t.w / 2 + c.w / 2 + 0.05, z],
      ].map(([cx, cz], i) => (
        <Blk key={i} x={cx} z={cz} y={base} w={c.w} d={c.d} h={c.h} material={palette.timber} />
      ))}
    </group>
  );
}
