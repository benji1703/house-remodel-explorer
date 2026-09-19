"use client";

import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Blk, Cyl, CX, CZ, SoftBox, WallAttachment } from "./shared";
import type { Palette } from "./shared";
import { WallMirror } from "./LuxuryDetails";
import { ensuiteProposal } from "@/data/ensuite";

/**
 * Built-to-measure sanitaryware. Geometry stays inside the surveyed room
 * envelopes while the fixtures use layered forms and physically plausible
 * finishes rather than the original box placeholders.
 */

type Wall = "n" | "s" | "e" | "w";

const CERAMIC = new THREE.MeshPhysicalMaterial({
  color: "#fffdfa",
  roughness: 0.17,
  clearcoat: 0.82,
  clearcoatRoughness: 0.12,
  envMapIntensity: 1.35,
});

const CERAMIC_INNER = new THREE.MeshPhysicalMaterial({
  color: "#dce5e3",
  roughness: 0.22,
  clearcoat: 0.72,
  clearcoatRoughness: 0.1,
  envMapIntensity: 1.15,
});

const CHROME = new THREE.MeshPhysicalMaterial({
  color: "#5e4937",
  roughness: 0.28,
  metalness: 0.82,
  clearcoat: 0.18,
  clearcoatRoughness: 0.22,
  envMapIntensity: 1.55,
});

const SHOWER_GLASS = new THREE.MeshPhysicalMaterial({
  color: "#dcebea",
  roughness: 0.055,
  transmission: 0.94,
  transparent: true,
  opacity: 0.2,
  thickness: 0.008,
  ior: 1.48,
  envMapIntensity: 1.65,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const MIRROR = new THREE.MeshPhysicalMaterial({
  color: "#dce2df",
  roughness: 0.055,
  metalness: 0.76,
  clearcoat: 0.45,
  envMapIntensity: 2.1,
});

const WATER = new THREE.MeshPhysicalMaterial({
  color: "#cbdedc",
  roughness: 0.08,
  transmission: 0.72,
  transparent: true,
  opacity: 0.72,
  thickness: 0.01,
  envMapIntensity: 1.45,
});

const DARK_GAP = new THREE.MeshStandardMaterial({ color: "#393a36", roughness: 0.62 });

// Closed revolved profiles give sanitaryware a real ceramic thickness and
// recessed interior; no opaque disk or solid sphere fills the opening.
const TOILET_PROFILE = [
  [0.08, 0.02], [0.14, 0.04], [0.20, 0.13], [0.222, 0.25],
  [0.219, 0.275], [0.188, 0.275], [0.178, 0.23], [0.14, 0.15],
  [0.065, 0.10], [0, 0.10], [0, 0.02], [0.08, 0.02],
].map(([r, y]) => new THREE.Vector2(r, y));
const BASIN_PROFILE = [
  [0, 0], [0.09, 0], [0.145, 0.025], [0.178, 0.075],
  [0.18, 0.11], [0.17, 0.116], [0.16, 0.108], [0.154, 0.072],
  [0.125, 0.04], [0.07, 0.022], [0, 0.022], [0, 0],
].map(([r, y]) => new THREE.Vector2(r, y));

function wallRotation(against: Wall) {
  if (against === "s") return Math.PI;
  if (against === "w") return Math.PI / 2;
  if (against === "e") return -Math.PI / 2;
  return 0;
}

function ToiletBowl({ wallHung }: { wallHung: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.18, 0.46]} scale={[0.78, 1, 1.08]} material={CERAMIC} castShadow receiveShadow>
        <latheGeometry args={[TOILET_PROFILE, 64]} />
      </mesh>
      <mesh position={[0, 0.455, 0.46]} rotation-x={-Math.PI / 2} scale={[0.78, 1.08, 1]} material={CERAMIC} castShadow>
        <torusGeometry args={[0.19, 0.029, 14, 48]} />
      </mesh>
      <mesh position={[0, 0.292, 0.46]} rotation-x={-Math.PI / 2} scale={[0.76, 1.02, 1]} material={WATER}>
        <circleGeometry args={[0.078, 40]} />
      </mesh>
      <mesh position={[0, 0.482, 0.455]} rotation-x={-Math.PI / 2} scale={[0.79, 1.08, 1]} material={CERAMIC} castShadow>
        <torusGeometry args={[0.205, 0.014, 10, 48]} />
      </mesh>
      <RoundedBox
        args={wallHung ? [0.25, 0.18, 0.33] : [0.23, 0.25, 0.32]}
        position={wallHung ? [0, 0.32, 0.165] : [0, 0.135, 0.40]}
        radius={0.035}
        smoothness={5}
        material={CERAMIC}
        castShadow
        receiveShadow
      />
    </group>
  );
}

