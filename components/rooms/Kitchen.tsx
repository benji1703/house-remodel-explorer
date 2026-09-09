"use client";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { Blk, Cyl, CX, CZ, SoftBox } from "./shared";
import type { Palette } from "./shared";
import { EditableFurniture, type FurnitureEditingState } from "./EditableFurniture";
import { BarStool, Cooktop, FURN, Pendant } from "./furniture";

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
const STAINLESS_STEEL = new THREE.MeshPhysicalMaterial({
  color: "#b8b4aa",
  metalness: 0.94,
  roughness: 0.24,
  clearcoat: 0.22,
  clearcoatRoughness: 0.18,
  envMapIntensity: 1.8,
});
const SINK_BASIN = new THREE.MeshPhysicalMaterial({
  color: "#252a27",
  metalness: 0.28,
  roughness: 0.24,
  clearcoat: 0.55,
  envMapIntensity: 1.35,
});
const AGED_BRASS = new THREE.MeshPhysicalMaterial({
  color: "#725c42",
  metalness: 0.84,
  roughness: 0.38,
  clearcoat: 0.12,
  clearcoatRoughness: 0.3,
  envMapIntensity: 1.45,
});
const APPLIANCE_BLACK = new THREE.MeshPhysicalMaterial({
  color: "#111513",
  metalness: 0.42,
  roughness: 0.2,
  clearcoat: 0.7,
  clearcoatRoughness: 0.12,
  envMapIntensity: 1.6,
});
const APPLIANCE_GLASS = new THREE.MeshPhysicalMaterial({
  color: "#182321",
  roughness: 0.08,
  metalness: 0.18,
  transmission: 0.32,
  transparent: true,
  opacity: 0.88,
  thickness: 0.035,
  clearcoat: 0.9,
  envMapIntensity: 1.9,
});
const APPLIANCE_INTERIOR = new THREE.MeshStandardMaterial({ color: "#171a18", roughness: 0.58, metalness: 0.32 });
const APPLIANCE_DISPLAY = new THREE.MeshStandardMaterial({
  color: "#bfe4dc",
  emissive: "#8bd7ca",
  emissiveIntensity: 2.2,
  toneMapped: false,
});
const FRIDGE_LIGHT = new THREE.MeshStandardMaterial({
  color: "#f5fbf4",
  emissive: "#d9f0e8",
  emissiveIntensity: 1.15,
  toneMapped: true,
});
const PRODUCE_GREEN = new THREE.MeshStandardMaterial({ color: "#70805d", roughness: 0.92 });
const PRODUCE_AMBER = new THREE.MeshStandardMaterial({ color: "#b96f42", roughness: 0.88 });

function KitchenSink({ base, x, z }: { base: number; x: number; z: number }) {
  const counter = base + 0.947;
  return (
    <group>
      {/* Four thin rails leave a real void around the recessed basin. */}
      <Blk x={x} z={z - 0.19} y={counter} w={0.64} d={0.035} h={0.018} material={STAINLESS_STEEL} />
      <Blk x={x} z={z + 0.19} y={counter} w={0.64} d={0.035} h={0.018} material={STAINLESS_STEEL} />
      <Blk x={x - 0.302} z={z} y={counter} w={0.035} d={0.35} h={0.018} material={STAINLESS_STEEL} />
      <Blk x={x + 0.302} z={z} y={counter} w={0.035} d={0.35} h={0.018} material={STAINLESS_STEEL} />
      <SoftBox x={x} z={z} y={counter - 0.17} w={0.55} d={0.34} h={0.17} radius={0.055} material={SINK_BASIN} />
      <SoftBox x={x} z={z} y={counter - 0.16} w={0.46} d={0.25} h={0.15} radius={0.07} material={SINK_BASIN} />
      <Cyl x={x} z={z} y={counter - 0.155} r={0.025} h={0.008} segments={32} material={STAINLESS_STEEL} />
      <Cyl x={x} z={z - 0.2} y={counter + 0.02} r={0.018} h={0.29} segments={20} material={AGED_BRASS} />
      <mesh
        position={[x - CX, counter + 0.3, z - CZ - 0.13]}
        rotation-x={Math.PI / 2}
        material={AGED_BRASS}
        castShadow
      >
        <cylinderGeometry args={[0.016, 0.016, 0.14, 20]} />
      </mesh>
    </group>
  );
}

