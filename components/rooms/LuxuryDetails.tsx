"use client";

import { MeshReflectorMaterial, RoundedBox, useTexture } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Blk, Cyl, CX, CZ, SoftBox, WallAttachment } from "./shared";
import type { Palette } from "./shared";
import { createTextileBump } from "@/lib/textileTexture";

const BRUSHED_BRASS = new THREE.MeshPhysicalMaterial({
  color: "#8b7453",
  metalness: 0.82,
  roughness: 0.28,
  clearcoat: 0.22,
  envMapIntensity: 1.55,
});

const OXIDISED_BRONZE = new THREE.MeshPhysicalMaterial({
  color: "#34362f",
  metalness: 0.7,
  roughness: 0.34,
  clearcoat: 0.12,
  envMapIntensity: 1.4,
});

const PAPER = new THREE.MeshStandardMaterial({ color: "#e8ddcc", roughness: 0.94 });
const CLAY = new THREE.MeshPhysicalMaterial({ color: "#9a6548", roughness: 0.84, clearcoat: 0.05 });
const DEEP_GREEN = new THREE.MeshPhysicalMaterial({ color: "#1f3a31", roughness: 0.48, clearcoat: 0.16 });
const LINEN = new THREE.MeshPhysicalMaterial({
  color: "#d9cfbe",
  roughness: 1,
  sheen: 0.72,
  sheenColor: new THREE.Color("#fff8ec"),
  sheenRoughness: 0.86,
  bumpMap: createTextileBump(),
  bumpScale: 0.0008,
});
const SHEER = new THREE.MeshPhysicalMaterial({
  color: "#f7f0e4",
  roughness: 0.92,
  sheen: 0.6,
  sheenColor: new THREE.Color("#fff9ef"),
  bumpMap: LINEN.bumpMap,
  bumpScale: 0.0006,
  side: THREE.DoubleSide,
});
const TV_FRAME = new THREE.MeshPhysicalMaterial({ color: "#191a17", metalness: 0.45, roughness: 0.22, clearcoat: 0.6 });
const TV_SCREEN = new THREE.MeshPhysicalMaterial({ color: "#181d1c", roughness: 0.16, metalness: 0.3, clearcoat: 0.6 });

const GRASS = new THREE.MeshStandardMaterial({ color: "#b6a58d", roughness: 0.97 });
const GRAVEL = new THREE.MeshStandardMaterial({ color: "#b8aa91", roughness: 1 });
const SOIL = new THREE.MeshStandardMaterial({ color: "#40392f", roughness: 1 });
const BARK = new THREE.MeshStandardMaterial({ color: "#6b5945", roughness: 0.96 });
const OLIVE = new THREE.MeshStandardMaterial({ color: "#6e8064", roughness: 0.92 });

type Wall = "north" | "south" | "east" | "west";

/** Slim, switched-off television; no repeated placeholder artwork. */
export function ArtTV({
  base,
  x,
  z,
  wall,
  width = 1.18,
  height = 0.7,
}: {
  base: number;
  x: number;
  z: number;
  wall: Wall;
  width?: number;
  height?: number;
}) {
  const alongX = wall === "north" || wall === "south";
  const inward = wall === "north" ? 1 : wall === "south" ? -1 : wall === "west" ? 1 : -1;
  const rotation = alongX ? (inward < 0 ? Math.PI : 0) : inward * Math.PI / 2;
  return (
    <WallAttachment x={x} z={z} wall={wall}>
    <group
      position={[
        x - CX + (alongX ? 0 : inward * 0.035),
        base + 1.38,
        z - CZ + (alongX ? inward * 0.035 : 0),
      ]}
      rotation-y={rotation}
    >
      <mesh material={TV_FRAME} castShadow>
        <boxGeometry args={[width, height, 0.052]} />
      </mesh>
      <mesh position={[0, 0, 0.031]} material={TV_SCREEN}>
        <boxGeometry args={[width - 0.07, height - 0.07, 0.012]} />
      </mesh>
      <mesh position={[0, -height / 2 - 0.028, 0]} material={TV_FRAME}>
        <boxGeometry args={[0.18, 0.018, 0.06]} />
      </mesh>
    </group>
    </WallAttachment>
  );
}