/** Distinct wall-hung or close-coupled WC, oriented from the wall into the room. */
function Toilet({
  base,
  x,
  z,
  against,
  wallHung = false,
  projection,
}: {
  base: number;
  x: number;
  z: number;
  against: Wall;
  wallHung?: boolean;
  projection?: number;
}) {
  return (
    <group position={[x - CX, base, z - CZ]} rotation-y={wallRotation(against)}>
      {!wallHung && (
        <>
          <RoundedBox
            args={[0.41, 0.7, 0.18]}
            position={[0, 0.47, 0.095]}
            radius={0.045}
            smoothness={5}
            material={CERAMIC}
            castShadow
            receiveShadow
          />
          <mesh position={[0, 0.83, 0.085]} material={CHROME} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.008, 28]} />
          </mesh>
        </>
      )}
      {wallHung && (
        <WallAttachment x={x} z={z} wall={against === "n" ? "north" : against === "s" ? "south" : against === "e" ? "east" : "west"}>
          <RoundedBox
            args={[0.24, 0.015, 0.15]}
            position={[0, 0.93, 0.006]}
            rotation-x={Math.PI / 2}
            radius={0.012}
            smoothness={4}
            material={CHROME}
            castShadow
          />
          {[-0.047, 0.047].map((offset) => (
            <mesh key={offset} position={[offset, 0.93, 0.017]} rotation-x={Math.PI / 2} material={CERAMIC_INNER}>
              <circleGeometry args={[0.022, 24]} />
            </mesh>
          ))}
        </WallAttachment>
      )}
      <group scale-z={projection ? projection / 0.704 : 1}>
        <ToiletBowl wallHung={wallHung} />
      </group>
    </group>
  );
}

function ShowerProfile({ x, z, y, h }: { x: number; z: number; y: number; h: number }) {
  return <Cyl x={x} z={z} y={y} r={0.008} h={h} segments={18} material={CHROME} />;
}

function ShowerGlass({ x, z, y, w, d, h }: { x: number; z: number; y: number; w: number; d: number; h: number }) {
  return <mesh position={[x - CX, y + h / 2, z - CZ]} material={SHOWER_GLASS}>
    <boxGeometry args={[w, h, d]} />
  </mesh>;
}

