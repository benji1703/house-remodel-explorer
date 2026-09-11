"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { Blk, Cyl, CX, CZ, SoftBox } from "./shared";
import type { Palette } from "./shared";
import { designAssumptions } from "@/data/house";
import { createTextileBump } from "@/lib/textileTexture";

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
  fridge: { w: 0.7, d: 0.7, h: 2.23 },
  hob: { w: 0.6, d: 0.55, h: 0.04 },
  oven: { w: 0.6, d: 0.6, h: 0.7 },
  pendant: { r: 0.18, h: 0.28 },
  diningTable: { w: 1.6, d: 0.85, h: 0.75 },
  diningChair: { w: 0.45, d: 0.5, h: 0.45, back: 0.4 },
  planter: { w: 0.7, d: 0.35, h: 0.4 },
  pot: { r: 0.22, h: 0.35, plant: 0.45 },
  rug: { h: 0.015 },
} as const;

const BRONZE = new THREE.MeshPhysicalMaterial({
  color: "#78624b",
  metalness: 0.78,
  roughness: 0.24,
  clearcoat: 0.2,
  envMapIntensity: 1.45,
});

const BOUCLE = new THREE.MeshPhysicalMaterial({
  color: "#eee9df",
  roughness: 0.98,
  sheen: 0.7,
  sheenColor: new THREE.Color("#fffaf1"),
  sheenRoughness: 0.82,
  envMapIntensity: 0.65,
  bumpMap: createTextileBump(),
  bumpScale: 0.0012,
});

const BED_LINEN = new THREE.MeshPhysicalMaterial({
  color: "#f3ede2", roughness: 0.93, sheen: 0.55,
  sheenColor: new THREE.Color("#fffaf0"), side: THREE.DoubleSide,
  bumpMap: BOUCLE.bumpMap, bumpScale: 0.0007,
});

const duvetGeometry = new THREE.PlaneGeometry(1.66, 1.48, 64, 56);
duvetGeometry.rotateX(-Math.PI / 2);
const duvetPositions = duvetGeometry.attributes.position;
for (let i = 0; i < duvetPositions.count; i++) {
  const x = duvetPositions.getX(i), z = duvetPositions.getZ(i);
  const sideDrop = Math.max(0, (Math.abs(x) - 0.70) / 0.13);
  const footDrop = Math.max(0, (-z - 0.60) / 0.14);
  const folds = Math.sin(x * 19 + z * 6) * 0.006 + Math.sin(z * 25 - x * 5) * 0.004;
  const turnedEdge = Math.exp(-(((z - 0.63) / 0.07) ** 2)) * 0.045;
  duvetPositions.setY(i, 0.035 + folds + turnedEdge - sideDrop ** 2 * 0.15 - footDrop ** 2 * 0.10);
}
duvetGeometry.computeVertexNormals();

const pillowGeometry = new THREE.SphereGeometry(1, 40, 24);
const pillowPositions = pillowGeometry.attributes.position;
for (let i = 0; i < pillowPositions.count; i++) {
  const x = pillowPositions.getX(i), z = pillowPositions.getZ(i);
  pillowPositions.setX(i, Math.sign(x) * Math.abs(x) ** 0.55);
  pillowPositions.setZ(i, Math.sign(z) * Math.abs(z) ** 0.55);
}
pillowGeometry.computeVertexNormals();

function LinenPillow({ x, z, y, rotated = false }: { x: number; z: number; y: number; rotated?: boolean }) {
  return (
    <mesh position={[x - CX, y + 0.07, z - CZ]} rotation-y={rotated ? Math.PI / 2 : 0} scale={[0.31, 0.075, 0.20]} geometry={pillowGeometry} material={BED_LINEN} castShadow receiveShadow />
  );
}

const SADDLE_LEATHER = new THREE.MeshPhysicalMaterial({
  color: "#8f674b",
  roughness: 0.52,
  clearcoat: 0.12,
  clearcoatRoughness: 0.38,
  sheen: 0.24,
  sheenColor: new THREE.Color("#c99c78"),
  envMapIntensity: 1.05,
});

const LINEN_SHADE = new THREE.MeshPhysicalMaterial({
  color: "#f1e8d8",
  roughness: 0.92,
  transmission: 0.08,
  transparent: true,
  opacity: 0.96,
  side: THREE.DoubleSide,
});

const HOB_GLASS = new THREE.MeshPhysicalMaterial({
  color: "#121715",
  roughness: 0.09,
  metalness: 0.3,
  clearcoat: 0.88,
  clearcoatRoughness: 0.11,
  envMapIntensity: 1.7,
});

const HOB_STEEL = new THREE.MeshPhysicalMaterial({
  color: "#aaa69d",
  roughness: 0.28,
  metalness: 0.9,
  clearcoat: 0.18,
  envMapIntensity: 1.55,
});