export function ArtPanel({
  base,
  x,
  z,
  wall,
  width = 0.82,
  height = 0.92,
}: {
  base: number;
  x: number;
  z: number;
  wall: Wall;
  width?: number;
  height?: number;
}) {
  const alongX = wall === "north" || wall === "south";
  const frameW = alongX ? width : 0.035;
  const frameD = alongX ? 0.035 : width;
  const artW = alongX ? width - 0.065 : 0.018;
  const artD = alongX ? 0.018 : width - 0.065;
  // Keep the artwork on the room-facing side of its backing so it reads as a
  // framed piece instead of a dark, solid wall slab in cutaway views.
  const inward = wall === "north" ? 1 : wall === "south" ? -1 : wall === "west" ? 1 : -1;
  return (
    <group>
      <SoftBox x={x} z={z} y={base + 1.05} w={frameW} d={frameD} h={height} radius={0.018} material={OXIDISED_BRONZE} />
      <SoftBox x={x + (alongX ? 0 : inward * 0.022)} z={z + (alongX ? inward * 0.022 : 0)} y={base + 1.085} w={artW} d={artD} h={height - 0.07} radius={0.01} material={PAPER} />
      <SoftBox
        x={x + (alongX ? width * 0.12 : inward * 0.032)}
        z={z + (alongX ? inward * 0.032 : width * 0.12)}
        y={base + 1.22}
        w={alongX ? width * 0.42 : 0.011}
        d={alongX ? 0.011 : width * 0.42}
        h={height * 0.42}
        radius={0.005}
        material={DEEP_GREEN}
      />
    </group>
  );
}

export function WallMirror({
  base,
  x,
  z,
  wall,
  width = 0.82,
  height = 0.9,
  reflect = false,
}: {
  base: number;
  x: number;
  z: number;
  wall: Wall;
  width?: number;
  height?: number;
  reflect?: boolean;
}) {
  const alongX = wall === "north" || wall === "south";
  const inward = wall === "north" ? 1 : wall === "south" ? -1 : wall === "west" ? 1 : -1;
  return (
    <WallAttachment x={x} z={z} wall={wall}>
      <SoftBox x={x} z={z} y={base + 1.13} w={alongX ? width + 0.04 : 0.03} d={alongX ? 0.03 : width + 0.04} h={height + 0.04} radius={0.035} material={BRUSHED_BRASS} />
      <mesh position={[x - CX + (alongX ? 0 : inward * 0.022), base + 1.15 + height / 2, z - CZ + (alongX ? inward * 0.022 : 0)]} rotation-y={alongX ? (inward < 0 ? Math.PI : 0) : inward * Math.PI / 2}>
        <planeGeometry args={[width, height]} />
        {reflect ? <MeshReflectorMaterial resolution={512} mirror={1} mixStrength={1} mixBlur={0} blur={[0, 0]} color="#f5f5f2" metalness={0} roughness={0.03} depthScale={0} />
          : <meshPhysicalMaterial color="#d7dfdc" metalness={1} roughness={0.06} envMapIntensity={1} />}
      </mesh>
    </WallAttachment>
  );
}

export function RoundRug({
  base,
  x,
  z,
  radius = 0.75,
  scaleZ = 1,
}: {
  base: number;
  x: number;
  z: number;
  radius?: number;
  scaleZ?: number;
}) {
  return (
    <mesh
      position={[x - CX, base + 0.012, z - CZ]}
      scale={[1, 1, scaleZ]}
      material={LINEN}
      receiveShadow
    >
      <cylinderGeometry args={[radius, radius, 0.018, 64]} />
    </mesh>
  );
}

export function BedroomRug({ base, x, z, w = 2.45, d = 2.75 }: { base: number; x: number; z: number; w?: number; d?: number }) {
  return <SoftBox x={x} z={z} y={base + 0.005} w={w} d={d} h={0.022} radius={0.09} material={LINEN} />;
}

export function Bench({
  base,
  palette,
  x,
  z,
  along = "x",
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
  along?: "x" | "z";
}) {
  const w = along === "x" ? 1.15 : 0.42;
  const d = along === "x" ? 0.42 : 1.15;
  return (
    <group>
      <SoftBox x={x} z={z} y={base + 0.34} w={w} d={d} h={0.12} radius={0.055} material={palette.upholstery} />
      {[-1, 1].map((side) => (
        <Blk
          key={side}
          x={x + (along === "x" ? side * 0.42 : 0)}
          z={z + (along === "z" ? side * 0.42 : 0)}
          y={base}
          w={along === "x" ? 0.045 : 0.3}
          d={along === "x" ? 0.3 : 0.045}
          h={0.35}
          material={BRUSHED_BRASS}
        />
      ))}
    </group>
  );
}

