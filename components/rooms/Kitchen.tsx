"use client";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { Blk, Cyl, CX, CZ, SoftBox } from "./shared";
import type { Palette } from "./shared";
import { EditableFurniture, type FurnitureEditingState } from "./EditableFurniture";
import { BarStool, Cooktop, FURN, Pendant, PotPlant } from "./furniture";

const WINE_GREEN = new THREE.MeshPhysicalMaterial({
  color: "#263d32",
  roughness: 0.2,
  transmission: 0.28,
  transparent: true,
  opacity: 0.94,
  thickness: 0.035,
  envMapIntensity: 1.5,
});
const WINE_AMBER = new THREE.MeshPhysicalMaterial({
  color: "#65402c",
  roughness: 0.22,
  transmission: 0.22,
  transparent: true,
  opacity: 0.95,
  thickness: 0.035,
  envMapIntensity: 1.4,
});
const WINE_LABEL = new THREE.MeshStandardMaterial({ color: "#e7d7b8", roughness: 0.78 });
const CABINET_LED = new THREE.MeshStandardMaterial({
  color: "#fff2d2",
  emissive: "#ffb45e",
  emissiveIntensity: 3.4,
  toneMapped: false,
});

function KitchenBin({ base, palette, x, z }: { base: number; palette: Palette; x: number; z: number }) {
  return (
    <group>
      <SoftBox x={x} z={z} y={base} w={0.36} d={0.32} h={0.5} radius={0.055} material={palette.charcoal} />
      <SoftBox x={x} z={z} y={base + 0.5} w={0.37} d={0.33} h={0.035} radius={0.016} material={palette.frame} />
      <SoftBox x={x} z={z - 0.166} y={base + 0.07} w={0.13} d={0.018} h={0.025} radius={0.01} material={palette.frame} />
    </group>
  );
}

function KitchenSink({ base, palette, x, z }: { base: number; palette: Palette; x: number; z: number }) {
  const counter = base + 0.947;
  return (
    <group>
      <SoftBox x={x} z={z} y={counter} w={0.64} d={0.43} h={0.018} radius={0.045} material={palette.frame} />
      <SoftBox x={x} z={z + 0.015} y={counter + 0.012} w={0.55} d={0.34} h={0.015} radius={0.055} material={palette.charcoal} />
      <Cyl x={x} z={z - 0.2} y={counter + 0.02} r={0.018} h={0.29} segments={20} material={palette.frame} />
      <mesh
        position={[x - CX, counter + 0.3, z - CZ - 0.13]}
        rotation-x={Math.PI / 2}
        material={palette.frame}
        castShadow
      >
        <cylinderGeometry args={[0.016, 0.016, 0.14, 20]} />
      </mesh>
    </group>
  );
}

function BuiltInOven({ base, palette, x, z }: { base: number; palette: Palette; x: number; z: number }) {
  return (
    <group>
      <SoftBox x={x} z={z} y={base + 0.17} w={0.62} d={0.025} h={0.62} radius={0.018} material={palette.charcoal} />
      <SoftBox x={x} z={z - 0.016} y={base + 0.27} w={0.5} d={0.012} h={0.34} radius={0.012} material={palette.glass} />
      <mesh position={[x - CX, base + 0.71, z - CZ - 0.035]} rotation-z={Math.PI / 2} material={palette.frame}>
        <cylinderGeometry args={[0.012, 0.012, 0.48, 16]} />
      </mesh>
      {[-0.18, -0.06, 0.06, 0.18].map((offset) => (
        <Cyl key={offset} x={x + offset} z={z - 0.035} y={base + 0.74} r={0.018} h={0.025} segments={16} material={palette.frame} />
      ))}
    </group>
  );
}

function TallPantry({
  base,
  palette,
  x,
  z,
  w = 0.28,
}: {
  base: number;
  palette: Palette;
  x: number;
  z: number;
  w?: number;
}) {
  const h = 2.23;
  return (
    <group>
      <Blk x={x} z={z} y={base + 0.02} w={w - 0.08} d={0.54} h={0.08} material={palette.charcoal} />
      <SoftBox x={x} z={z} y={base + 0.08} w={w} d={0.65} h={h - 0.08} radius={0.025} material={palette.oak} />
      <SoftBox x={x} z={z + 0.331} y={base + 0.12} w={w - 0.035} d={0.018} h={h - 0.2} radius={0.008} material={palette.oak} />
      {[0.72, 1.45].map((height) => (
        <Blk key={height} x={x} z={z + 0.344} y={base + height} w={w - 0.055} d={0.012} h={0.012} material={palette.charcoal} />
      ))}
      <Blk x={x - w / 2 + 0.055} z={z + 0.352} y={base + 0.4} w={0.014} d={0.012} h={1.45} material={palette.charcoal} />
    </group>
  );
}

