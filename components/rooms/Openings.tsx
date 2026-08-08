"use client";

import { useMemo } from "react";
import type * as THREE from "three";
import type { Palette } from "./shared";
import { CX, CZ } from "./shared";

/**
 * Klil Belgian-inspired openings.
 * - Windows/doors: thin aluminium profiles (series 4300 character).
 * - Exterior shutters: hinged louvre / רפפה (series 1300, 45 mm slats).
 * Frames sit in the punched wall thickness; shutters park on the exterior face.
 */

export type OpeningSpec = {
  at: number;
  width: number;
  sill: number;
  head: number;
  /** Hinged (default) or wall-sliding leaf. */
  style?: "hinged" | "sliding";
};

const FRAME = 0.04; // ~40 mm outer frame — narrow Belgian profile
const MUNTIN = 0.018; // thin bar
const SLAT = 0.045; // Klil 1200/1300 louvre slat width
const SLAT_GAP = 0.012;
const DOOR_LEAF_THICK = 0.05;
const GLASS_T = 0.012;

function FrameRect({
  w,
  h,
  depth,
  material,
}: {
  w: number;
  h: number;
  depth: number;
  material: THREE.Material;
}) {
  const t = FRAME;
  return (
    <group>
      <mesh position={[-(w - t) / 2, 0, 0]} material={material} castShadow>
        <boxGeometry args={[t, h, depth]} />
      </mesh>
      <mesh position={[(w - t) / 2, 0, 0]} material={material} castShadow>
        <boxGeometry args={[t, h, depth]} />
      </mesh>
      <mesh position={[0, (h - t) / 2, 0]} material={material} castShadow>
        <boxGeometry args={[w, t, depth]} />
      </mesh>
      <mesh position={[0, -(h - t) / 2, 0]} material={material} castShadow>
        <boxGeometry args={[w, t, depth]} />
      </mesh>
    </group>
  );
}