export function SideTable({ base, palette, x, z }: { base: number; palette: Palette; x: number; z: number }) {
  return (
    <group>
      <Cyl x={x} z={z} y={base} r={0.12} h={0.43} segments={36} material={BRUSHED_BRASS} />
      <Cyl x={x} z={z} y={base + 0.43} r={0.28} h={0.045} segments={48} material={palette.stone} />
    </group>
  );
}

export function DecorTray({ base, x, z, palette }: { base: number; x: number; z: number; palette: Palette }) {
  return (
    <group>
      <Cyl x={x} z={z} y={base} r={0.2} h={0.018} segments={44} material={BRUSHED_BRASS} />
      <Cyl x={x - 0.07} z={z} y={base + 0.018} r={0.045} h={0.14} segments={30} material={CLAY} />
      <Cyl x={x + 0.07} z={z + 0.025} y={base + 0.018} r={0.038} h={0.09} segments={30} material={palette.charcoal} />
    </group>
  );
}

export function DraperyPair({ base, x, z, wall, span = 1.5 }: { base: number; x: number; z: number; wall: Wall; span?: number }) {
  const alongX = wall === "north" || wall === "south";
  const inward = wall === "north" || wall === "west" ? 1 : -1;
  const geometry = useMemo(() => {
    const cloth = new THREE.PlaneGeometry(0.28, 2.3, 36, 28);
    const positions = cloth.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const u = positions.getX(i) / 0.28 + 0.5;
      const v = positions.getY(i) / 2.3 + 0.5;
      positions.setZ(i, Math.sin(u * Math.PI * 10) * (0.018 + (1 - v) * 0.012));
      positions.setY(i, positions.getY(i) + Math.sin(u * Math.PI * 10) * 0.006 * (1 - v));
    }
    cloth.computeVertexNormals();
    return cloth;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <WallAttachment x={x} z={z} wall={wall}>
      <Blk x={x + (alongX ? 0 : inward * 0.045)} z={z + (alongX ? inward * 0.045 : 0)} y={base + 2.345} w={alongX ? span + 0.6 : 0.035} d={alongX ? 0.035 : span + 0.6} h={0.02} material={BRUSHED_BRASS} />
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[x - CX + (alongX ? side * (span / 2 + 0.15) : inward * 0.05), base + 1.195, z - CZ + (alongX ? inward * 0.05 : side * (span / 2 + 0.15))]}
          rotation-y={alongX ? 0 : Math.PI / 2}
          geometry={geometry}
          material={SHEER}
          receiveShadow
        />
      ))}
    </WallAttachment>
  );
}

function LeafCanopy({ scale }: { scale: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const transform = new THREE.Object3D();
    const color = new THREE.Color();
    const random = (i: number, seed: number) => {
      const n = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
      return n - Math.floor(n);
    };
    const clusters = [[-0.28, 1.38, 0.02, 0.46], [0.22, 1.48, -0.05, 0.5], [0, 1.76, 0.18, 0.52], [-0.12, 1.68, -0.28, 0.43], [0.32, 1.75, 0.28, 0.38]];
    for (let i = 0; i < 1400; i++) {
      const [x, y, z, radius] = clusters[i % clusters.length];
      const theta = random(i, 1) * Math.PI * 2;
      const vertical = random(i, 2) * 2 - 1;
      const radial = Math.cbrt(random(i, 3)) * radius;
      const horizontal = Math.sqrt(1 - vertical * vertical) * radial;
      transform.position.set((x + Math.cos(theta) * horizontal * 1.15) * scale, (y + vertical * radial * 0.72) * scale, (z + Math.sin(theta) * horizontal) * scale);
      transform.rotation.set(random(i, 4) * Math.PI, random(i, 5) * Math.PI, random(i, 6) * Math.PI);
      const size = (0.045 + random(i, 7) * 0.04) * scale;
      transform.scale.set(size, size * 0.075, size * 0.38);
      transform.updateMatrix();
      mesh.setMatrixAt(i, transform.matrix);
      color.setHSL(0.22 + random(i, 8) * 0.035, 0.15 + random(i, 9) * 0.12, 0.3 + random(i, 10) * 0.2);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [scale]);
  return <instancedMesh ref={ref} args={[undefined, undefined, 1400]} material={OLIVE} castShadow receiveShadow>
    <sphereGeometry args={[1, 8, 4]} />
  </instancedMesh>;
}

function CanopyTree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group>
      <Cyl x={x} z={z} y={-0.02} r={0.1 * scale} h={1.65 * scale} segments={16} material={BARK} />
      <group position={[x - CX, 0, z - CZ]}><LeafCanopy scale={scale} /></group>
    </group>
  );
}