function WineCabinet({ base, palette }: { base: number; palette: Palette }) {
  const x = 6.84;
  const z = 0.25;
  const bottom = base + 1.1;
  const h = 1.12;
  const shelves = [0.08, 0.39, 0.7, 1.01];
  const bottles = [
    [-0.25, 0, WINE_GREEN], [-0.08, 0, WINE_AMBER], [0.1, 0, WINE_GREEN], [0.27, 0, WINE_AMBER],
    [-0.25, 1, WINE_AMBER], [-0.08, 1, WINE_GREEN], [0.1, 1, WINE_AMBER], [0.27, 1, WINE_GREEN],
    [-0.25, 2, WINE_GREEN], [-0.08, 2, WINE_GREEN], [0.1, 2, WINE_AMBER], [0.27, 2, WINE_GREEN],
  ] as const;

  return (
    <group>
      <Blk x={x} z={z - 0.11} y={bottom} w={0.86} d={0.035} h={h} material={palette.charcoal} />
      {[-1, 1].map((side) => (
        <SoftBox key={side} x={x + side * 0.415} z={z} y={bottom} w={0.035} d={0.3} h={h} radius={0.012} material={palette.oak} />
      ))}
      <SoftBox x={x} z={z} y={bottom} w={0.86} d={0.3} h={0.04} radius={0.012} material={palette.oak} />
      <SoftBox x={x} z={z} y={bottom + h - 0.04} w={0.86} d={0.3} h={0.04} radius={0.012} material={palette.oak} />

      {shelves.map((offset) => (
        <group key={offset}>
          <Blk x={x} z={z} y={bottom + offset} w={0.76} d={0.24} h={0.012} material={palette.glass} />
          <Blk x={x} z={z + 0.125} y={bottom + offset + 0.015} w={0.7} d={0.012} h={0.009} material={CABINET_LED} />
        </group>
      ))}

      {bottles.map(([offset, shelf, material]) => {
        const bottleY = bottom + shelves[shelf] + 0.015;
        return (
          <group key={`${shelf}-${offset}`}>
            <Cyl x={x + offset} z={z - 0.01} y={bottleY} r={0.03} h={0.205} segments={24} material={material} />
            <Cyl x={x + offset} z={z - 0.01} y={bottleY + 0.205} r={0.012} h={0.065} segments={20} material={material} />
            <Cyl x={x + offset} z={z - 0.01} y={bottleY + 0.072} r={0.031} h={0.06} segments={24} material={WINE_LABEL} />
          </group>
        );
      })}

      <Blk x={x} z={z + 0.158} y={bottom + 0.04} w={0.79} d={0.01} h={h - 0.08} material={palette.glass} />
      {[-1, 1].map((side) => (
        <Blk key={`front-${side}`} x={x + side * 0.397} z={z + 0.17} y={bottom + 0.04} w={0.018} d={0.018} h={h - 0.08} material={palette.charcoal} />
      ))}
      <Blk x={x + 0.31} z={z + 0.183} y={bottom + 0.34} w={0.012} d={0.016} h={0.39} material={palette.charcoal} />
      <pointLight
        position={[x - CX, bottom + h * 0.52, z + 0.38 - CZ]}
        intensity={0.95}
        distance={1.7}
        decay={2}
        color="#ffc477"
      />
    </group>
  );
}

