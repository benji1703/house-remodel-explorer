"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { memo, useMemo } from "react";
import * as THREE from "three";
import type { Daylight } from "@/lib/daylight";
import { SkyDome } from "./SkyDome";
import { house } from "@/data/house";
import { CX, CZ } from "../rooms/shared";
import { gardenLighting, houseLightingFixtures, interiorLighting, lightingProfiles, type HouseLightingFixture } from "@/data/lighting";

export type LightingRigProps = {
  geometryRevision: number;
  designMode: boolean;
  quality: "high" | "light";
  landscapeReady: "high" | "light" | null;
  kitchenRoom: boolean;
  cameraMode: "overview" | "room" | "plan" | "garden" | "walk";
  selectedZone: string;
  floorFinish: string;
  removedFurniture: string[];
  furnitureSignature: string;
  sunHour: number;
  houseLightsOn: boolean;
  sun: Daylight;
};

/** Every direct source is at its bulb/diffuser and gets one cached shadow map.
 * A spotlight uses one map instead of the six faces needed by a point light. */
function PracticalFixture({ fixture, level, quality }: { fixture: HouseLightingFixture; level: number; quality: "high" | "light" }) {
  const floor = house.zones.find(zone => zone.id === fixture.zone)?.level ?? 0;
  const wall = fixture.kind === "wall";
  const rotation = Math.atan2(fixture.normal[0], fixture.normal[1]);
  const target = useMemo(() => {
    const object = new THREE.Object3D();
    object.position.set(0, -1.5, wall ? 0.6 : 0);
    return object;
  }, [wall]);
  return <group name={`fixture-${fixture.id}`} position={[fixture.positionCm[0] / 100 - CX, floor + fixture.heightCm / 100, fixture.positionCm[1] / 100 - CZ]} rotation-y={rotation}
    userData={{ lightingFixture: fixture.id, proposed: true }}>
    {wall && <group name="Bronze wall downlight">
      <mesh position={[0, 0, 0.006]} rotation-x={Math.PI / 2} castShadow><cylinderGeometry args={[0.055, 0.055, 0.012, 24]} /><meshStandardMaterial color="#71513a" metalness={0.75} roughness={0.38} /></mesh>
      <mesh position={[0, 0, 0.043]} castShadow><boxGeometry args={[0.022, 0.024, 0.075]} /><meshStandardMaterial color="#71513a" metalness={0.75} roughness={0.38} /></mesh>
      <mesh position={[0, 0, 0.085]} castShadow><cylinderGeometry args={[0.052, 0.052, 0.13, 32, 1, true]} /><meshStandardMaterial color="#71513a" metalness={0.75} roughness={0.38} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, -0.065, 0.085]}><cylinderGeometry args={[0.047, 0.047, 0.005, 24]} /><meshStandardMaterial color="#fff2db" emissive={fixture.color} emissiveIntensity={level * 2} /></mesh>
    </group>}
    <primitive object={target} />
    <spotLight name={fixture.id} target={target} position={wall ? [0, -0.071, 0.085] : [0, -0.045, 0]}
      color={fixture.color} intensity={level * fixture.intensity} distance={fixture.rangeCm / 100} decay={2}
      angle={wall ? 0.9 : 1.05} penumbra={0.65} castShadow={level > 0}
      shadow-mapSize-width={quality === "high" ? 512 : 256} shadow-mapSize-height={quality === "high" ? 512 : 256}
      shadow-camera-near={0.04} shadow-camera-far={fixture.rangeCm / 100} shadow-bias={-0.0001} shadow-normalBias={0.012} />
  </group>;
}

