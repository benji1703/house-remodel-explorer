"use client";

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
  terracotta: THREE.Material;
  floors: Record<string, THREE.Material>;
};