function BuiltInOven({ base, x, z }: { base: number; x: number; z: number }) {
  return (
    <group>
      <SoftBox x={x} z={z} y={base + 0.12} w={0.64} d={0.07} h={0.75} radius={0.018} material={APPLIANCE_BLACK} />
      <SoftBox x={x} z={z + 0.041} y={base + 0.23} w={0.53} d={0.018} h={0.42} radius={0.012} material={APPLIANCE_GLASS} />

      {/* The cavity, enamel surround and racks read through the smoked door. */}
      <Blk x={x} z={z + 0.027} y={base + 0.26} w={0.43} d={0.008} h={0.31} material={APPLIANCE_INTERIOR} />
      {[0.33, 0.43, 0.53].map((height) => (
        <Blk key={height} x={x} z={z + 0.049} y={base + height} w={0.38} d={0.006} h={0.006} material={STAINLESS_STEEL} />
      ))}

      <SoftBox x={x} z={z + 0.047} y={base + 0.69} w={0.54} d={0.018} h={0.13} radius={0.008} material={APPLIANCE_BLACK} />
      <SoftBox x={x} z={z + 0.058} y={base + 0.742} w={0.13} d={0.008} h={0.035} radius={0.005} material={APPLIANCE_DISPLAY} />
      {[-0.205, 0.205].map((offset) => (
        <mesh key={offset} position={[x + offset - CX, base + 0.755, z - CZ + 0.061]} rotation-x={Math.PI / 2} material={AGED_BRASS} castShadow>
          <cylinderGeometry args={[0.034, 0.034, 0.025, 32]} />
        </mesh>
      ))}
      <mesh position={[x - CX, base + 0.665, z - CZ + 0.074]} rotation-z={Math.PI / 2} material={AGED_BRASS} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.48, 24]} />
      </mesh>
      {[-0.215, 0.215].map((offset) => (
        <Cyl key={offset} x={x + offset} z={z + 0.073} y={base + 0.64} r={0.017} h={0.045} segments={20} material={AGED_BRASS} />
      ))}
    </group>
  );
}

function IntegratedDishwasher({ base, palette, x, z }: { base: number; palette: Palette; x: number; z: number }) {
  const [open, setOpen] = useState(false);
  const doorRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (!doorRef.current) return;
    doorRef.current.rotation.x = THREE.MathUtils.damp(doorRef.current.rotation.x, open ? Math.PI * 0.43 : 0, 9, delta);
  });

  return (
    <group>
      {open && (
        <>
          <Blk x={x} z={z + 0.22} y={base + 0.14} w={0.54} d={0.025} h={0.58} material={APPLIANCE_INTERIOR} />
          <Blk x={x} z={z + 0.24} y={base + 0.28} w={0.46} d={0.018} h={0.018} material={STAINLESS_STEEL} />
          <Blk x={x} z={z + 0.24} y={base + 0.52} w={0.46} d={0.018} h={0.018} material={STAINLESS_STEEL} />
        </>
      )}
      <group
        ref={doorRef}
        position={[x - CX, base + 0.11, z + 0.292 - CZ]}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        userData={{ action: "toggle-integrated-dishwasher", open }}
      >
        <mesh position={[0, 0.395, 0]} material={palette.oak} castShadow receiveShadow>
          <boxGeometry args={[0.58, 0.79, 0.045]} />
        </mesh>
        <mesh position={[0, 0.615, 0.035]} material={APPLIANCE_BLACK}>
          <boxGeometry args={[0.46, 0.055, 0.014]} />
        </mesh>
        <mesh position={[0, 0.56, 0.05]} material={AGED_BRASS} castShadow>
          <boxGeometry args={[0.34, 0.012, 0.014]} />
        </mesh>
        <mesh position={[0.17, 0.615, 0.045]} material={APPLIANCE_DISPLAY}>
          <boxGeometry args={[0.012, 0.006, 0.005]} />
        </mesh>
        {open && (
          <mesh position={[0, 0.385, -0.03]} material={STAINLESS_STEEL} receiveShadow>
            <boxGeometry args={[0.5, 0.7, 0.018]} />
          </mesh>
        )}
      </group>
    </group>
  );
}

