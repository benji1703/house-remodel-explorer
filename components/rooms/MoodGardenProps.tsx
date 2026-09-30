"use client";

import { useGLTF } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { CX, CZ, type Palette } from "./shared";
import { moodFixtures } from "@/data/moodFixtures";

function OliveAsset({ palette, light }: { palette: Palette; light: boolean }) {
  const { scene } = useGLTF(moodFixtures.olivePot.asset.replace(".glb", light ? "-light.glb" : ".glb"));
  const instance = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const foliage = materials.some((material) => material.name === "Mood olive leaf");
      object.castShadow = !foliage;
      object.receiveShadow = !foliage;
      if (materials.some((material) => material.name === "Weathered clay")) object.material = palette.terracotta;
    });
    return clone;
  }, [scene, palette.terracotta]);
  return <primitive object={instance} dispose={null} />;
}

/** Rolled-lip clay vessel and fine olive leaves from mood-terrace-08. */
export function MoodOlivePot({ x, z, base, palette, quality, scale = 1 }: {
  x: number; z: number; base: number; palette: Palette; quality: "high" | "light"; scale?: number;
}) {
  return <group name="Mood olive in weathered clay" position={[x - CX, base, z - CZ]} scale={scale} rotation-y={(x * 3.1 + z) % (Math.PI * 2)}>
    <Suspense fallback={null}><OliveAsset palette={palette} light={quality === "light"} /></Suspense>
  </group>;
}
