"use client";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { Blk, Cyl, CX, CZ, SoftBox } from "./shared";
import type { Palette } from "./shared";
import { EditableFurniture, type FurnitureEditingState } from "./EditableFurniture";
import { BarStool, Cooktop, FURN, Pendant, PotPlant } from "./furniture";

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
      {/* North run — under north bay window. */}
      <Blk x={5.7} z={0.55} y={base + 0.02} w={3.42} d={0.55} h={0.08} material={palette.charcoal} />
      <SoftBox x={5.7} z={0.55} y={base + 0.09} w={3.6} d={0.65} h={0.81} radius={0.025} material={palette.oak} />
      <SoftBox x={5.7} z={0.55} y={base + 0.9} w={3.64} d={0.69} h={0.045} radius={0.018} material={palette.stone} />
      {[-1.2, -0.4, 0.4, 1.2].map((offset) => (
        <Blk key={offset} x={5.7 + offset} z={0.884} y={base + 0.16} w={0.012} d={0.018} h={0.66} material={palette.charcoal} />
      ))}

      {/* East standalone cabinet replaced by a compact pedal bin. */}
      <KitchenBin base={base} palette={palette} x={7.25} z={1.95} />

      {/* Island — pulled west of east entry path. */}
      <Blk x={5.15} z={2.2} y={base + 0.02} w={1.72} d={0.8} h={0.08} material={palette.charcoal} />
      <SoftBox x={5.15} z={2.2} y={base + 0.09} w={1.9} d={0.95} h={0.83} radius={0.035} material={palette.oak} />
      <SoftBox x={5.15} z={2.2} y={base + 0.92} w={2.0} d={1.05} h={0.055} radius={0.025} material={palette.stone} />
      {[-0.46, 0, 0.46].map((offset) => (
        <Blk key={offset} x={5.15 + offset} z={1.716} y={base + 0.17} w={0.012} d={0.018} h={0.64} material={palette.charcoal} />
      ))}

      <EditableFurniture id="kitchen-integrated-fridge" editing={furnitureEditing} x={4.05} z={0.6} base={base}>
        <IntegratedFridge base={base} palette={palette} x={4.05} z={0.6} />
      </EditableFurniture>

      {/* Complete work triangle: sink at the north window, gas hob + oven at island. */}
      <KitchenSink base={base} palette={palette} x={5.35} z={0.55} />
      <Cooktop base={base + 0.978} palette={palette} x={5.45} z={2.2} />
      <BuiltInOven base={base} palette={palette} x={5.45} z={2.692} />

      {/* Integrated dishwasher beside the sink. */}
      <SoftBox x={6.45} z={0.884} y={base + 0.15} w={0.62} d={0.025} h={0.68} radius={0.015} material={palette.oak} />
      <Blk x={6.45} z={0.902} y={base + 0.72} w={0.46} d={0.016} h={0.016} material={palette.frame} />

      <EditableFurniture id="kitchen-stool-north" editing={furnitureEditing} x={3.95} z={1.9} base={base}>
        <BarStool base={base} palette={palette} x={3.95} z={1.9} />
      </EditableFurniture>
      <EditableFurniture id="kitchen-stool-south" editing={furnitureEditing} x={3.95} z={2.5} base={base}>
        <BarStool base={base} palette={palette} x={3.95} z={2.5} />
      </EditableFurniture>

      <Pendant base={base} palette={palette} x={5.15} z={2.2} />
      <PotPlant base={base} palette={palette} x={6.85} z={1.55} scale={0.7} />
    </group>
  );
}
