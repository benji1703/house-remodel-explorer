"use client";

import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// Scene centring, so the measured footprint orbits around the origin.
export const CX = 5.7;
export const CZ = 6.05;

/** Axis-aligned box placed by plan coordinates (metres, un-centred). */
export function Blk({
  x,
  z,
  y,
  w,
  d,
  h,
  material,
}: {
  x: number;
  z: number;
  y: number;
  w: number;
  d: number;
  h: number;
  material: THREE.Material;
}) {
  return (
    <mesh position={[x - CX, y + h / 2, z - CZ]} material={material} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
    </mesh>
  );
}

/** Soft-edged block for furniture and joinery; keeps plan dimensions exact. */
export function SoftBox({
  x,
  z,
  y,
  w,
  d,
  h,
  material,
  radius = 0.035,
}: {
  x: number;
  z: number;
  y: number;
  w: number;
  d: number;
  h: number;
  material: THREE.Material;
  radius?: number;
}) {
  const safeRadius = Math.min(radius, w / 4, d / 4, h / 4);
  return (
    <RoundedBox
      args={[w, h, d]}
      position={[x - CX, y + h / 2, z - CZ]}
      radius={safeRadius}
      smoothness={4}
      material={material}
      castShadow
      receiveShadow
    />
  );
}

export function Cyl({
  x,
  z,
  y,
  r,
  h,
  material,
  segments = 20,
}: {
  x: number;
  z: number;
  y: number;
  r: number;
  h: number;
  material: THREE.Material;
  segments?: number;
}) {
  return (
    <mesh position={[x - CX, y + h / 2, z - CZ]} material={material} castShadow receiveShadow>
      <cylinderGeometry args={[r, r, h, segments]} />
    </mesh>
  );
}

export type Palette = {
  exterior: THREE.Material;
  interior: THREE.Material;
  ground: THREE.Material;
  glass: THREE.Material;
  frame: THREE.Material;
  oak: THREE.Material;
  timber: THREE.Material;
  upholstery: THREE.Material;
  stone: THREE.Material;
  charcoal: THREE.Material;
  greenery: THREE.Material;
  vine: THREE.Material;
  flower: THREE.Material;
  terracotta: THREE.Material;
  floors: Record<string, THREE.Material>;
};
