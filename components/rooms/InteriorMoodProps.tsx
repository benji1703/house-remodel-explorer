"use client";

import { useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import { interiorAssets, type InteriorAssetId, type InteriorAssetSpec } from "@/data/interiorStyling";
import { createTextileBump } from "@/lib/textileTexture";
import { useSceneDetail, useSceneQuality, useShadowRefresh } from "../scene/SceneDetail";
import { cloneSurfaceMaterial } from "@/lib/moodSurfaceMaterial";
import { CX, CZ, type Palette } from "./shared";

const weave = createTextileBump();

function Asset({ id, light, palette, glow }: { id: InteriorAssetId; light: boolean; glow: number; palette: Palette }) {
  const refreshShadows = useShadowRefresh();
  const { scene } = useGLTF(`/models/interior/${id}${light ? "-light" : ""}.glb`, false, true);
  const { object, materials } = useMemo(() => {
    const object = scene.clone(true);
    const materials = new Map<THREE.Material, THREE.MeshStandardMaterial>();
    object.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      node.castShadow = true;
      node.receiveShadow = true;
      const source = node.material as THREE.MeshStandardMaterial;
      if (!materials.has(source)) {
        const surface = source.name.includes("linen") ? palette.upholstery : source.name.includes("oak") ? palette.oak : null;
        const material = surface instanceof THREE.MeshStandardMaterial ? cloneSurfaceMaterial(surface) : source.clone();
        material.name = source.name;
        if (surface) material.color.copy(source.color);
        if (source.name.includes("linen")) {
          material.bumpMap = weave;
          material.bumpScale = id === "living-rug" ? 0.002 : 0.0007;
          material.roughness = 0.96;
          material.side = THREE.DoubleSide;
        }
        if (source.name === "Mood lamp diffuser") {
          material.emissive.set("#ffc283");
        }
        materials.set(source, material);
      }
      node.material = materials.get(source)!;
    });
    return { object, materials: [...materials.values()] };
  }, [scene, id, palette.oak, palette.upholstery]);
  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);
  useEffect(() => {
    refreshShadows();
    return refreshShadows;
  }, [object, refreshShadows]);
  return <>
    <primitive object={object} dispose={null} />
    {glow > 0 && <pointLight position={[0, 1.25, 0]} color="#ffc78f" intensity={glow * 0.55} distance={3.2} decay={2} />}
  </>;
}

/** Independent suspense keeps a small prop load from blanking an entire room. */
export function InteriorMoodProp({ id, xCm, zCm, base, palette, rotation = 0, glow = 0 }: {
  id: InteriorAssetId; xCm: number; zCm: number; base: number; palette: Palette; rotation?: number; glow?: number;
}) {
  const detail = useSceneDetail();
  const quality = useSceneQuality();
  const spec: InteriorAssetSpec = interiorAssets[id];
  if (spec.detailOnly && !detail) return null;
  return <group name={`mood-${id}-${xCm}-${zCm}`} position={[xCm / 100 - CX, base, zCm / 100 - CZ]} rotation-y={rotation}
    userData={{ interiorAsset: id, reference: `/references/moods/${spec.reference}`, label: spec.label }}>
    <Suspense fallback={null}><Asset id={id} light={quality === "light"} glow={glow} palette={palette} /></Suspense>
  </group>;
}