const HOB_CAST_IRON = new THREE.MeshStandardMaterial({
  color: "#242724",
  roughness: 0.64,
  metalness: 0.38,
});

const HOB_INDICATOR = new THREE.MeshStandardMaterial({
  color: "#ffa06c",
  emissive: "#ff6338",
  emissiveIntensity: 2.4,
  toneMapped: false,
});

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
  frontSide = -1,
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
  frontSide?: -1 | 1;
}) {
  return (
    <group>
      <SoftBox x={x} z={z} y={base + 0.06} w={w} d={d} h={h - 0.06} radius={0.025} material={palette.oak} />
      {Array.from({ length: fronts }, (_, index) => {
        const frontW = frontAxis === "z" ? w / fronts - 0.018 : 0.018;
        const frontD = frontAxis === "x" ? d / fronts - 0.018 : 0.018;
        const frontX = frontAxis === "z" ? x - w / 2 + w / fronts * (index + 0.5) : x + frontSide * (w / 2 + 0.006);
        const frontZ = frontAxis === "x" ? z - d / 2 + d / fronts * (index + 0.5) : z + frontSide * (d / 2 + 0.006);
        const handleX = frontAxis === "z" ? frontX + frontW * 0.32 : x + frontSide * (w / 2 + 0.025);
        const handleZ = frontAxis === "x" ? frontZ + frontD * 0.32 : z + frontSide * (d / 2 + 0.025);
        return (
          <group key={index}>
            <SoftBox x={frontX} z={frontZ} y={base + 0.11} w={frontW} d={frontD} h={h - 0.2} radius={0.007} material={palette.oak} />
            <Cyl x={handleX} z={handleZ} y={base + h * 0.48} r={0.009} h={0.08} material={BRONZE} />
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
      <SoftBox x={x} z={z} y={base + 0.035} w={planW - 0.1} d={planD - 0.1} h={0.045} radius={0.02} material={BRONZE} />
      <SoftBox x={x} z={z} y={base + h - mattress} w={planW - 0.05} d={planD - 0.05} h={mattress} radius={0.075} material={BOUCLE} />
      <SoftBox x={headX} z={headZ} y={base + 0.12} w={headW} d={headD} h={0.72} radius={0.055} material={BOUCLE} />
      <group position={[x - CX, base + h, z - CZ]} rotation-y={headOnZ ? (sign > 0 ? 0 : Math.PI) : sign * Math.PI / 2}>
        <mesh position={[0, 0, -0.22]} geometry={duvetGeometry} material={BED_LINEN} castShadow receiveShadow />
      </group>
      {headOnZ ? (
        <>
          <LinenPillow x={x - 0.38} z={z + sign * (planD / 2 - 0.34)} y={base + h} />
          <LinenPillow x={x + 0.38} z={z + sign * (planD / 2 - 0.34)} y={base + h} />
        </>
      ) : (
        <>
          <LinenPillow x={x + sign * (planW / 2 - 0.34)} z={z - 0.38} y={base + h} rotated />
          <LinenPillow x={x + sign * (planW / 2 - 0.34)} z={z + 0.38} y={base + h} rotated />
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

export function BedsideLamp({
  base,
  x,
  z,
  nightFactor = 0,
}: {
  base: number;
  x: number;
  z: number;
  nightFactor?: number;
}) {
  return (
    <group>
      <Cyl x={x} z={z} y={base} r={0.075} h={0.025} segments={28} material={BRONZE} />
      <Cyl x={x} z={z} y={base + 0.02} r={0.011} h={0.24} segments={20} material={BRONZE} />
      <mesh position={[x - CX, base + 0.27, z - CZ]}>
        <sphereGeometry args={[0.045, 24, 16]} />
        <meshStandardMaterial
          color="#fff2d5"
          emissive="#ff9f45"
          emissiveIntensity={0.35 + nightFactor * 2.8}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[x - CX, base + 0.32, z - CZ]} material={LINEN_SHADE} castShadow>
        <cylinderGeometry args={[0.105, 0.17, 0.22, 32, 1, true]} />
      </mesh>
    </group>
  );
}

export function Wardrobe({
  base,
  palette,
  x,
  z,
  along = "z",
  width = FURN.wardrobe.w,
  frontSide = -1,
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
  along?: "x" | "z";
  width?: number;
  frontSide?: -1 | 1;
}) {
  const { d, h } = FURN.wardrobe;
  const planW = along === "z" ? d : width;
  const planD = along === "z" ? width : d;
  const fronts = Math.max(2, Math.round(width / 0.62));
  return <Cabinet base={base} palette={palette} x={x} z={z} w={planW} d={planD} h={h} fronts={fronts} frontAxis={along === "z" ? "x" : "z"} frontSide={frontSide} />;
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
      <SoftBox x={x} z={z} y={base + 0.14} w={planW} d={planD} h={0.3} radius={0.11} material={BOUCLE} />
      <SoftBox
        x={x + backOff.x}
        z={z + backOff.z}
        y={base + 0.25}
        w={backW}
        d={backD}
        h={h - 0.18}
        radius={0.07}
        material={BOUCLE}
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
          material={BOUCLE}
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
          material={BOUCLE}
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
          material={BRONZE}
          segments={16}
        />
      )))}
    </group>
  );
}

export function LoungeChair({
  base,
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
      <SoftBox x={x} z={z} y={base + 0.17} w={planW - 0.08} d={planD - 0.08} h={0.24} radius={0.1} material={BOUCLE} />
      <SoftBox
        x={x + backOff.x}
        z={z + backOff.z}
        y={base + 0.26}
        w={backW}
        d={backD}
        h={h - 0.12}
        radius={0.07}
        material={SADDLE_LEATHER}
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
          material={SADDLE_LEATHER}
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
          material={BRONZE}
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
      <SoftBox x={x} z={z} y={base + h - 0.085} w={w} d={d} h={0.085} radius={0.1} material={palette.stone} />
      {[-1, 1].map((side) => (
        <Cyl
          key={side}
          x={x + side * w * 0.23}
          z={z}
          y={base}
          r={0.13}
          h={h - 0.085}
          segments={32}
          material={BRONZE}
        />
      ))}
    </group>
  );
}

export function BarStool({
  base,
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
      <Cyl x={x} z={z} y={base} r={0.175} h={0.025} material={BRONZE} segments={40} />
      <Cyl x={x} z={z} y={base} r={0.032} h={h - 0.08} material={BRONZE} segments={24} />
      <Cyl x={x} z={z} y={base + 0.21} r={0.16} h={0.018} material={BRONZE} segments={28} />
      <SoftBox x={x} z={z} y={base + h - 0.08} w={w} d={d} h={0.08} radius={0.07} material={SADDLE_LEATHER} />
    </group>
  );
}

export function Pendant({
  base,
  x,
  z,
  y = 2.05,
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
  y?: number;
}) {
  const { r, h } = FURN.pendant;
  const cordLength = Math.max(0.03, designAssumptions.finishedCeilingHeightCm / 100 - y);
  return (
    <group>
      <mesh position={[x - CX, base + y + cordLength / 2, z - CZ]} material={BRONZE}>
        <cylinderGeometry args={[0.004, 0.004, cordLength, 16]} />
      </mesh>
      <mesh position={[x - CX, base + y - h / 2, z - CZ]} material={BRONZE} castShadow>
        <cylinderGeometry args={[r * 0.5, r, h, 32, 1, false]} />
      </mesh>
      <mesh position={[x - CX, base + y - h + 0.028, z - CZ]} material={BRONZE}>
        <cylinderGeometry args={[r * 0.16, r * 0.16, 0.055, 20]} />
      </mesh>
      <mesh position={[x - CX, base + y - h + 0.025, z - CZ]}>
        <sphereGeometry args={[r * 0.22, 24, 16]} />
        <meshStandardMaterial color="#fff0ce" emissive="#ffad55" emissiveIntensity={1.1} toneMapped={false} />
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
  const burners = [
    [-0.17, -0.14, 0.085],
    [0.17, -0.14, 0.07],
    [-0.17, 0.11, 0.07],
    [0.17, 0.11, 0.085],
    [0, -0.01, 0.055],
  ] as const;
  return (
    <group>
      <SoftBox x={x} z={z} y={base} w={w} d={d} h={h} radius={0.018} material={HOB_GLASS} />
      {burners.map(([dx, dz, radius], index) => (
        <group key={`${dx}-${dz}`} position={[x - CX + dx, base + h + 0.01, z - CZ + dz]}>
          <mesh rotation-x={Math.PI / 2} material={HOB_STEEL}>
            <torusGeometry args={[radius, 0.008, 10, 32]} />
          </mesh>
          <mesh material={HOB_CAST_IRON} castShadow>
            <cylinderGeometry args={[radius * 0.68, radius * 0.72, 0.016, 28]} />
          </mesh>
          {index < 4 && (
            <>
              <mesh material={HOB_CAST_IRON} castShadow>
                <boxGeometry args={[radius * 2.55, 0.014, 0.016]} />
              </mesh>
              <mesh rotation-y={Math.PI / 2} material={HOB_CAST_IRON} castShadow>
                <boxGeometry args={[radius * 2.55, 0.014, 0.016]} />
              </mesh>
            </>
          )}
        </group>
      ))}
      {[-0.18, -0.09, 0, 0.09, 0.18].map((offset) => (
        <group key={offset}>
          <Cyl x={x + offset} z={z + d * 0.39} y={base + h} r={0.022} h={0.022} segments={24} material={HOB_STEEL} />
          <Blk x={x + offset} z={z + d * 0.39 - 0.016} y={base + h + 0.022} w={0.006} d={0.027} h={0.008} material={palette.charcoal} />
        </group>
      ))}
      <Cyl x={x + 0.265} z={z + d * 0.4} y={base + h + 0.004} r={0.007} h={0.008} segments={16} material={HOB_INDICATOR} />
    </group>
  );
}

const POTTED_PLANT_MODEL = "/models/potted-plant-02/potted_plant_02_1k.gltf";
const FLOWERING_PLANT_MODEL = "/models/periwinkle-plant/periwinkle_plant_1k.gltf";
const JASMINE_FOLIAGE = "/textures/jasmine-foliage.png";

function ScannedPlant({
  src,
  x,
  y,
  z,
  scale,
  rotation = [0, 0, 0],
}: {
  src: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF(src);
  const instance = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const prepared = materials.map((sourceMaterial) => {
        const material = sourceMaterial.clone();
        if (material instanceof THREE.MeshStandardMaterial) {
          material.side = THREE.DoubleSide;
          material.alphaTest = Math.max(material.alphaTest, 0.18);
          material.roughness = Math.max(material.roughness, 0.58);
          material.envMapIntensity = 0.72;
          material.needsUpdate = true;
        }
        return material;
      });
      object.material = Array.isArray(object.material) ? prepared : prepared[0];
    });
    return clone;
  }, [scene]);

  return (
    <primitive
      object={instance}
      position={[x - CX, y, z - CZ]}
      rotation={rotation}
      scale={scale}
      dispose={null}
    />
  );
}

