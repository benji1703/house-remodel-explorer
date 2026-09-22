"use client";

import * as THREE from "three";
import { houseLightingFixtures, wetAreaLighting } from "@/data/lighting";
import { CX, CZ } from "../rooms/shared";

/** A restrained overhead layer that makes the proposed lighting strategy legible
 * in the measured plan view. It is presentation information, not a ceiling plan. */
export function LightingPlanMarkers({ visible, lightsOn, nightFactor }: { visible: boolean; lightsOn: boolean; nightFactor: number }) {
  if (!visible) return null;
  const opacity = lightsOn ? 0.22 + nightFactor * 0.5 : 0.06;
  return <group name="Proposed lighting plan markers" userData={{ lightingProposal: true }}>
    {[...houseLightingFixtures, ...wetAreaLighting].map((fixture) => {
      const [x, z] = fixture.positionCm;
      return <group key={fixture.id} position={[x / 100 - CX, 2.56, z / 100 - CZ]}>
        <mesh rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.34, 32]} />
          <meshBasicMaterial color={fixture.color} transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.28, 0.34, 32]} />
          <meshBasicMaterial color={fixture.color} transparent opacity={Math.min(0.8, opacity + 0.18)} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>;
    })}
  </group>;
}
