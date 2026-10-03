"use client";
import { Blk, CX, CZ, SoftBox, type Palette } from "./shared";
import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { designAssumptions } from "@/data/house";
import { EditableFurniture, type FurnitureEditingState } from "./EditableFurniture";
import { MoodOlivePot } from "./MoodGardenProps";
import { DecorTray } from "./LuxuryDetails";
import { terraceCushionMaterial, terraceIronMaterial, terraceStoneMaterial } from "./terraceMaterials";
import { terraceFurnitureSpec } from "@/data/terraceFurniture";

function OutdoorBeam({ from, to, radius, material }: { from: [number, number, number]; to: [number, number, number]; radius: number; material: THREE.Material }) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const direction = end.clone().sub(start);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return <mesh position={start.clone().add(end).multiplyScalar(0.5)} quaternion={quaternion} material={material} castShadow receiveShadow>
    <cylinderGeometry args={[radius, radius, direction.length(), 12]} />
  </mesh>;
}

function OutdoorPart({ position, size, radius, material }: { position: [number, number, number]; size: [number, number, number]; radius: number; material: THREE.Material }) {
  return <RoundedBox position={position} args={size} radius={radius} smoothness={3} material={material} castShadow receiveShadow />;
}

const RUSH_LIGHT = new THREE.MeshPhysicalMaterial({ color: "#ae966d", roughness: 0.9, sheen: 0.14 });
const RUSH_DARK = new THREE.MeshPhysicalMaterial({ color: "#887654", roughness: 0.92, sheen: 0.1 });

function RushStrand({ points, material }: { points: THREE.Vector3[]; material: THREE.Material }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 32, 0.0032, 6, false), [points]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material} castShadow receiveShadow />;
}

function RushBack() {
  const strands = useMemo(() => {
    const result: { points: THREE.Vector3[]; material: THREE.Material }[] = [];
    // A fine hand-woven cane panel follows the chair's lightly reclined frame.
    for (let cord = 0; cord <= 9; cord++) {
      const x = THREE.MathUtils.lerp(-0.168, 0.168, cord / 9);
      const points = Array.from({ length: 73 }, (_, i) => {
        const t = i / 72;
        const row = Math.min(7, Math.floor(t * 8));
        const u = t * 8 - row;
        const a = (cord + row) % 2 ? -1 : 1;
        const b = (cord + row + 1) % 2 ? -1 : 1;
        const overUnder = THREE.MathUtils.lerp(a, b, u * u * (3 - 2 * u)) * 0.0045;
        return new THREE.Vector3(x + Math.sin(t * Math.PI) * 0.003, 0.53 + t * 0.32, 0.233 + t * 0.014 + overUnder);
      });
      result.push({ points, material: cord % 3 === 0 ? RUSH_DARK : RUSH_LIGHT });
    }
    for (let row = 0; row <= 8; row++) {
      const t = row / 8;
      const y = 0.535 + t * 0.31;
      const points = Array.from({ length: 82 }, (_, i) => {
        const u = i / 81;
        const x = THREE.MathUtils.lerp(-0.168, 0.168, u);
        const cord = Math.min(8, Math.floor(u * 9));
        const v = u * 9 - cord;
        const a = (cord + row) % 2 ? 1 : -1;
        const b = (cord + row + 1) % 2 ? 1 : -1;
        const overUnder = THREE.MathUtils.lerp(a, b, v * v * (3 - 2 * v)) * 0.0045;
        return new THREE.Vector3(x, y + Math.sin(u * Math.PI) * 0.002, 0.233 + t * 0.014 + overUnder);
      });
      result.push({ points, material: row % 3 === 0 ? RUSH_DARK : RUSH_LIGHT });
    }
    return result;
  }, []);
  return <group>{strands.map((strand, i) => <RushStrand key={i} {...strand} />)}</group>;
}

