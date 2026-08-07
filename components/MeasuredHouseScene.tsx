"use client";

import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { house, type HouseZone, type ZoneId } from "@/data/house";

type Props = {
  selectedZone: ZoneId;
  onSelectZone: (id: ZoneId) => void;
  designMode: boolean;
  quality: "high" | "light";
};

function FloorPlate({ designMode }: { designMode: boolean }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    house.footprint.forEach(([x, z], index) => {
      const px = x - house.dimensions.maximumWidth / 200;
      const pz = z - house.dimensions.maximumDepth / 200;
      if (index === 0) shape.moveTo(px, pz);
      else shape.lineTo(px, pz);
    });
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  return (
    <mesh geometry={geometry} rotation-x={Math.PI / 2} position-y={0} receiveShadow>
      <meshStandardMaterial
        color={designMode ? "#d8c7ae" : "#bebdb7"}
        roughness={0.92}
        metalness={0}
      />
    </mesh>
  );
}

function Wall({ a, b }: { a: [number, number]; b: [number, number] }) {
  const ax = a[0] - 5.7;
  const az = a[1] - 6.05;
  const bx = b[0] - 5.7;
  const bz = b[1] - 6.05;
  const dx = bx - ax;
  const dz = bz - az;
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);

  return (
    <mesh
      position={[(ax + bx) / 2, 0.18, (az + bz) / 2]}
      rotation-y={-angle}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[length, 0.36, 0.12]} />
      <meshStandardMaterial color="#eee9df" roughness={0.86} />
    </mesh>
  );
}

function Zone({
  zone,
  selected,
  onSelect,
  designMode,
}: {
  zone: HouseZone;
  selected: boolean;
  onSelect: () => void;
  designMode: boolean;
}) {
  // Design-mode palette follows the outdoor moodboard: lime wash, natural
  // oak, light travertine, warm beige/taupe.
  const colors = designMode
    ? ["#c7a36d", "#a9b29a", "#d7b98c", "#b99e7b", "#b8a187", "#9d8976", "#cbb9a0"]
    : ["#9d9e9a", "#a8aaa5", "#989b97", "#b0b0aa", "#a3a49f", "#8c8e8a", "#94958f"];
  const index = house.zones.findIndex((item) => item.id === zone.id);

  return (
    <group>
      <mesh
        position={[
          zone.x + zone.width / 2 - 5.7,
          zone.level / 2 + 0.015,
          zone.z + zone.depth / 2 - 6.05,
        ]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        onPointerEnter={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          document.body.style.cursor = "default";
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[Math.max(zone.width - 0.1, 0.1), zone.level, Math.max(zone.depth - 0.1, 0.1)]} />
        <meshStandardMaterial
          color={selected ? "#e59a50" : colors[index]}
          roughness={0.82}
          emissive={selected ? "#7c3e16" : "#000000"}
          emissiveIntensity={selected ? 0.13 : 0}
        />
      </mesh>
      <Html
        center
        position={[
          zone.x + zone.width / 2 - 5.7,
          zone.level + 0.28,
          zone.z + zone.depth / 2 - 6.05,
        ]}
        distanceFactor={11}
        style={{ pointerEvents: "none" }}
      >
        <span className={selected ? "scene-label is-selected" : "scene-label"}>
          {zone.shortLabel}
        </span>
      </Html>
    </group>
  );
}

export function MeasuredHouseScene({
  selectedZone,
  onSelectZone,
  designMode,
  quality,
}: Props) {
  const walls = house.footprint.map((point, index) => ({
    a: point,
    b: house.footprint[(index + 1) % house.footprint.length],
  }));

  return (
    <Canvas
      dpr={quality === "high" ? [1, 1.75] : [0.75, 1.15]}
      shadows={quality === "high"}
      camera={{ position: [10.4, 9.5, 11.5], fov: 36, near: 0.1, far: 100 }}
      gl={{ antialias: quality === "high", powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#e9e5dc"]} />
      <fog attach="fog" args={["#e9e5dc", 18, 32]} />
      <ambientLight intensity={1.5} />
      <directionalLight
        position={[7, 13, 5]}
        intensity={2.6}
        castShadow={quality === "high"}
        shadow-mapSize-width={quality === "high" ? 2048 : 512}
        shadow-mapSize-height={quality === "high" ? 2048 : 512}
      />
      <FloorPlate designMode={designMode} />
      {house.zones.map((zone) => (
        <Zone
          key={zone.id}
          zone={zone}
          selected={selectedZone === zone.id}
          onSelect={() => onSelectZone(zone.id)}
          designMode={designMode}
        />
      ))}
      {walls.map((wall, index) => (
        <Wall key={index} a={wall.a} b={wall.b} />
      ))}
      <gridHelper args={[24, 24, "#b8b1a5", "#d6d0c5"]} position={[0, -0.025, 0]} />
      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        minDistance={9}
        maxDistance={24}
        minPolarAngle={0.28}
        maxPolarAngle={Math.PI / 2.25}
        enableDamping
        dampingFactor={0.06}
      />
    </Canvas>
  );
}