/** 90 × 90 shower with low tray, framed glass, drain and complete brassware. */
function Shower({
  base,
  palette,
  x,
  z,
  screens,
  size = 0.9,
  cornerEntry = false,
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
  screens: { west?: boolean; east?: boolean; north?: boolean; south?: boolean };
  size?: number;
  cornerEntry?: boolean;
}) {
  const glassH = 1.95;
  const tray = size;
  const half = tray / 2;
  const glassT = 0.008;
  const glassY = base + 0.055;
  return (
    <group>
      <SoftBox x={x} z={z} y={base} w={tray} d={tray} h={0.045} radius={0.045} material={CERAMIC} />
      <SoftBox x={x} z={z} y={base + 0.044} w={tray - 0.055} d={tray - 0.055} h={0.012} radius={0.035} material={palette.stone} />
      <SoftBox x={x} z={z + 0.31} y={base + 0.057} w={0.54} d={0.025} h={0.009} radius={0.009} material={CHROME} />

      {screens.west && <ShowerGlass x={x - half + 0.012} z={z} y={glassY} w={glassT} d={tray - 0.045} h={glassH} />}
      {screens.east && <ShowerGlass x={x + half - 0.012} z={z} y={glassY} w={glassT} d={tray - 0.045} h={glassH} />}
      {screens.north && <ShowerGlass x={x} z={z - half + 0.012} y={glassY} w={tray - 0.045} d={glassT} h={glassH} />}
      {screens.south && <ShowerGlass x={x} z={z + half - 0.012} y={glassY} w={tray - 0.045} d={glassT} h={glassH} />}

      {/* Two fixed return panels leave the southwest corner open. The sliding
          leaves are shown retracted; no door swings into the toilet or entry. */}
      {cornerEntry && <>
        <ShowerGlass x={x - half + 0.012} z={z - tray * 0.25} y={glassY} w={glassT} d={tray * 0.48} h={glassH} />
        <ShowerGlass x={x + tray * 0.25} z={z + half - 0.012} y={glassY} w={tray * 0.48} d={glassT} h={glassH} />
        <Blk x={x} z={z + half - 0.012} y={glassY + glassH} w={tray} d={0.015} h={0.015} material={CHROME} />
        <Blk x={x - half + 0.012} z={z} y={glassY + glassH} w={0.015} d={tray} h={0.015} material={CHROME} />
      </>}

      {[
        [x - half + 0.012, z - half + 0.012],
        [x - half + 0.012, z + half - 0.012],
        [x + half - 0.012, z - half + 0.012],
        [x + half - 0.012, z + half - 0.012],
      ].filter((_, index) => !cornerEntry || index !== 1).map(([profileX, profileZ]) => (
        <ShowerProfile key={`${profileX}-${profileZ}`} x={profileX} z={profileZ} y={glassY} h={glassH} />
      ))}

      {[1.02, 1.17].map((height, index) => (
        <mesh
          key={height}
          position={[x + 0.27 - CX, base + height, z - half + 0.025 - CZ]}
          rotation-x={Math.PI / 2}
          material={index === 0 ? CHROME : CERAMIC_INNER}
          castShadow
        >
          <cylinderGeometry args={[index === 0 ? 0.075 : 0.045, index === 0 ? 0.075 : 0.045, 0.028, 28]} />
        </mesh>
      ))}

      <Cyl x={x + 0.29} z={z - half + 0.045} y={base + 1.25} r={0.009} h={0.55} segments={18} material={CHROME} />
      <mesh position={[x + 0.29 - CX, base + 1.76, z - half + 0.065 - CZ]} rotation-x={0.28} material={CHROME} castShadow>
        <capsuleGeometry args={[0.025, 0.14, 8, 18]} />
      </mesh>
      <mesh position={[x + 0.28 - CX, base + 0.99, z - half + 0.034 - CZ]} rotation-x={Math.PI / 2} material={CHROME}>
        <torusGeometry args={[0.13, 0.006, 8, 34, Math.PI * 1.45]} />
      </mesh>

      <Cyl x={x + 0.24} z={z - half + 0.035} y={base + 1.88} r={0.012} h={0.24} segments={20} material={CHROME} />
      <mesh position={[x + 0.09 - CX, base + 2.1, z - half + 0.035 - CZ]} rotation-z={Math.PI / 2} material={CHROME} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.3, 20]} />
      </mesh>
      <mesh position={[x - 0.07 - CX, base + 2.075, z - half + 0.035 - CZ]} material={CHROME} castShadow>
        <cylinderGeometry args={[0.135, 0.145, 0.025, 40]} />
      </mesh>

      <Cyl x={cornerEntry ? x + 0.025 : x - half + 0.025} z={cornerEntry ? z + half - 0.025 : z + 0.31} y={base + 0.92} r={0.012} h={0.28} segments={18} material={CHROME} />
    </group>
  );
}

