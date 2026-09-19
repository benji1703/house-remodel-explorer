"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { memo, useMemo } from "react";
import * as THREE from "three";
import { gardenLighting, lightingProfiles } from "@/data/lighting";

export type LightingRigProps = {
  designMode: boolean;
  quality: "high" | "light";
  landscapeReady: "high" | "light" | null;
  kitchenRoom: boolean;
  cameraMode: "overview" | "room" | "plan" | "garden";
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

function SkyDome({ sunDirection, hour, garden }: { sunDirection: THREE.Vector3; hour: number; garden: boolean }) {
  const geometry = useMemo(() => {
    const daylight = Math.sin(THREE.MathUtils.clamp((hour - 6) / 14, 0, 1) * Math.PI);
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
      colors.set([color.r, color.g, color.b], i * 3);
    }
    sphere.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return sphere;
  }, [hour, sunDirection, garden]);
  return <mesh geometry={geometry} frustumCulled={false}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={!garden} /></mesh>;
}

/** One lighting boundary: quality policy, daylight probe and shadow budget live together. */
export const LightingRig = memo(function LightingRig({ designMode, quality, landscapeReady, kitchenRoom, cameraMode, selectedZone, floorFinish, removedFurniture, furnitureSignature, sunHour, sun }: LightingRigProps) {
  const profile = lightingProfiles[quality];
  const garden = cameraMode === "garden";
  // Overview and garden are both exterior presentations. Keeping this policy
  // separate from the route name prevents overview from falling back to the
  // interior fill recipe while preserving room/plan lighting.
  const exterior = garden || cameraMode === "overview";
  // Keep one-shot captures free of loader-store subscriptions. Drei's progress
  // store can publish synchronously while a child PlantBatch is rendering,
  // which would update LightingRig during PlantBatch render. Scene navigation,
  // quality and finish keys still remount the capture deterministically.
  const gardenSun = useMemo(() => sun.color.clone().lerp(new THREE.Color("#fff4df"), 0.3), [sun.color]);
  const localLights = designMode && profile.localLights && cameraMode === "room";
  // Practical fixtures are part of the house presentation, not a room-only
  // debug aid. Keep a low daytime contribution so windows and pergola remain
  // natural, then let the warm interior and exterior luminaires carry the
  // composition after sunset.
  const practicalLevel = designMode ? 0.34 + (1 - sun.daylight) * 1.55 : 0;
  const housePracticals = designMode && profile.localLights;
  return (
    <>
      <color attach="background" args={[designMode ? sun.sky : "#e5e5ea"]} />
      <fog attach="fog" args={[designMode ? exterior ? new THREE.Color("#625b58").lerp(new THREE.Color("#d7d6cc"), sun.daylight * 0.92) : sun.sky : "#e5e5ea", 25, 49]} />
      {designMode && <SkyDome sunDirection={sun.direction} hour={sunHour} garden={exterior} />}
      {designMode && (
        <Environment key={`daylight-${sunHour}-${exterior}`} resolution={profile.environmentResolution} frames={1} environmentIntensity={exterior ? gardenLighting.environmentIntensity : 0.72}>
          <color attach="background" args={["#9c8e80"]} />
          <Lightformer form="rect" intensity={sun.daylight * 2.1} color={sun.color} scale={[18, 5, 1]} position={sun.position} />
          <Lightformer form="rect" intensity={sun.daylight * 1.15} color="#d3d0c8" scale={[20, 16, 1]} position={[0, 14, 0]} rotation-x={Math.PI / 2} />
          <Lightformer form="rect" intensity={sun.daylight * 0.62} color="#d2ad78" scale={[20, 20, 1]} position={[0, -8, 0]} rotation-x={-Math.PI / 2} />
          <Lightformer form="rect" intensity={sun.daylight * 1.5} color="#fff1d2" scale={[7, 4, 1]} position={[0, 2, -7]} rotation-y={Math.PI} />
        </Environment>
      )}
      <hemisphereLight args={["#c9c8c1", "#9d7957", designMode ? exterior ? gardenLighting.hemisphereBase + sun.daylight * gardenLighting.hemisphereDaylight : 0.13 + sun.daylight * 0.38 : 1.1]} />
      <ambientLight intensity={designMode ? exterior ? gardenLighting.ambientBase + sun.daylight * gardenLighting.ambientDaylight : 0.028 + sun.daylight * 0.06 : 0.45} />
      {localLights && kitchenRoom && <>
        <rectAreaLight position={[-0.2, 1.65, -5.86]} rotation-y={Math.PI} width={1.6} height={1.2} intensity={sun.daylight * 3.2} color="#f1f4f6" />
        <rectAreaLight position={[1.69, 1.6, -5.2]} rotation-y={Math.PI / 2} width={1.2} height={1.2} intensity={sun.daylight * 4} color="#fff1db" />
      </>}
      <directionalLight position={designMode ? sun.position : [9, 13, 6]} intensity={designMode ? sun.intensity * (garden ? gardenLighting.directMultiplier : 0.82) : 2.3} color={designMode ? garden ? gardenSun : sun.color : "#fff1dc"} castShadow={quality === "high"} shadow-mapSize-width={profile.shadowMap} shadow-mapSize-height={profile.shadowMap} shadow-camera-left={-13} shadow-camera-right={13} shadow-camera-top={13} shadow-camera-bottom={-13} shadow-camera-far={45} shadow-bias={garden ? -0.00018 : -0.00025} shadow-normalBias={garden ? 0.012 : 0.025} shadow-radius={quality === "high" ? 1.7 : 1} />
      <directionalLight position={designMode ? [9, 6, 7] : [-8, 6, -6]} intensity={designMode ? exterior ? gardenLighting.fillBase + sun.daylight * gardenLighting.fillDaylight : 0.04 + sun.daylight * 0.14 : 0.55} color={designMode ? "#d0c5b5" : "#d8d1c5"} />
      {housePracticals && <>
        <pointLight position={[0, 2.1, 0.2]} intensity={practicalLevel * 1.6} distance={6} decay={2} color="#ffd1a0" />
        <pointLight position={[-0.1, 2.1, -4.2]} intensity={practicalLevel * 1.35} distance={5.5} decay={2} color="#ffd1a0" />
        <pointLight position={[-3.9, 2.4, -0.15]} intensity={practicalLevel * 1.2} distance={5.5} decay={2} color="#ffc58a" />
      </>}
      {housePracticals && <>
        <pointLight position={[-4.0, 1.05, 5.05]} intensity={practicalLevel * 1.1} distance={3.7} decay={2} color="#ffc27f" />
        <pointLight position={[4.55, 1.05, 0.4]} intensity={practicalLevel} distance={3.5} decay={2} color="#ffc786" />
        <pointLight position={[4.55, 1.05, 4.8]} intensity={practicalLevel} distance={3.5} decay={2} color="#ffc786" />
      </>}
      {housePracticals && <>
        {/* Exterior path and pergola pools: broad, low-energy pools keep the
         * limestone readable and make the house visibly inhabited at night. */}
        <pointLight position={[-4.8, 2.35, 1.15]} intensity={practicalLevel * 0.5} distance={5.2} decay={2} color="#ffbd78" />
        <pointLight position={[-1.9, 2.35, 1.15]} intensity={practicalLevel * 0.42} distance={4.6} decay={2} color="#ffd39a" />
        <pointLight position={[5.15, 2.05, -1.65]} intensity={practicalLevel * 0.32} distance={4.5} decay={2} color="#ffd39a" />
        <pointLight position={[5.15, 2.05, 5.1]} intensity={practicalLevel * 0.28} distance={4.2} decay={2} color="#ffd39a" />
      </>}
      {designMode && <ContactShadows frames={1} key={`${floorFinish}-${cameraMode}-${quality}-${landscapeReady}-${selectedZone}-${removedFurniture.join(",")}-${furnitureSignature}`} position={exterior ? [0, gardenLighting.contactElevationCm / 100, 0] : kitchenRoom ? [-0.2, 0.103, -4.0] : [0, 0.103, 0]} scale={exterior ? gardenLighting.contactSpanCm / 100 : kitchenRoom ? 6 : 17} resolution={exterior ? quality === "high" ? gardenLighting.highContactResolution : gardenLighting.lightContactResolution : profile.contactResolution} blur={exterior ? 1.3 : quality === "high" ? 2.5 : 2.6} far={exterior ? gardenLighting.contactFarCm / 100 : 2.4} opacity={exterior ? gardenLighting.contactOpacity : quality === "high" ? 0.2 : 0.22} color="#62594f" />}
    </>
  );
});