function ExtractorHood({ base, palette, x, z }: { base: number; palette: Palette; x: number; z: number }) {
  return (
    <group>
      {/* A concealed insert in a single rift-oak cabinet bay keeps the north
          elevation calm and clears the measured window reveal. */}
      <SoftBox x={x} z={z - 0.04} y={base + 1.5} w={0.96} d={0.36} h={0.68} radius={0.025} material={palette.oak} />
      <Blk x={x} z={z + 0.15} y={base + 1.52} w={0.88} d={0.018} h={0.58} material={palette.oak} />
      <SoftBox x={x} z={z + 0.17} y={base + 1.46} w={1.02} d={0.4} h={0.085} radius={0.016} material={AGED_BRASS} />
      <Blk x={x} z={z + 0.374} y={base + 1.475} w={0.66} d={0.01} h={0.026} material={APPLIANCE_BLACK} />
      {[-0.22, 0, 0.22].map((offset) => (
        <mesh key={offset} position={[x + offset - CX, base + 1.455, z + 0.27 - CZ]} rotation-x={-Math.PI / 2} material={FRIDGE_LIGHT}>
          <circleGeometry args={[0.018, 24]} />
        </mesh>
      ))}
    </group>
  );
}

function TallPantry({
  base,
  palette,
  x,
  z,
  w = 0.34,
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
      <SoftBox x={x} z={z} y={base + 0.08} w={w} d={0.7} h={h - 0.08} radius={0.025} material={palette.oak} />
      {/* Match the fridge leaf plane and front datum exactly; the old inset
          panel created a dark vertical gap at the appliance seam. */}
      <SoftBox x={x} z={z + 0.37} y={base + 0.04} w={w - 0.01} d={0.055} h={h - 0.04} radius={0.008} material={palette.oak} />
      <Blk x={x - w / 2 + 0.07} z={z + 0.405} y={base + 0.91} w={0.01} d={0.012} h={0.6} material={AGED_BRASS} />
    </group>
  );
}

function IslandBowl({ base, palette, x, z }: { base: number; palette: Palette; x: number; z: number }) {
  return (
    <group position={[x - CX, base, z - CZ]}>
      <mesh rotation-x={Math.PI / 2} material={AGED_BRASS} castShadow>
        <torusGeometry args={[0.17, 0.018, 12, 48]} />
      </mesh>
      <mesh position={[0, -0.008, 0]} rotation-x={-Math.PI / 2} material={palette.stone} receiveShadow>
        <circleGeometry args={[0.15, 48]} />
      </mesh>
      {[-0.07, 0.02, 0.08].map((offset, index) => (
        <mesh key={offset} position={[offset, 0.045 + index * 0.006, index % 2 === 0 ? 0.015 : -0.04]} material={index === 1 ? PRODUCE_AMBER : PRODUCE_GREEN} castShadow>
          <icosahedronGeometry args={[0.055 + index * 0.006, 2]} />
        </mesh>
      ))}
    </group>
  );
}