function Basin({ base, x, z, compact = false }: { base: number; x: number; z: number; compact?: boolean }) {
  return (
    <group position={[x - CX, base, z - CZ]}>
      <mesh scale={compact ? [1.06, 0.8, 0.63] : [1.3, 1, 0.82]} material={CERAMIC} castShadow receiveShadow>
        <latheGeometry args={[BASIN_PROFILE, 64]} />
      </mesh>
      <mesh position={[0, 0.024, 0]} material={CHROME}>
        <cylinderGeometry args={[0.014, 0.014, 0.006, 20]} />
      </mesh>
    </group>
  );
}

function MixerTap({ base, x, z }: { base: number; x: number; z: number }) {
  return (
    <group>
      <Cyl x={x} z={z} y={base} r={0.018} h={0.2} segments={22} material={CHROME} />
      <mesh position={[x - CX, base + 0.19, z - 0.07 - CZ]} rotation-x={Math.PI / 2} material={CHROME} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.14, 22]} />
      </mesh>
      <mesh position={[x + 0.055 - CX, base + 0.16, z + 0.005 - CZ]} rotation-z={Math.PI / 2} material={CHROME}>
        <cylinderGeometry args={[0.009, 0.009, 0.085, 18]} />
      </mesh>
    </group>
  );
}

/** Floating oak vanity, honed top, hollow vessel basin and aligned mixer. */
function Vanity({
  base,
  palette,
  x,
  z,
  w,
  mirror = true,
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
  w: number;
  mirror?: boolean;
}) {
  const mirrorW = Math.min(w * 0.82, 1.08);
  const cabinetBase = base + 0.16;
  return (
    <group>
      <SoftBox x={x} z={z} y={cabinetBase} w={w} d={0.46} h={0.56} radius={0.035} material={palette.oak} />
      {[0.37, 0.63].map((height) => (
        <group key={height}>
          <Blk x={x} z={z - 0.235} y={base + height} w={w - 0.055} d={0.012} h={0.012} material={DARK_GAP} />
          <Blk x={x} z={z - 0.246} y={base + height + 0.085} w={Math.min(0.22, w * 0.25)} d={0.012} h={0.012} material={CHROME} />
        </group>
      ))}
      <SoftBox x={x} z={z} y={base + 0.72} w={w + 0.035} d={0.51} h={0.035} radius={0.014} material={palette.stone} />
      <Basin base={base + 0.755} x={x - w * 0.1} z={z - 0.02} />
      <MixerTap base={base + 0.755} x={x - w * 0.1} z={z + 0.15} />

      <Cyl x={x - w * 0.34} z={z + 0.12} y={base + 0.77} r={0.025} h={0.11} segments={20} material={CERAMIC_INNER} />
      <Cyl x={x - w * 0.34} z={z + 0.12} y={base + 0.88} r={0.012} h={0.025} segments={16} material={CHROME} />
      <SoftBox x={x + w * 0.34} z={z - 0.07} y={base + 0.77} w={0.2} d={0.14} h={0.026} radius={0.01} material={palette.upholstery} />

      {mirror && (
        <group position={[x - CX, base + 1.42, z + 0.245 - CZ]}>
          <RoundedBox args={[mirrorW + 0.025, 0.74, 0.025]} radius={0.035} smoothness={5} material={CHROME} castShadow />
          <RoundedBox args={[mirrorW, 0.715, 0.012]} position={[0, 0, -0.018]} radius={0.03} smoothness={5} material={MIRROR} />
        </group>
      )}
    </group>
  );
}