function GroundcoverMound({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group>
      <Cyl x={x} z={z} y={-0.025} r={0.32 * scale} h={0.07} segments={24} material={SOIL} />
      <MyrtleCluster x={x} z={z} scale={scale * 0.55} />
    </group>
  );
}

function MyrtleCluster({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  const source = useTexture("/textures/myrtle-foliage.png");
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    map: source,
    color: "#718064",
    roughness: 0.94,
    transparent: true,
    alphaTest: 0.42,
    side: THREE.DoubleSide,
    depthWrite: true,
  }), [source]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <group position={[x - CX, 0.48 * scale, z - CZ]} scale={scale} rotation-y={(x * 2.3 + z * 4.1) % Math.PI}>
      {[0, Math.PI / 2, Math.PI / 4].map((rotation) => (
        <mesh key={rotation} rotation-y={rotation} material={material} castShadow>
          <planeGeometry args={[0.9, 0.95]} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Non-architectural site dressing. It stays outside the measured wall model:
 * gravel, a path to the surveyed east entry, and restrained Mediterranean
 * planting give the dollhouse a believable landscape datum.
 */
export function MediterraneanLandscape({ palette, quality }: { palette: Palette; quality: "high" | "light" }) {
  const pavers = quality === "high" ? 6 : 4;
  const beds = quality === "high"
    ? [[-2.6, 1.2], [-1.9, 2.4], [12.6, 2.2], [13.1, 8.3], [11.9, 13.25], [5.5, 13.35]]
    : [[-2.6, 1.2], [12.6, 2.2], [13.1, 8.3], [5.5, 13.35]];

  return (
    <group>
      <mesh position={[0, -0.13, 0]} rotation-x={-Math.PI / 2} material={GRASS} receiveShadow>
        <planeGeometry args={[32, 30]} />
      </mesh>
      {/* RoundedBox applies one radius to every axis. A landscape-sized radius
          on this 8 cm slab balloons the bevel above FFL and reads as a roof.
          Keep the edge radius physically smaller than half the slab height. */}
      <RoundedBox args={[19, 0.08, 17.5]} position={[0, -0.075, 0.2]} radius={0.032} smoothness={4} material={GRAVEL} receiveShadow />

      {Array.from({ length: pavers }, (_, index) => (
        <SoftBox
          key={index}
          x={8.25 + index * 0.82}
          z={3.18}
          y={-0.035}
          w={0.64}
          d={0.88}
          h={0.055}
          radius={0.035}
          material={palette.stone}
        />
      ))}

      <CanopyTree x={-2.9} z={2.7} scale={1.12} />
      <CanopyTree x={13.3} z={9.2} scale={1.03} />
      {quality === "high" && <CanopyTree x={7.1} z={14.15} scale={0.86} />}
      {beds.map(([x, z], index) => (
        <group key={`${x}-${z}`}>
          <GroundcoverMound x={x} z={z} scale={0.86 + (index % 3) * 0.12} />
          {index % 2 === 0 && <MyrtleCluster x={x + 0.42} z={z + 0.18} scale={0.72 + (index % 3) * 0.08} />}
        </group>
      ))}

      {quality === "high" && (
        <>
          <pointLight position={[-2.9 - CX, 0.22, 2.7 - CZ]} intensity={1.6} distance={4.2} decay={2} color="#ffb56e" />
          <pointLight position={[13.3 - CX, 0.22, 9.2 - CZ]} intensity={1.4} distance={4} decay={2} color="#ffb56e" />
        </>
      )}
    </group>
  );
}