/** Horizontal louvre shutter leaf — Klil Belgian 1300 character. */
function LouvreShutterLeaf({
  w,
  h,
  material,
}: {
  w: number;
  h: number;
  material: THREE.Material;
}) {
  const pitch = SLAT + SLAT_GAP;
  const count = Math.max(4, Math.floor((h - FRAME * 2) / pitch));
  const innerH = h - FRAME * 2;
  const start = -innerH / 2 + SLAT / 2;
  const depth = 0.036;
  return (
    <group>
      <FrameRect w={w} h={h} depth={depth} material={material} />
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          position={[0, start + i * pitch, depth * 0.15]}
          rotation={[0.32, 0, 0]}
          material={material}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[w - FRAME * 2 - 0.01, SLAT * 0.62, 0.012]} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Belgian casement window in a punched opening.
 * Frame sits in the exterior half of the wall; louvre shutters hinge on the
 * jamb and park proud of the plaster — never mid-slab.
 */
export function BelgianWindow({
  width,
  sill,
  head,
  palette,
  shutters = true,
  leaves = 2,
  wallThickness = 0.2,
}: {
  width: number;
  sill: number;
  head: number;
  palette: Palette;
  shutters?: boolean;
  leaves?: 1 | 2;
  wallThickness?: number;
}) {
  const h = head - sill;
  const midY = (sill + head) / 2;
  const leafW = (width - FRAME) / leaves;
  // Thin frame in the outer half — avoids looking painted onto solid wall.
  const frameDepth = Math.min(0.07, wallThickness * 0.4);
  const frameZ = -(wallThickness / 2) + frameDepth / 2 + 0.002;
  // Exterior plaster face (local −Z). Shutters live fully outside this plane.
  const face = -(wallThickness / 2);
  const hingeZ = face - 0.045;
  const shutterW = Math.min(width * 0.44, 0.62);
  const shutterClear = 0.018;
  const openAngle = 0.48; // ~27° off the facade — readable depth
  const muntins = useMemo(() => {
    const bars: Array<{ x?: number; y?: number; w: number; h: number }> = [];
    bars.push({ y: h * 0.18, w: width - FRAME * 2, h: MUNTIN });
    if (leaves === 2) {
      bars.push({ x: 0, w: MUNTIN, h: h - FRAME * 2 });
    }
    return bars;
  }, [width, h, leaves]);

  return (
    <group position={[0, midY, 0]}>
      <group position={[0, 0, frameZ]}>
        <FrameRect w={width - 0.02} h={h - 0.01} depth={frameDepth} material={palette.frame} />
        <mesh material={palette.glass}>
          <boxGeometry args={[width - FRAME * 2 - 0.02, h - FRAME * 2 - 0.01, GLASS_T]} />
        </mesh>
        {muntins.map((bar, i) => (
          <mesh
            key={i}
            position={[bar.x ?? 0, bar.y ?? 0, frameDepth * 0.2]}
            material={palette.frame}
            castShadow
          >
            <boxGeometry args={[bar.w, bar.h, 0.016]} />
          </mesh>
        ))}
        {leaves === 2 &&
          [-leafW / 2, leafW / 2].map((x, i) => (
            <mesh key={`stile-${i}`} position={[x, 0, frameDepth * 0.22]} material={palette.frame}>
              <boxGeometry args={[0.012, h - FRAME * 2, 0.02]} />
            </mesh>
          ))}
      </group>

      {/* Exterior sill — proud of plaster */}
      <mesh position={[0, -h / 2 + 0.01, face - 0.05]} material={palette.frame} castShadow receiveShadow>
        <boxGeometry args={[width + 0.08, 0.03, 0.1]} />
      </mesh>

      {shutters && (
        <>
          {/* Left leaf: hinge on left jamb, swings onto the facade */}
          <group position={[-(width / 2) - shutterClear, 0, hingeZ]} rotation-y={-openAngle}>
            <group position={[-(shutterW / 2), 0, -0.02]}>
              <LouvreShutterLeaf w={shutterW} h={h} material={palette.frame} />
            </group>
          </group>
          {/* Right leaf: hinge on right jamb */}
          <group position={[width / 2 + shutterClear, 0, hingeZ]} rotation-y={openAngle}>
            <group position={[shutterW / 2, 0, -0.02]}>
              <LouvreShutterLeaf w={shutterW} h={h} material={palette.frame} />
            </group>
          </group>
        </>
      )}
    </group>
  );
}

/** Light-oak hinged door — full jamb through the wall, leaf opens inward (+Z). */
export function BelgianDoor({
  width,
  head,
  palette,
  ajar = 0.55,
  exterior = false,
  wallThickness = 0.2,
}: {
  width: number;
  head: number;
  palette: Palette;
  /** Radians open into the room (local +Z). */
  ajar?: number;
  exterior?: boolean;
  wallThickness?: number;
}) {
  const h = head;
  const midY = h / 2;
  const glassH = h * 0.42;
  const glassY = h * 0.22;
  const jambDepth = Math.max(wallThickness - 0.01, 0.1);
  const leafW = width - FRAME * 2;
  const leafH = h - FRAME * 2;
  const wood = palette.oak;
  // Closed leaf centered in the wall; swings toward local +Z (interior / into room).
  const hingeZ = 0;

  return (
    <group position={[0, midY, 0]}>
      <FrameRect w={width - 0.02} h={h - 0.01} depth={jambDepth} material={wood} />
      {/* Hinge on left jamb — negative Y rotation opens the leaf into +Z. */}
      <group position={[-(width / 2 - FRAME), 0, hingeZ]} rotation-y={-ajar}>
        <group position={[leafW / 2, 0, 0]}>
          <mesh material={wood} castShadow receiveShadow>
            <boxGeometry args={[leafW, leafH, DOOR_LEAF_THICK]} />
          </mesh>
          {/* Second face plate so the leaf reads solid from both rooms */}
          <mesh position={[0, 0, DOOR_LEAF_THICK / 2 + 0.002]} material={wood} castShadow>
            <boxGeometry args={[leafW - 0.004, leafH - 0.004, 0.004]} />
          </mesh>
          <mesh position={[0, 0, -(DOOR_LEAF_THICK / 2 + 0.002)]} material={wood} castShadow>
            <boxGeometry args={[leafW - 0.004, leafH - 0.004, 0.004]} />
          </mesh>
          <mesh position={[0, glassY, 0]} material={palette.glass}>
            <boxGeometry args={[leafW - FRAME * 2, glassH, GLASS_T]} />
          </mesh>
          <mesh position={[0, glassY, DOOR_LEAF_THICK / 2 + 0.006]} material={wood}>
            <boxGeometry args={[MUNTIN, glassH, 0.012]} />
          </mesh>
          <mesh position={[0, glassY, -(DOOR_LEAF_THICK / 2 + 0.006)]} material={wood}>
            <boxGeometry args={[MUNTIN, glassH, 0.012]} />
          </mesh>
          {/* Handles both faces */}
          <mesh
            position={[leafW * 0.35, -h * 0.05, DOOR_LEAF_THICK / 2 + 0.018]}
            material={palette.charcoal}
          >
            <boxGeometry args={[0.02, 0.12, 0.03]} />
          </mesh>
          <mesh
            position={[leafW * 0.35, -h * 0.05, -(DOOR_LEAF_THICK / 2 + 0.018)]}
            material={palette.charcoal}
          >
            <boxGeometry args={[0.02, 0.12, 0.03]} />
          </mesh>
        </group>
      </group>
      {exterior && (
        <mesh
          position={[0, -(h / 2) + 0.02, -(wallThickness / 2) - 0.05]}
          material={wood}
          castShadow
        >
          <boxGeometry args={[width + 0.06, 0.04, 0.12]} />
        </mesh>
      )}
    </group>
  );
}

/** Pocket / sliding oak door — leaf slides along the wall (ensuite). */
export function SlidingDoor({
  width,
  head,
  palette,
  open = 0.72,
  wallThickness = 0.12,
}: {
  width: number;
  head: number;
  palette: Palette;
  /** 0 = closed, 1 = fully stacked clear of the opening. */
  open?: number;
  wallThickness?: number;
}) {
  const h = head;
  const midY = h / 2;
  const jambDepth = Math.max(wallThickness - 0.01, 0.08);
  const leafW = width - FRAME * 1.2;
  const leafH = h - FRAME * 2;
  const wood = palette.oak;
  const slide = Math.min(Math.max(open, 0), 0.92) * leafW;
  const trackZ = 0;

  return (
    <group position={[0, midY, 0]}>
      <FrameRect w={width - 0.02} h={h - 0.01} depth={jambDepth} material={wood} />
      {/* Top track */}
      <mesh position={[0, h / 2 - FRAME * 0.6, trackZ]} material={palette.charcoal}>
        <boxGeometry args={[width - FRAME, 0.02, 0.028]} />
      </mesh>
      <group position={[-width / 2 + FRAME * 0.6 + leafW / 2 + slide, 0, trackZ]}>
        <mesh material={wood} castShadow receiveShadow>
          <boxGeometry args={[leafW, leafH, DOOR_LEAF_THICK]} />
        </mesh>
        <mesh position={[0, 0, DOOR_LEAF_THICK / 2 + 0.002]} material={wood}>
          <boxGeometry args={[leafW - 0.004, leafH - 0.004, 0.004]} />
        </mesh>
        <mesh position={[0, 0, -(DOOR_LEAF_THICK / 2 + 0.002)]} material={wood}>
          <boxGeometry args={[leafW - 0.004, leafH - 0.004, 0.004]} />
        </mesh>
        <mesh
          position={[leafW * 0.32, 0, DOOR_LEAF_THICK / 2 + 0.016]}
          material={palette.charcoal}
        >
          <boxGeometry args={[0.018, 0.1, 0.028]} />
        </mesh>
        <mesh
          position={[leafW * 0.32, 0, -(DOOR_LEAF_THICK / 2 + 0.016)]}
          material={palette.charcoal}
        >
          <boxGeometry args={[0.018, 0.1, 0.028]} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Wide west living opening — multi-leaf Belgian terrace doors (4 × 0.9 m in 3.6 m).
 */
export function BelgianTerraceDoors({
  width,
  head,
  palette,
  leafCount = 4,
  wallThickness = 0.2,
}: {
  width: number;
  head: number;
  palette: Palette;
  leafCount?: number;
  wallThickness?: number;
}) {
  const leafW = width / leafCount;
  const midY = head / 2;
  const frameDepth = Math.max(wallThickness - 0.02, 0.08);
  const extFace = -(wallThickness / 2) - 0.01;
  return (
    <group position={[0, midY, 0]}>
      <FrameRect w={width} h={head} depth={frameDepth} material={palette.frame} />
      {Array.from({ length: leafCount }, (_, i) => {
        const x = -width / 2 + leafW * (i + 0.5);
        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh material={palette.glass}>
              <boxGeometry args={[leafW - FRAME * 1.2, head - FRAME * 2, GLASS_T]} />
            </mesh>
            <mesh position={[0, head * 0.12, frameDepth * 0.15]} material={palette.frame}>
              <boxGeometry args={[leafW - FRAME * 1.4, MUNTIN, 0.02]} />
            </mesh>
            <mesh position={[0, -head * 0.08, frameDepth * 0.15]} material={palette.frame}>
              <boxGeometry args={[leafW - FRAME * 1.4, MUNTIN, 0.02]} />
            </mesh>
            <mesh position={[leafW / 2 - FRAME / 2, 0, frameDepth * 0.18]} material={palette.frame}>
              <boxGeometry args={[FRAME * 0.7, head - FRAME * 2, 0.03]} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, -head / 2 + 0.015, extFace + 0.05]} material={palette.frame}>
        <boxGeometry args={[width + 0.06, 0.03, 0.14]} />
      </mesh>
    </group>
  );
}

/** Place an opening unit along a wall run (same `at` convention as WallRun). */
export function OpeningOnWall({
  a,
  b,
  opening,
  kind,
  palette,
  exterior = false,
  wallThickness,
}: {
  a: [number, number];
  b: [number, number];
  opening: OpeningSpec;
  kind: "window" | "door" | "terrace";
  palette: Palette;
  exterior?: boolean;
  wallThickness: number;
}) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  const px = a[0] + (dx / length) * opening.at;
  const pz = a[1] + (dz / length) * opening.at;

  return (
    <group position={[px - CX, 0, pz - CZ]} rotation-y={-angle}>
      {kind === "window" && (
        <BelgianWindow
          width={opening.width}
          sill={opening.sill}
          head={opening.head}
          palette={palette}
          shutters={exterior}
          leaves={opening.width >= 1.2 ? 2 : 1}
          wallThickness={wallThickness}
        />
      )}
      {kind === "door" && opening.style === "sliding" && (
        <SlidingDoor
          width={opening.width}
          head={opening.head}
          palette={palette}
          open={0.7}
          wallThickness={wallThickness}
        />
      )}
      {kind === "door" && opening.style !== "sliding" && (
        <BelgianDoor
          width={opening.width}
          head={opening.head}
          palette={palette}
          ajar={exterior ? 0.62 : 0.7}
          exterior={exterior}
          wallThickness={wallThickness}
        />
      )}
      {kind === "terrace" && (
        <BelgianTerraceDoors
          width={opening.width}
          head={opening.head}
          palette={palette}
          wallThickness={wallThickness}
        />
      )}
    </group>
  );
}