export function FoliageCluster({
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
  const source = useTexture(JASMINE_FOLIAGE);
  const material = useMemo(() => {
    const map = source.clone();
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    map.needsUpdate = true;
    return new THREE.MeshStandardMaterial({
      map,
      color: "#738367",
      roughness: 0.9,
      transparent: true,
      alphaTest: 0.4,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
  }, [source]);
  return (
    <group position={[x - CX, y, z - CZ]} scale={scale} rotation-y={(x * 5.7 + z * 2.9) % (Math.PI * 2)}>
      {[0, Math.PI / 2, Math.PI / 4].map((rotation, index) => (
        <mesh key={rotation} rotation-y={rotation} position={[0, index * 0.035, 0]} material={material} castShadow>
          <planeGeometry args={[0.78 - index * 0.08, 0.64 + index * 0.08]} />
        </mesh>
      ))}
    </group>
  );
}

export function PotPlant({
  base,
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
  return (
    <ScannedPlant
      src={POTTED_PLANT_MODEL}
      x={x}
      y={base}
      z={z}
      scale={scale}
      rotation={[0, (x * 3.1 + z * 7.3) % (Math.PI * 2), 0]}
    />
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
      <SoftBox x={x} z={z} y={base} w={w} d={d} h={h} radius={0.035} material={palette.terracotta} />
      <Blk x={x} z={z} y={base + h - 0.02} w={w - 0.07} d={d - 0.07} h={0.025} material={palette.charcoal} />
      <ScannedPlant
        src={FLOWERING_PLANT_MODEL}
        x={x}
        y={base + h - 0.015}
        z={z}
        scale={0.5}
        rotation={[0, (x * 4.3 + z * 8.1) % (Math.PI * 2), 0]}
      />
    </group>
  );
}

useGLTF.preload(POTTED_PLANT_MODEL);
useGLTF.preload(FLOWERING_PLANT_MODEL);
useTexture.preload(JASMINE_FOLIAGE);

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
      <SoftBox x={x} z={z} y={base + t.h - 0.08} w={t.w} d={t.d} h={0.08} radius={0.075} material={palette.stone} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <Cyl
          key={`table-leg-${sx}-${sz}`}
          x={x + sx * (t.w / 2 - 0.16)}
          z={z + sz * (t.d / 2 - 0.14)}
          y={base}
          r={0.035}
          h={t.h - 0.08}
          segments={16}
          material={BRONZE}
        />
      )))}
      {chairs.map((chair, index) => {
        const sideways = chair.backX !== 0;
        return (
          <group key={index}>
            <SoftBox x={chair.x} z={chair.z} y={base + c.h - 0.08} w={c.w} d={c.d} h={0.08} radius={0.06} material={SADDLE_LEATHER} />
            <SoftBox
              x={chair.x + chair.backX * (c.w / 2 - 0.035)}
              z={chair.z + chair.backZ * (c.d / 2 - 0.035)}
              y={base + c.h}
              w={sideways ? 0.07 : c.w}
              d={sideways ? c.d : 0.07}
              h={c.back}
              radius={0.03}
              material={SADDLE_LEATHER}
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
                material={BRONZE}
              />
            )))}
          </group>
        );
      })}
    </group>
  );
}