function IntegratedFridge({ base, palette, x, z }: { base: number; palette: Palette; x: number; z: number }) {
  const [open, setOpen] = useState(false);
  const doorRef = useRef<THREE.Group>(null);
  const { d, h } = FURN.fridge;
  const w = 0.9;

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
      {/* Build the integrated carcass as panels instead of a solid block so an
          opened door reveals a believable, lit cavity rather than an oak face. */}
      <SoftBox x={x - w / 2 + 0.035} z={z} y={base} w={0.07} d={d} h={h} radius={0.018} material={palette.oak} />
      <SoftBox x={x + w / 2 - 0.035} z={z} y={base} w={0.07} d={d} h={h} radius={0.018} material={palette.oak} />
      <Blk x={x} z={z} y={base + h - 0.024} w={w} d={d - 0.04} h={0.024} material={palette.oak} />
      <SoftBox x={x} z={z} y={base + 0.035} w={w} d={d} h={0.07} radius={0.018} material={palette.oak} />
      {/* Rear gable stays behind the cavity and uses Blk's bottom-elevation
          convention; the old center-style y value created a tall mast above
          the refrigerator. */}
      <Blk x={x} z={z - d / 2 + 0.02} y={base + 0.06} w={w} d={0.04} h={h - 0.12} material={palette.oak} />
      <Blk x={x} z={z - d / 2 + 0.05} y={base + 0.1} w={w - 0.08} d={0.025} h={h - 0.2} material={APPLIANCE_INTERIOR} />
      <Blk x={x} z={z - d * 0.34} y={base + 0.18} w={w - 0.16} d={0.018} h={h - 0.38} material={FRIDGE_LIGHT} />
      {[0.54, 1.02, 1.5, 1.92].map((shelf) => (
        <group key={shelf}>
          <Blk x={x} z={z + 0.05} y={base + shelf} w={w - 0.12} d={d - 0.14} h={0.025} material={palette.glass} />
          <Blk x={x} z={z + d * 0.34} y={base + shelf} w={w - 0.12} d={0.018} h={0.035} material={STAINLESS_STEEL} />
        </group>
      ))}
      {/* Chilled contents and two translucent produce drawers make the open
          appliance read as a complete object, rather than an empty cabinet. */}
      {[-0.18, 0, 0.18].map((offset, index) => (
        <group key={`bottle-${offset}`}>
          <Cyl x={x + offset} z={z + 0.02} y={base + 1.53} r={0.035} h={0.27 + index * 0.035} segments={24} material={index === 1 ? WINE_AMBER : WINE_GREEN} />
          <Cyl x={x + offset} z={z + 0.02} y={base + 1.8 + index * 0.035} r={0.015} h={0.055} segments={20} material={index === 1 ? WINE_AMBER : WINE_GREEN} />
        </group>
      ))}
      {[-0.15, 0.02, 0.17].map((offset, index) => (
        <mesh key={`produce-${offset}`} position={[x + offset - CX, base + 0.69 + index * 0.08, z + 0.04 - CZ]} material={index === 1 ? PRODUCE_AMBER : PRODUCE_GREEN} castShadow>
          <dodecahedronGeometry args={[0.09 + index * 0.008, 1]} />
        </mesh>
      ))}
      {[0.15, 0.36].map((bottom) => (
        <group key={bottom}>
          <SoftBox x={x} z={z + 0.06} y={base + bottom} w={w - 0.13} d={d - 0.18} h={0.17} radius={0.018} material={palette.glass} />
          <Blk x={x} z={z + d * 0.35} y={base + bottom + 0.115} w={0.22} d={0.012} h={0.015} material={STAINLESS_STEEL} />
        </group>
      ))}
      <group
        ref={doorRef}
        position={[x - CX - w / 2, base, z - CZ + d / 2 + 0.02]}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        userData={{ action: "toggle-integrated-fridge", open }}
      >
        <mesh position={[w / 2, h / 2 + 0.02, 0]} material={palette.oak} castShadow receiveShadow>
          <boxGeometry args={[w, h - 0.04, 0.055]} />
        </mesh>
        <mesh position={[w / 2, h / 2, -0.033]} material={APPLIANCE_INTERIOR}>
          <boxGeometry args={[w - 0.075, h - 0.075, 0.018]} />
        </mesh>
        {[0.42, 0.82, 1.22, 1.62].map((height) => (
          <group key={`door-shelf-${height}`}>
            <mesh position={[w / 2, height, -0.095]} material={STAINLESS_STEEL} castShadow>
              <boxGeometry args={[w - 0.15, 0.035, 0.15]} />
            </mesh>
            <mesh position={[w / 2, height + 0.1, -0.165]} material={STAINLESS_STEEL}>
              <boxGeometry args={[w - 0.16, 0.018, 0.018]} />
            </mesh>
          </group>
        ))}
        <mesh position={[w - 0.065, 1.21, 0.035]} material={AGED_BRASS} castShadow>
          <boxGeometry args={[0.01, 0.6, 0.012]} />
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
      {/* Keep the measured window legible: a low stone upstand follows the
          sink run, while the cooktop alone receives a full fire-safe panel. */}
      <Blk x={5.25} z={0.205} y={base + 0.94} w={1.75} d={0.025} h={0.1} material={palette.stone} />
      <Blk x={6.78} z={0.205} y={base + 0.94} w={0.96} d={0.025} h={0.56} material={palette.stone} />

      {/* Side-to-side storage: fridge + pull-out west, low units beneath the measured window. */}
      <Blk x={6.03} z={0.55} y={base + 0.02} w={2.62} d={0.55} h={0.08} material={palette.charcoal} />
      {/* Panel-built run leaves the dishwasher service bay and sink void legible. */}
      <SoftBox x={4.84} z={0.55} y={base + 0.09} w={0.32} d={0.65} h={0.81} radius={0.025} material={palette.oak} />
      <SoftBox x={5.63} z={0.55} y={base + 0.09} w={0.07} d={0.65} h={0.81} radius={0.012} material={palette.oak} />
      <SoftBox x={6.29} z={0.55} y={base + 0.09} w={0.08} d={0.65} h={0.81} radius={0.012} material={palette.oak} />
      <SoftBox x={6.335} z={0.55} y={base + 0.09} w={0.19} d={0.65} h={0.81} radius={0.012} material={palette.oak} />
      <SoftBox x={6.335} z={0.895} y={base + 0.09} w={0.19} d={0.03} h={0.81} radius={0.008} material={palette.oak} />
      <SoftBox x={7.335} z={0.55} y={base + 0.09} w={0.53} d={0.65} h={0.81} radius={0.025} material={palette.oak} />
      {/* Stone worktop is segmented around the sink and hob rather than a slab
          passing through both cut-outs. */}
      <SoftBox x={4.81} z={0.55} y={base + 0.9} w={0.34} d={0.69} h={0.045} radius={0.018} material={palette.stone} />
      <SoftBox x={6.005} z={0.55} y={base + 0.9} w={0.77} d={0.69} h={0.045} radius={0.018} material={palette.stone} />
      <SoftBox x={7.355} z={0.55} y={base + 0.9} w={0.49} d={0.69} h={0.045} radius={0.018} material={palette.stone} />

      {/* The island sits 100+ cm off the north run and clears the east entry. */}
      <Blk x={5.35} z={2.42} y={base + 0.02} w={1.72} d={0.8} h={0.08} material={palette.charcoal} />
      <SoftBox x={5.35} z={2.42} y={base + 0.09} w={1.9} d={0.95} h={0.83} radius={0.035} material={palette.oak} />
      <SoftBox x={5.35} z={2.42} y={base + 0.92} w={2.0} d={1.05} h={0.055} radius={0.025} material={palette.stone} />
      {[-0.46, 0, 0.46].map((offset) => (
        <Blk key={offset} x={5.35 + offset} z={1.936} y={base + 0.17} w={0.012} d={0.018} h={0.64} material={palette.charcoal} />
      ))}

      <EditableFurniture id="kitchen-integrated-fridge" editing={furnitureEditing} x={3.9} z={0.55} base={base}>
        <IntegratedFridge base={base} palette={palette} x={3.9} z={0.55} />
      </EditableFurniture>
      <TallPantry base={base} palette={palette} x={4.52} z={0.55} />
      <Blk x={4.07} z={0.55} y={base + 2.206} w={1.24} d={0.7} h={0.024} material={palette.oak} />

      {/* Complete work triangle without placing flame/heat behind island seats. */}
      <KitchenSink base={base} x={5.3} z={0.55} />
      <SoftBox x={5.3} z={0.55} y={base + 0.09} w={0.58} d={0.65} h={0.81} radius={0.025} material={palette.oak} />
      {/* Seat the 40 mm hob flush into the 945 mm worktop datum. */}
      <Cooktop base={base + 0.905} palette={palette} x={6.75} z={0.55} />
      <BuiltInOven base={base} x={6.75} z={0.875} />
      <ExtractorHood base={base} palette={palette} x={6.75} z={0.28} />

      {/* Integrated dishwasher beside the sink. */}
      <IntegratedDishwasher base={base} palette={palette} x={5.95} z={0.61} />

      {/* Handleless storage on the working side of the island. */}
      {[-0.28, 0, 0.28].map((offset) => (
        <group key={`island-storage-${offset}`}>
          <SoftBox x={6.326} z={2.42 + offset} y={base + 0.16} w={0.018} d={0.245} h={0.64} radius={0.007} material={palette.oak} />
          <Blk x={6.34} z={2.42 + offset} y={base + 0.67} w={0.012} d={0.16} h={0.012} material={palette.charcoal} />
        </group>
      ))}

      <EditableFurniture id="kitchen-stool-north" editing={furnitureEditing} x={4.95} z={3.32} base={base}>
        <BarStool base={base} palette={palette} x={4.95} z={3.32} />
      </EditableFurniture>
      <EditableFurniture id="kitchen-stool-south" editing={furnitureEditing} x={5.7} z={3.32} base={base}>
        <BarStool base={base} palette={palette} x={5.7} z={3.32} />
      </EditableFurniture>

      <IslandBowl base={base + 1.045} palette={palette} x={5.25} z={2.42} />
      <Pendant base={base} palette={palette} x={4.95} z={2.42} y={2.42} />
      <Pendant base={base} palette={palette} x={5.75} z={2.42} y={2.42} />
    </group>
  );
}