function TerraceChair({ x, z, base, palette, rotation = 0 }: { x: number; z: number; base: number; palette: Palette; rotation?: number }) {
  const width = terraceFurnitureSpec.chair.widthCm / 100;
  return (
    <group position={[x - CX, base, z - CZ]} rotation-y={rotation}>
      {/* Tubular powder-coated frame with a visible rush back and tailored pad. */}
      {[-1, 1].flatMap((side) => [
        <OutdoorBeam key={`front-${side}`} from={[side * 0.19, 0.025, -0.19]} to={[side * 0.205, 0.47, -0.19]} radius={0.012} material={terraceIronMaterial} />,
        <OutdoorBeam key={`back-${side}`} from={[side * 0.19, 0.025, 0.19]} to={[side * 0.205, 0.91, 0.23]} radius={0.012} material={terraceIronMaterial} />,
      ])}
      <OutdoorBeam from={[-0.205, 0.89, 0.23]} to={[0.205, 0.89, 0.23]} radius={0.014} material={terraceIronMaterial} />
      <OutdoorBeam from={[-0.195, 0.49, 0.21]} to={[0.195, 0.49, 0.21]} radius={0.01} material={terraceIronMaterial} />
      {[-1, 1].map((side) => <OutdoorBeam key={`seat-side-${side}`} from={[side * 0.19, 0.43, -0.2]} to={[side * 0.2, 0.43, 0.2]} radius={0.01} material={terraceIronMaterial} />)}
      <OutdoorPart position={[0, 0.445, 0]} size={[0.39, 0.022, 0.41]} radius={0.014} material={palette.woven} />
      <OutdoorPart position={[0, 0.485, -0.012]} size={[width - 0.06, 0.065, 0.37]} radius={0.04} material={terraceCushionMaterial} />
      <RushBack />
    </group>
  );
}

function TerraceDiningSet({ base, x, z, palette }: { base: number; x: number; z: number; palette: Palette }) {
  const t = terraceFurnitureSpec.table;
  const tw = t.widthCm / 100, td = t.depthCm / 100, th = t.heightCm / 100;
  return (
    <group>
      <SoftBox x={x} z={z} y={base + th - t.topCm / 100} w={tw} d={td} h={t.topCm / 100} radius={0.07} material={terraceStoneMaterial} />
      <SoftBox x={x} z={z} y={base} w={t.pedestalWidthCm / 100} d={0.48} h={th - t.topCm / 100} radius={0.055} material={terraceStoneMaterial} />
      <SoftBox x={x} z={z} y={base + 0.05} w={0.72} d={0.62} h={0.07} radius={0.025} material={terraceStoneMaterial} />
      <SoftBox x={x} z={z} y={base + th - 0.015} w={1.34} d={0.7} h={0.018} radius={0.012} material={terraceStoneMaterial} />
      <TerraceChair base={base} palette={palette} x={x} z={z - 0.70} rotation={Math.PI} />
      <TerraceChair base={base} palette={palette} x={x} z={z + 0.70} />
      <TerraceChair base={base} palette={palette} x={x - 1.07} z={z} rotation={-Math.PI / 2} />
      <TerraceChair base={base} palette={palette} x={x + 1.07} z={z} rotation={Math.PI / 2} />
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
        <TerraceDiningSet base={0.08} palette={palette} x={1.85} z={6.0} />
      </EditableFurniture>
      <DecorTray base={0.83} palette={palette} x={1.85} z={6.0} />
      <MoodOlivePot quality={quality} scale={0.68} base={0.08} palette={palette} x={0.45} z={5.1} />
      <MoodOlivePot quality={quality} scale={0.68} base={0.08} palette={palette} x={0.45} z={6.7} />
      <MoodOlivePot quality={quality} base={0.08} palette={palette} x={0.45} z={3.7} scale={1.15} />
      <MoodOlivePot quality={quality} base={0.08} palette={palette} x={3.15} z={8.0} scale={1.05} />
    </group>
  );
}