/** Main bathroom — wall-hung WC, full shower and wide floating vanity. */
export function MainBathroom({ base, palette, reflections = false }: { base: number; palette: Palette; reflections?: boolean }) {
  return (
    <group>
      {/* Thin stone liners sit entirely inside the wet corner and give the
          shower a quieter, tactile backdrop without altering wall geometry. */}
      <Blk x={6.98} z={10.265} y={base} w={1.12} d={0.025} h={2.16} material={palette.stone} />
      <Blk x={7.535} z={10.74} y={base} w={0.025} d={0.95} h={2.16} material={palette.stone} />

      {/* Fixtures are offset from wall centre-lines to the finished faces so
          flush plates, shower brassware, and joinery never bleed next door. */}
      <Toilet base={base} x={5.02} z={11.05} against="w" wallHung />
      <Shower base={base} palette={palette} x={7.07} z={10.74} screens={{ west: true, south: true }} />
      <Vanity base={base} palette={palette} x={6.05} z={11.72} w={1.35} mirror={false} />
      <WallMirror base={base} x={4.955} z={11.42} wall="west" width={0.64} height={0.76} reflect={reflections} />
      <pointLight position={[5.25 - CX, base + 1.58, 11.42 - CZ]} intensity={0.8} distance={1.8} decay={2} color="#ffd3a0" />
    </group>
  );
}

/** Proposed three-fixture ensuite. The accepted 150 × 190 shell is unchanged. */
export function EnsuiteBathroom({ base, palette, reflections = false }: { base: number; palette: Palette; reflections?: boolean }) {
  const { shower, vanity, wc, cistern } = ensuiteProposal;
  const sx = shower.x / 100, sz = shower.z / 100;
  const vx = vanity.x / 100, vz = vanity.z / 100;
  return (
    <group name="Proposed ensuite fit-out" userData={{ status: ensuiteProposal.status }}>
      <group name={shower.id} userData={{ fixtureId: shower.id }}>
        <WallAttachment x={sx} z={10.26} wall="north">
          <Blk x={sx} z={10.26} y={base} w={0.84} d={0.02} h={2.2} material={palette.stone} />
        </WallAttachment>
        <WallAttachment x={4.84} z={sz} wall="east">
          <Blk x={4.84} z={sz} y={base} w={0.02} d={0.8} h={2.2} material={palette.stone} />
        </WallAttachment>
        <Shower base={base} palette={palette} x={sx} z={sz} size={shower.width / 100} screens={{}} cornerEntry />
      </group>
      <group name={wc.id} userData={{ fixtureId: wc.id }}>
        <WallAttachment x={4.84} z={wc.z / 100} wall="east">
          <SoftBox x={cistern.x / 100} z={cistern.z / 100} y={base} w={cistern.width / 100} d={cistern.depth / 100} h={cistern.height / 100} radius={0.01} material={palette.interior} />
          <SoftBox x={cistern.x / 100} z={cistern.z / 100} y={base + cistern.height / 100} w={cistern.width / 100} d={cistern.depth / 100} h={0.018} radius={0.005} material={palette.stone} />
        </WallAttachment>
        <Toilet base={base} x={wc.wallX / 100} z={wc.z / 100} against="e" wallHung projection={wc.projection / 100} />
      </group>
      <group name={vanity.id} userData={{ fixtureId: vanity.id }}>
        <SoftBox x={vx} z={vz} y={base + 0.31} w={vanity.width / 100} d={vanity.depth / 100} h={0.44} radius={0.015} material={palette.oak} />
        <Blk x={vx} z={vz + 0.163} y={base + 0.51} w={0.44} d={0.006} h={0.008} material={DARK_GAP} />
        <SoftBox x={vx} z={vz} y={base + 0.75} w={vanity.width / 100} d={vanity.depth / 100} h={0.025} radius={0.008} material={palette.stone} />
        <Basin base={base + 0.775} x={vx} z={vz + 0.03} compact />
        <group position={[vx - CX, 0, vz - CZ]} rotation-y={Math.PI}>
          <MixerTap base={base + 0.775} x={CX} z={CZ + 0.11} />
        </group>
        <WallMirror base={base} x={vx} z={10.275} wall="north" width={0.44} height={0.78} reflect={reflections} />
      </group>
      <pointLight position={[vx - CX, base + 1.8, 10.58 - CZ]} intensity={0.9} distance={2.4} decay={2} color="#ffe0b5" />
    </group>
  );
}
