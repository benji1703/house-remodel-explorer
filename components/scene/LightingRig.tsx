"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { memo, useMemo } from "react";
import * as THREE from "three";
import { lightingProfiles } from "@/data/lighting";

export type LightingRigProps = {
  designMode: boolean;
  quality: "high" | "light";
  kitchenRoom: boolean;
  cameraMode: "overview" | "room" | "plan";
  selectedZone: string;
  floorFinish: string;
  removedFurniture: string[];
  furnitureSignature: string;
  sunHour: number;
  sun: {
    position: [number, number, number];
    direction: THREE.Vector3;
    color: THREE.Color;
    intensity: number;
    sky: THREE.Color;
    practical: number;
    daylight: number;
  };
};

function SkyDome({ sunDirection, hour }: { sunDirection: THREE.Vector3; hour: number }) {
  const geometry = useMemo(() => {
    const daylight = Math.sin(THREE.MathUtils.clamp((hour - 6) / 14, 0, 1) * Math.PI);
    const zenith = new THREE.Color("#273549").lerp(new THREE.Color("#9db7d6"), daylight);
    const horizon = new THREE.Color("#826b70").lerp(new THREE.Color("#edf1ef"), daylight * 0.86);
    const haze = new THREE.Color("#424653").lerp(new THREE.Color("#c9d0ce"), daylight);
    const glow = new THREE.Color("#ff9b52").lerp(new THREE.Color("#fff0cf"), daylight);
    const sphere = new THREE.SphereGeometry(60, 24, 16);
    const position = sphere.getAttribute("position");
    const colors = new Float32Array(position.count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < position.count; i += 1) {
      const dir = new THREE.Vector3().fromBufferAttribute(position, i).normalize();
      const up = dir.y;
      color.copy(up >= 0 ? horizon : haze).lerp(up >= 0 ? zenith : horizon, THREE.MathUtils.smoothstep(Math.abs(up), 0, 0.55));
      const nearHorizon = 1 - THREE.MathUtils.smoothstep(Math.abs(up), 0, 0.7);
      color.lerp(glow, Math.pow(Math.max(0, dir.dot(sunDirection)), 4) * nearHorizon * 0.6);
      colors.set([color.r, color.g, color.b], i * 3);
    }
    sphere.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return sphere;
  }, [hour, sunDirection]);
  return <mesh geometry={geometry} frustumCulled={false}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>;
}

/** One lighting boundary: quality policy, daylight probe and shadow budget live together. */
export const LightingRig = memo(function LightingRig({ designMode, quality, kitchenRoom, cameraMode, selectedZone, floorFinish, removedFurniture, furnitureSignature, sunHour, sun }: LightingRigProps) {
  const profile = lightingProfiles[quality];
  const localLights = designMode && profile.localLights && cameraMode === "room";
  return (
    <>
      <color attach="background" args={[designMode ? sun.sky : "#e5e5ea"]} />
      <fog attach="fog" args={[designMode ? sun.sky : "#e5e5ea", 25, 49]} />
      {designMode && <SkyDome sunDirection={sun.direction} hour={sunHour} />}
      {designMode && (
        <Environment resolution={profile.environmentResolution} frames={1}>
          <color attach="background" args={["#3a3730"]} />
          <Lightformer form="rect" intensity={0.18 + sun.daylight * 2.8} color={sun.color} scale={[16, 6, 1]} position={sun.position} />
          <Lightformer form="rect" intensity={0.2 + sun.daylight * 1.15} color="#d9e4ef" scale={[18, 18, 1]} position={[0, 14, 0]} rotation-x={Math.PI / 2} />
          <Lightformer form="rect" intensity={0.1 + sun.daylight * 0.42} color="#c8b28e" scale={[20, 20, 1]} position={[0, -8, 0]} rotation-x={-Math.PI / 2} />
          <Lightformer form="rect" intensity={0.4 + sun.daylight * 2} color="#f2f3ed" scale={[5, 3, 1]} position={[0, 2, -7]} rotation-y={Math.PI} />
        </Environment>
      )}
      <hemisphereLight args={["#e8edf2", "#c9b99e", designMode ? 0.2 + sun.daylight * 0.9 : 1.1]} />
      <ambientLight intensity={designMode ? 0.07 + sun.daylight * 0.14 : 0.45} />
      {localLights && kitchenRoom && <>
        <rectAreaLight position={[-0.2, 1.65, -5.86]} rotation-y={Math.PI} width={1.6} height={1.2} intensity={sun.daylight * 3.2} color="#f1f4f6" />
        <rectAreaLight position={[1.69, 1.6, -5.2]} rotation-y={Math.PI / 2} width={1.2} height={1.2} intensity={sun.daylight * 4} color="#fff1db" />
      </>}
      <directionalLight position={designMode ? sun.position : [9, 13, 6]} intensity={designMode ? sun.intensity : 2.3} color={designMode ? sun.color : "#fff1dc"} castShadow={quality === "high"} shadow-mapSize-width={profile.shadowMap} shadow-mapSize-height={profile.shadowMap} shadow-camera-left={-13} shadow-camera-right={13} shadow-camera-top={13} shadow-camera-bottom={-13} shadow-camera-far={45} shadow-bias={-0.0004} shadow-normalBias={0.03} shadow-radius={quality === "high" ? 2 : 1} />
      <directionalLight position={designMode ? [9, 6, 7] : [-8, 6, -6]} intensity={designMode ? 0.08 + sun.daylight * 0.38 : 0.55} color={designMode ? "#a9c2e0" : "#ccd8e8"} />
      {localLights && <>
        <pointLight position={[0, 2.1, 0.2]} intensity={0.5 + sun.practical * 4.5} distance={6} decay={2} color="#ffd1a0" />
        <pointLight position={[-0.1, 2.1, -4.2]} intensity={0.4 + sun.practical * 3.8} distance={5.5} decay={2} color="#ffd1a0" />
        <pointLight position={[-3.9, 2.4, -0.15]} intensity={0.35 + sun.practical * 3.4} distance={5.5} decay={2} color="#ffc58a" />
      </>}
      {localLights && <>
        <pointLight position={[-4.0, 1.05, 5.05]} intensity={0.08 + sun.practical * 3.4} distance={3.7} decay={2} color="#ffc27f" />
        <pointLight position={[4.55, 1.05, 0.4]} intensity={0.08 + sun.practical * 3.0} distance={3.5} decay={2} color="#ffc786" />
        <pointLight position={[4.55, 1.05, 4.8]} intensity={0.08 + sun.practical * 3.0} distance={3.5} decay={2} color="#ffc786" />
      </>}
      {designMode && <ContactShadows frames={1} key={`${floorFinish}-${cameraMode}-${selectedZone}-${removedFurniture.join(",")}-${furnitureSignature}`} position={kitchenRoom ? [-0.2, 0.103, -4.0] : [0, 0.103, 0]} scale={kitchenRoom ? 6 : 17} resolution={profile.contactResolution} blur={quality === "high" ? 2.5 : 2.6} far={2.4} opacity={quality === "high" ? 0.2 : 0.22} color="#62594f" />}
    </>
  );
});
