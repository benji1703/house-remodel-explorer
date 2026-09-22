"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

export function SkyDome({ sunDirection, daylight, garden }: { sunDirection: THREE.Vector3; daylight: number; garden: boolean }) {
  const geometry = useMemo(() => {
    // A photographic Mediterranean sky: saturated blue overhead, warm haze at
    // the horizon, and a restrained sun bloom. Keep this in linear scene color
    // rather than using a flat background so the shell receives believable
    // reflected color from the environment.
    const zenith = new THREE.Color("#27313a").lerp(new THREE.Color(garden ? "#91afd1" : "#93a9b2"), daylight);
    const horizon = new THREE.Color("#625b58").lerp(new THREE.Color(garden ? "#d7d6cc" : "#e6c9a9"), daylight * 0.92);
    const haze = new THREE.Color("#3e4244").lerp(new THREE.Color("#c4c1b6"), daylight);
    const glow = new THREE.Color("#ff8b43").lerp(new THREE.Color("#fff1d0"), daylight);
    const sphere = new THREE.SphereGeometry(60, 24, 16);
    const position = sphere.getAttribute("position");
    const colors = new Float32Array(position.count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < position.count; i += 1) {
      const dir = new THREE.Vector3().fromBufferAttribute(position, i).normalize();
      const up = dir.y;
      color.copy(up >= 0 ? horizon : haze).lerp(up >= 0 ? zenith : horizon, THREE.MathUtils.smoothstep(Math.abs(up), 0, 0.55));
      const nearHorizon = 1 - THREE.MathUtils.smoothstep(Math.abs(up), 0, 0.7);
      color.lerp(glow, Math.pow(Math.max(0, dir.dot(sunDirection)), 4) * nearHorizon * (garden ? 0.25 : 0.6));
      color.multiplyScalar(daylight);
      colors.set([color.r, color.g, color.b], i * 3);
    }
    sphere.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return sphere;
  }, [daylight, sunDirection, garden]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} frustumCulled={false}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={!garden} /></mesh>;
}

