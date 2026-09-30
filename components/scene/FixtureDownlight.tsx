"use client";

import { useMemo } from "react";
import * as THREE from "three";

/** A shaded lamp emits downward; its cached shadow prevents light crossing walls. */
export function FixtureDownlight({ name, position, intensity, distance }: {
  name: string; position: [number, number, number]; intensity: number; distance: number;
}) {
  const [x, y, z] = position;
  const target = useMemo(() => {
    const object = new THREE.Object3D();
    object.position.set(x, y - 1, z);
    return object;
  }, [x, y, z]);
  return <>
    <primitive object={target} />
    <spotLight name={name} position={position} target={target} color="#ffe0b5"
      intensity={intensity} distance={distance} decay={2} angle={1.05} penumbra={0.7}
      castShadow shadow-mapSize-width={256} shadow-mapSize-height={256}
      shadow-camera-near={0.03} shadow-camera-far={distance} shadow-bias={-0.0001} shadow-normalBias={0.008} />
  </>;
}