/** One lighting boundary: quality policy, daylight probe and shadow budget live together. */
export const LightingRig = memo(function LightingRig({ geometryRevision, designMode, quality, landscapeReady, kitchenRoom, cameraMode, selectedZone, floorFinish, removedFurniture, furnitureSignature, sunHour, houseLightsOn, sun }: LightingRigProps) {
  const profile = lightingProfiles[quality];
  const garden = cameraMode === "garden";
  // Focus the same 2048 map on the room being inspected: finer contact edges
  // without allocating a 4096/8192 framebuffer on Safari.
  const shadowTarget = useMemo(() => {
    const target = new THREE.Object3D();
    const zone = house.zones.find((entry) => entry.id === selectedZone);
    if (cameraMode === "room" && zone) target.position.set(zone.x + zone.width / 2 - CX, 0, zone.z + zone.depth / 2 - CZ);
    return target;
  }, [cameraMode, selectedZone]);
  const shadowSpan = cameraMode === "room" ? 5 : 13;

  // Overview and garden are both exterior presentations. Keeping this policy
  // separate from the route name prevents overview from falling back to the
  // interior fill recipe while preserving room/plan lighting.
  const exterior = garden || cameraMode === "overview";
  // Keep one-shot captures free of loader-store subscriptions. Drei's progress
  // store can publish synchronously while a child PlantBatch is rendering,
  // which would update LightingRig during PlantBatch render. Scene navigation,
  // quality and finish keys still remount the capture deterministically.
  // Committed interior assets also request a batched geometry revision.
  const gardenSun = useMemo(() => sun.color.clone().lerp(new THREE.Color("#fff4df"), 0.3), [sun.color]);
  // Practical fixtures are part of the house presentation, not a room-only
  // debug aid. Keep a low daytime contribution so windows and pergola remain
  // natural, then let the warm interior and exterior luminaires carry the
  // composition after sunset.
  const practicalLevel = designMode && houseLightsOn ? 0.18 + (1 - sun.daylight) * 0.52 : 0;
  const eveningBounce = houseLightsOn ? 1 - sun.daylight : 0;
  const overviewEvening = cameraMode === "overview" ? eveningBounce : 0;
  // Point fixtures are cheap and remain essential in the light quality profile:
  // omitting them made an evening overview read as a completely unlit house.
  const housePracticals = designMode;
  return (
    <>
      <color attach="background" args={[designMode ? sun.sky : "#e5e5ea"]} />
      <fog attach="fog" args={[designMode ? exterior ? new THREE.Color("#625b58").lerp(new THREE.Color("#d7d6cc"), sun.daylight * 0.92).multiplyScalar(sun.daylight) : sun.sky : "#e5e5ea", 25, 49]} />
      {designMode && sun.daylight > 0 && <SkyDome sunDirection={sun.direction} daylight={sun.daylight} garden={exterior} />}
      {designMode && sun.daylight > 0 && (
        // Neutral sky bounce keeps oak/plaster distinct; window light supplies
        // the warm/cool directionality instead of a uniform brown ambient wash.
        <Environment key={`daylight-${sunHour}-${exterior}`} resolution={profile.environmentResolution} frames={1} environmentIntensity={sun.daylight * (exterior ? gardenLighting.environmentIntensity : interiorLighting.environment)}>
          <color attach="background" args={[exterior ? "#9c8e80" : interiorLighting.environmentColor]} />
          <Lightformer form="rect" intensity={sun.daylight * 2.1} color={sun.color} scale={[18, 5, 1]} position={sun.position} />
          <Lightformer form="rect" intensity={sun.daylight * 1.15} color="#fff9ef" scale={[20, 16, 1]} position={[0, 14, 0]} rotation-x={Math.PI / 2} />
          <Lightformer form="rect" intensity={sun.daylight * 0.62} color="#eee0cb" scale={[20, 20, 1]} position={[0, -8, 0]} rotation-x={-Math.PI / 2} />
          <Lightformer form="rect" intensity={sun.daylight * 1.5} color="#fff1d2" scale={[7, 4, 1]} position={[0, 2, -7]} rotation-y={Math.PI} />
        </Environment>
      )}
      <hemisphereLight args={[exterior ? "#c9c8c1" : interiorLighting.skyColor, exterior ? "#9d7957" : interiorLighting.groundColor, designMode ? exterior ? sun.daylight * (gardenLighting.hemisphereBase + gardenLighting.hemisphereDaylight) + overviewEvening * interiorLighting.eveningHemisphere : sun.daylight * interiorLighting.hemisphere + eveningBounce * interiorLighting.eveningHemisphere : 1.1]} />
      <ambientLight color={exterior ? "#ffffff" : "#fff4e5"} intensity={designMode ? exterior ? sun.daylight * (gardenLighting.ambientBase + gardenLighting.ambientDaylight) + overviewEvening * interiorLighting.eveningAmbient : sun.daylight * interiorLighting.ambient + eveningBounce * interiorLighting.eveningAmbient : 0.45} />
      <primitive object={shadowTarget} />
      <directionalLight target={shadowTarget} position={designMode ? [sun.position[0] + shadowTarget.position.x, sun.position[1], sun.position[2] + shadowTarget.position.z] : [9, 13, 6]} intensity={designMode ? sun.intensity * (garden ? gardenLighting.directMultiplier : 0.82) : 2.3} color={designMode ? garden ? gardenSun : sun.color : "#fff1dc"} castShadow={!designMode || sun.daylight > 0} shadow-mapSize-width={profile.shadowMap} shadow-mapSize-height={profile.shadowMap} shadow-camera-left={-shadowSpan} shadow-camera-right={shadowSpan} shadow-camera-top={shadowSpan} shadow-camera-bottom={-shadowSpan} shadow-camera-far={45} shadow-bias={garden ? -0.00018 : -0.00025} shadow-normalBias={garden ? 0.012 : 0.025} shadow-radius={quality === "high" ? 1.7 : 1} />
      <directionalLight position={designMode ? [9, 6, 7] : [-8, 6, -6]} intensity={designMode ? exterior ? sun.daylight * (gardenLighting.fillBase + gardenLighting.fillDaylight) : sun.daylight * interiorLighting.directionalFill : 0.55} color={designMode ? exterior ? "#d0c5b5" : "#fff5e5" : "#d8d1c5"} />
      {housePracticals && houseLightingFixtures.filter(fixture => cameraMode !== "room" || fixture.zone === selectedZone || (["central-core", "north-extension"].includes(selectedZone) && ["central-core", "north-extension"].includes(fixture.zone))).map((fixture) => (
        <PracticalFixture key={fixture.id} fixture={fixture} level={practicalLevel} quality={quality} />
      ))}
      {designMode && <ContactShadows name="scene-contact-shadows" userData={{ geometryRevision }} frames={1} key={`${geometryRevision}-${floorFinish}-${cameraMode}-${quality}-${landscapeReady}-${selectedZone}-${removedFurniture.join(",")}-${furnitureSignature}`} position={exterior ? [0, gardenLighting.contactElevationCm / 100, 0] : kitchenRoom ? [-0.2, 0.103, -4.0] : [0, 0.103, 0]} scale={exterior ? gardenLighting.contactSpanCm / 100 : kitchenRoom ? 6 : 17} resolution={exterior ? quality === "high" ? gardenLighting.highContactResolution : gardenLighting.lightContactResolution : profile.contactResolution} blur={exterior ? 1.3 : quality === "high" ? 2.5 : 2.6} far={exterior ? gardenLighting.contactFarCm / 100 : 2.4} opacity={exterior ? gardenLighting.contactOpacity : interiorLighting.contactOpacity} color="#62594f" />}
    </>
  );
});
