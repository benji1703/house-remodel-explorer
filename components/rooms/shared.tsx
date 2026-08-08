"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
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

/**
 * A real CC0 glTF model (fetched by scripts/fetch-props.mjs into
 * public/props/<slug>/), placed with the same raw-plan-meters convention as
 * Blk/Cyl. `y` is the floor height the model's own origin sits on (usually
 * the room's zone.level); models are assumed real-world-scale (scale=1)
 * unless the placing room file found otherwise while checking against the
 * room footprint.
 */
export function Prop({
  slug,
  x,
  z,
  y = 0,
  rotationY = 0,
  scale = 1,
}: {
  slug: string;
  x: number;
  z: number;
  y?: number;
  rotationY?: number;
  scale?: number;
}) {
  const { scene } = useGLTF(`/props/${slug}/${slug}_1k.gltf`);
  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  return (
    <primitive
      object={cloned}
      position={[x - CX, y, z - CZ]}
      rotation-y={rotationY}
      scale={scale}
    />
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