function IntegratedFridge({ base, palette, x, z }: { base: number; palette: Palette; x: number; z: number }) {
  const [open, setOpen] = useState(false);
  const doorRef = useRef<THREE.Group>(null);
  const { w, d, h } = FURN.fridge;

  useFrame((_state, delta) => {
    if (!doorRef.current) return;
    doorRef.current.rotation.y = THREE.MathUtils.damp(
      doorRef.current.rotation.y,
      open ? -Math.PI * 0.48 : 0,
      10,
      delta,
    );
  });

  return (
    <group>
      <SoftBox x={x} z={z} y={base + 0.02} w={w + 0.08} d={d} h={h - 0.02} radius={0.025} material={palette.oak} />
      <SoftBox x={x} z={z} y={base + h + 0.015} w={w + 0.08} d={d} h={0.3} radius={0.022} material={palette.oak} />
      <Blk x={x} z={z + d / 2 + 0.006} y={base + h + 0.105} w={w - 0.035} d={0.014} h={0.012} material={palette.charcoal} />
      <Blk x={x} z={z + 0.015} y={base + 0.09} w={w - 0.08} d={d - 0.1} h={h - 0.19} material={palette.charcoal} />
      {[0.54, 0.96, 1.38].map((shelf) => (
        <Blk key={shelf} x={x} z={z + 0.05} y={base + shelf} w={w - 0.12} d={d - 0.14} h={0.025} material={palette.glass} />
      ))}
      <group
        ref={doorRef}
        position={[x - CX - w / 2, base, z - CZ + d / 2 + 0.02]}
        onClick={() => setOpen((value) => !value)}
        userData={{ action: "toggle-integrated-fridge", open }}
      >
        <mesh position={[w / 2, h / 2, 0]} material={palette.oak} castShadow receiveShadow>
          <boxGeometry args={[w, h, 0.055]} />
        </mesh>
        <mesh position={[w - 0.055, h * 0.53, 0.035]} material={palette.frame}>
          <boxGeometry args={[0.018, h * 0.72, 0.018]} />
        </mesh>
        <mesh position={[w / 2, 0.63, 0.034]} material={palette.charcoal}>
          <boxGeometry args={[w - 0.06, 0.012, 0.012]} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Kitchen — measured north bay.
 * East wall: window north (~z 0.25–1.45), main entry further south (~z 2.65–3.65).
 * Cabinetry clears both openings.
 */
export function Kitchen({ base, palette, furnitureEditing }: { base: number; palette: Palette; furnitureEditing: FurnitureEditingState }) {
  return (
    <group>
      {/* Side-to-side storage: fridge + pull-out west, low units beneath the measured window. */}
      <Blk x={6.03} z={0.55} y={base + 0.02} w={2.62} d={0.55} h={0.08} material={palette.charcoal} />
      <SoftBox x={6.03} z={0.55} y={base + 0.09} w={2.72} d={0.65} h={0.81} radius={0.025} material={palette.oak} />
      <SoftBox x={6.03} z={0.55} y={base + 0.9} w={2.78} d={0.69} h={0.045} radius={0.018} material={palette.stone} />
      {[-0.9, -0.3, 0.3, 0.9].map((offset) => (
        <Blk key={offset} x={6.03 + offset} z={0.884} y={base + 0.16} w={0.012} d={0.018} h={0.66} material={palette.charcoal} />
      ))}
      <WineCabinet base={base} palette={palette} />

      {/* East standalone cabinet replaced by a compact pedal bin. */}
      <KitchenBin base={base} palette={palette} x={7.25} z={1.95} />

      {/* Island shifts east to keep a clear aisle beside the new west storage. */}
      <Blk x={5.35} z={2.2} y={base + 0.02} w={1.72} d={0.8} h={0.08} material={palette.charcoal} />
      <SoftBox x={5.35} z={2.2} y={base + 0.09} w={1.9} d={0.95} h={0.83} radius={0.035} material={palette.oak} />
      <SoftBox x={5.35} z={2.2} y={base + 0.92} w={2.0} d={1.05} h={0.055} radius={0.025} material={palette.stone} />
      {[-0.46, 0, 0.46].map((offset) => (
        <Blk key={offset} x={5.35 + offset} z={1.716} y={base + 0.17} w={0.012} d={0.018} h={0.64} material={palette.charcoal} />
      ))}

      <EditableFurniture id="kitchen-integrated-fridge" editing={furnitureEditing} x={4.0} z={0.55} base={base}>
        <IntegratedFridge base={base} palette={palette} x={4.0} z={0.55} />
      </EditableFurniture>
      <TallPantry base={base} palette={palette} x={4.53} z={0.55} />

      {/* Complete work triangle: sink at the north window, gas hob + oven at island. */}
      <KitchenSink base={base} palette={palette} x={5.3} z={0.55} />
      <Cooktop base={base + 0.978} palette={palette} x={5.65} z={2.2} />
      <BuiltInOven base={base} palette={palette} x={5.65} z={2.692} />

      {/* Integrated dishwasher beside the sink. */}
      <SoftBox x={6.32} z={0.884} y={base + 0.15} w={0.62} d={0.025} h={0.68} radius={0.015} material={palette.oak} />
      <Blk x={6.32} z={0.902} y={base + 0.72} w={0.46} d={0.016} h={0.016} material={palette.charcoal} />

      {/* Handleless storage on the working side of the island. */}
      {[-0.28, 0, 0.28].map((offset) => (
        <group key={`island-storage-${offset}`}>
          <SoftBox x={6.326} z={2.2 + offset} y={base + 0.16} w={0.018} d={0.245} h={0.64} radius={0.007} material={palette.oak} />
          <Blk x={6.34} z={2.2 + offset} y={base + 0.67} w={0.012} d={0.16} h={0.012} material={palette.charcoal} />
        </group>
      ))}

      <EditableFurniture id="kitchen-stool-north" editing={furnitureEditing} x={4.95} z={2.95} base={base}>
        <BarStool base={base} palette={palette} x={4.95} z={2.95} />
      </EditableFurniture>
      <EditableFurniture id="kitchen-stool-south" editing={furnitureEditing} x={5.7} z={2.95} base={base}>
        <BarStool base={base} palette={palette} x={5.7} z={2.95} />
      </EditableFurniture>

      <Pendant base={base} palette={palette} x={5.35} z={2.2} />
      <PotPlant base={base} palette={palette} x={6.85} z={1.55} scale={0.7} />
    </group>
  );
}
