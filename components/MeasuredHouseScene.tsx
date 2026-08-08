"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html, Lightformer, OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { designAssumptions, house, type HouseZone, type ZoneId } from "@/data/house";

type Props = {
  selectedZone: ZoneId;
  onSelectZone: (id: ZoneId) => void;
  designMode: boolean;
  quality: "high" | "light";
  showMeasurements?: boolean;
  onCameraAzimuth?: (radians: number) => void;
};

// Matches OrbitControls' target below; shared so the azimuth tracker orbits
// around the same point the camera actually does.
const ORBIT_TARGET: [number, number, number] = [-1.2, 0.7, 0.4];
// Minimum change (~0.5°) before we bother lifting a new azimuth value up.
const AZIMUTH_EPSILON = 0.0087;

/** Reports the camera's azimuth around ORBIT_TARGET, throttled to avoid excessive re-renders. */
function CameraAzimuthTracker({ onCameraAzimuth }: { onCameraAzimuth?: (radians: number) => void }) {
  const last = useRef(0);
  useFrame(({ camera }) => {
    if (!onCameraAzimuth) return;
    // The footprint's z=0 edge is north (see house.footprint / VectorPlan's
    // top-dimension line), so -Z is north in this scene. With OrbitControls'
    // up axis fixed to world Y, the needle's screen rotation equals this
    // azimuth directly (see MeasuredHouseScene report for the derivation).
    const azimuth = Math.atan2(camera.position.x - ORBIT_TARGET[0], camera.position.z - ORBIT_TARGET[2]);
    if (Math.abs(azimuth - last.current) > AZIMUTH_EPSILON) {
      last.current = azimuth;
      onCameraAzimuth(azimuth);
    }
  });
  return null;
}

// Scene centring, so the measured footprint orbits around the origin.
const CX = 5.7;
const CZ = 6.05;

// First-pass design proposals, not measured values. The model is drawn as a
// horizontal section so interiors stay visible; walls are cut at SECTION.
const SECTION = 1.5;
// Low west sun: the terrace and the big living opening face west, so a late
// afternoon key light rakes in through the pergola like the moodboard photos.
const SUN_POSITION: [number, number, number] = [-14, 7.5, -3.5];
const SUN_DIRECTION = new THREE.Vector3(...SUN_POSITION).normalize();
const EXT_THICKNESS = designAssumptions.exteriorWallThicknessCm / 100;
const INT_THICKNESS = designAssumptions.interiorWallThicknessCm / 100;
const DOOR_HEAD = 2.1;
const WINDOW_SILL = designAssumptions.bedroomWindow.sillHeightCm / 100;
const WINDOW_HEAD = designAssumptions.bedroomWindow.headHeightCm / 100;
const WEST_OPENING_WIDTH = designAssumptions.livingWestOpening.widthCm / 100;
const WEST_OPENING_HEAD = designAssumptions.livingWestOpening.headHeightCm / 100;

type Opening = { at: number; width: number; sill: number; head: number };

const door = (at: number, width = 0.9): Opening => ({ at, width, sill: 0, head: DOOR_HEAD });
const window_ = (at: number, width = 1.4): Opening => ({
  at,
  width,
  sill: WINDOW_SILL,
  head: WINDOW_HEAD,
});

// Keyed by footprint edge index (edge n runs from point n to point n+1).
const exteriorOpenings: Record<number, Opening[]> = {
  0: [window_(2.1, 1.6)],
  1: [window_(2.0, 1.2)],
  2: [window_(1.9)],
  3: [window_(1.8), window_(5.0)],
  // The 1.9 m opening is the architect-proposed south window for the
  // east-lower bedroom; the existing plan opening is retained at 9.7 m.
  4: [door(2.4, 1.0), window_(1.9), window_(9.7, 1.5)],
  5: [window_(1.9, 1.2)],
  6: [window_(1.7)],
  7: [{ at: 2.2, width: WEST_OPENING_WIDTH, sill: 0, head: WEST_OPENING_HEAD }],
};

// Proposed internal partitions, derived from the zone boxes in data/house.ts.
// Owner request (2026-08-07): no wall between kitchen and living room — that
// run (a=[3.4,3.8] b=[7.6,3.8]) is intentionally omitted, open-plan.
const partitions: Array<{ a: [number, number]; b: [number, number]; openings: Opening[] }> = [
  { a: [7.6, 5.0], b: [7.6, 12.1], openings: [door(1.8), door(4.3)] },
  { a: [7.6, 8.55], b: [11.4, 8.55], openings: [] },
  { a: [3.4, 8.2], b: [3.4, 12.1], openings: [door(1.0), door(3.0, 0.8)] },
  { a: [3.4, 10.2], b: [7.6, 10.2], openings: [door(2.4, 0.8)] },
  { a: [4.9, 10.2], b: [4.9, 12.1], openings: [] },
];

type Palette = ReturnType<typeof buildPalette>;

function standard(color: string, roughness: number, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function buildPalette(designMode: boolean) {
  if (!designMode) {
    const grey = standard("#b6b5b0", 0.9);
    return {
      exterior: standard("#c6c4bd", 0.92),
      interior: standard("#cfcdc6", 0.92),
      ground: standard("#bebdb7", 0.94),
      glass: new THREE.MeshStandardMaterial({
        color: "#d6dcdd",
        roughness: 0.15,
        transparent: true,
        opacity: 0.2,
      }),
      frame: standard("#7a7a76", 0.6),
      oak: grey,
      timber: grey,
      upholstery: standard("#c4c3bd", 0.9),
      stone: standard("#c9c8c2", 0.7),
      charcoal: standard("#6f6f6b", 0.7),
      greenery: standard("#a5a9a0", 0.9),
      vine: standard("#9ca396", 0.9),
      terracotta: standard("#b7b3aa", 0.85),
      floors: {
        "north-extension": grey,
        "central-core": grey,
        "southwest-room": grey,
        "east-upper-room": grey,
        "east-lower-room": grey,
        "service-core": grey,
        ensuite: grey,
      } as Record<ZoneId, THREE.Material>,
    };
  }

  // Finishes read from the outdoor moodboard: lime wash, microcement,
  // natural oak, light travertine, warm beige/taupe/charcoal. Plaster and
  // textiles are pushed to full roughness so the low sun never leaves a
  // plastic specular hotspot on them.
  const travertine = standard("#d6cec0", 0.78);
  const microcement = standard("#cdc5b7", 0.9);
  return {
    exterior: standard("#eae1d2", 0.98),
    interior: standard("#f2ebe0", 0.97),
    ground: standard("#c8bfae", 0.95),
    glass: new THREE.MeshStandardMaterial({
      color: "#bcd2d6",
      roughness: 0.05,
      metalness: 0.25,
      envMapIntensity: 1.5,
      transparent: true,
      opacity: 0.18,
    }),
    frame: standard("#2f2d2a", 0.42, 0.28),
    oak: standard("#bd8a51", 0.62),
    timber: standard("#8f6238", 0.78),
    upholstery: standard("#e3d9c7", 1),
    stone: travertine,
    charcoal: standard("#38352f", 0.62),
    greenery: standard("#8b9a76", 0.95),
    vine: standard("#63784f", 0.92),
    terracotta: standard("#c0906a", 0.88),
    floors: {
      "north-extension": standard("#c99a63", 0.6),
      "central-core": standard("#cfa26b", 0.58),
      "southwest-room": standard("#c4945f", 0.62),
      "east-upper-room": microcement,
      "east-lower-room": microcement,
      "service-core": travertine,
      ensuite: travertine,
    } as Record<ZoneId, THREE.Material>,
  };
}

const paletteCache = new Map<boolean, Palette>();
function getPalette(designMode: boolean) {
  const cached = paletteCache.get(designMode);
  if (cached) return cached;
  const built = buildPalette(designMode);
  paletteCache.set(designMode, built);
  return built;
}

/** Axis-aligned box placed by plan coordinates (metres, un-centred). */
function Blk({
  x,
  z,
  y,
  w,
  d,
  h,
  material,
}: {
  x: number;
  z: number;
  y: number;
  w: number;
  d: number;
  h: number;
  material: THREE.Material;
}) {
  return (
    <mesh position={[x - CX, y + h / 2, z - CZ]} material={material} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
    </mesh>
  );
}

function Cyl({
  x,
  z,
  y,
  r,
  h,
  material,
  segments = 20,
}: {
  x: number;
  z: number;
  y: number;
  r: number;
  h: number;
  material: THREE.Material;
  segments?: number;
}) {
  return (
    <mesh position={[x - CX, y + h / 2, z - CZ]} material={material} castShadow receiveShadow>
      <cylinderGeometry args={[r, r, h, segments]} />
    </mesh>
  );
}

/**
 * A straight wall run with door/window openings punched out. Solid spans are
 * emitted as separate boxes instead of using CSG, which keeps the mesh count
 * low enough for the light quality mode.
 */
function WallRun({
  a,
  b,
  thickness,
  height,
  openings = [],
  material,
}: {
  a: [number, number];
  b: [number, number];
  thickness: number;
  height: number;
  openings?: Opening[];
  material: THREE.Material;
}) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  const ext = thickness / 2;

  const pieces = useMemo(() => {
    const out: Array<{ from: number; to: number; bottom: number; top: number }> = [];
    let cursor = -ext;
    for (const opening of [...openings].sort((left, right) => left.at - right.at)) {
      const from = opening.at - opening.width / 2;
      const to = opening.at + opening.width / 2;
      if (from > cursor) out.push({ from: cursor, to: from, bottom: 0, top: height });
      if (opening.sill > 0) out.push({ from, to, bottom: 0, top: Math.min(opening.sill, height) });
      if (opening.head < height) out.push({ from, to, bottom: opening.head, top: height });
      cursor = to;
    }
    if (length + ext > cursor) out.push({ from: cursor, to: length + ext, bottom: 0, top: height });
    return out.filter((piece) => piece.to - piece.from > 0.001 && piece.top - piece.bottom > 0.001);
  }, [openings, length, height, ext]);

  return (
    <group position={[(a[0] + b[0]) / 2 - CX, 0, (a[1] + b[1]) / 2 - CZ]} rotation-y={-angle}>
      {pieces.map((piece, index) => (
        <mesh
          key={index}
          position={[
            (piece.from + piece.to) / 2 - length / 2,
            (piece.bottom + piece.top) / 2,
            0,
          ]}
          material={material}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[piece.to - piece.from, piece.top - piece.bottom, thickness]} />
        </mesh>
      ))}
    </group>
  );
}

/** Glazed sliding leaves for the owner-approved west opening. */
function WestGlazing({ palette }: { palette: Palette }) {
  const z0 = 8.2 - 2.2 - WEST_OPENING_WIDTH / 2;
  const leaf = WEST_OPENING_WIDTH / 2;
  return (
    <group>
      <Blk x={3.4} z={z0 + WEST_OPENING_WIDTH / 2} y={0} w={0.06} d={WEST_OPENING_WIDTH} h={WEST_OPENING_HEAD} material={palette.glass} />
      {[z0, z0 + leaf, z0 + WEST_OPENING_WIDTH].map((z) => (
        <Blk key={z} x={3.4} z={z} y={0} w={0.1} d={0.07} h={WEST_OPENING_HEAD} material={palette.frame} />
      ))}
      <Blk x={3.4} z={z0 + WEST_OPENING_WIDTH / 2} y={WEST_OPENING_HEAD - 0.08} w={0.12} d={WEST_OPENING_WIDTH} h={0.08} material={palette.frame} />
    </group>
  );
}

function Kitchen({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      <Blk x={5.7} z={0.55} y={base} w={3.8} d={0.65} h={0.9} material={palette.oak} />
      <Blk x={7.25} z={2.2} y={base} w={0.6} d={2.6} h={0.9} material={palette.oak} />
      <Blk x={5.7} z={0.55} y={base + 0.9} w={3.8} d={0.66} h={0.04} material={palette.stone} />
      <Blk x={5.4} z={2.5} y={base} w={2.2} d={0.95} h={0.92} material={palette.oak} />
      <Blk x={5.4} z={2.5} y={base + 0.92} w={2.3} d={1.05} h={0.05} material={palette.stone} />
      <Blk x={4.0} z={0.6} y={base} w={0.78} d={0.72} h={1.9} material={palette.charcoal} />
    </group>
  );
}

function Living({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      <Blk x={5.6} z={6.1} y={base + 0.005} w={3.4} d={3.8} h={0.02} material={palette.stone} />
      {/* Low sofa facing the west opening. Sized down and pulled north
          (2026-08-07) to clear the bedroom-door swing zone at the south end
          of this wall (x=3.4, z≈8.75-9.65) with margin. */}
      <Blk x={6.7} z={5.7} y={base} w={0.95} d={2.0} h={0.4} material={palette.upholstery} />
      <Blk x={7.1} z={5.7} y={base + 0.4} w={0.16} d={2.0} h={0.4} material={palette.upholstery} />
      <Blk x={6.7} z={4.75} y={base + 0.4} w={0.95} d={0.2} h={0.2} material={palette.upholstery} />
      <Blk x={6.7} z={6.65} y={base + 0.4} w={0.95} d={0.2} h={0.2} material={palette.upholstery} />
      <Cyl x={5.4} z={5.7} y={base + 0.3} r={0.5} h={0.1} material={palette.oak} />
      <Cyl x={5.4} z={5.7} y={base} r={0.2} h={0.3} material={palette.oak} />
      <Blk x={5.6} z={4.2} y={base} w={2.4} d={0.45} h={0.5} material={palette.oak} />
      <Blk x={5.6} z={4.05} y={base + 0.85} w={1.6} d={0.06} h={0.92} material={palette.charcoal} />
      {/* Woven lounge chair blockout, pulled further from the bedroom wall
          (x=3.4) so it can't crowd the door swing either. */}
      <Blk x={4.9} z={6.9} y={base} w={0.7} d={0.7} h={0.42} material={palette.upholstery} />
      <Blk x={4.9} z={7.2} y={base + 0.42} w={0.7} d={0.12} h={0.38} material={palette.oak} />
    </group>
  );
}

function Bedroom({ base, palette }: { base: number; palette: Palette }) {
  return (
    <group>
      <Blk x={1.7} z={11.4} y={base} w={1.6} d={2.0} h={0.32} material={palette.oak} />
      <Blk x={1.7} z={11.35} y={base + 0.32} w={1.6} d={1.9} h={0.18} material={palette.upholstery} />
      <Blk x={1.7} z={11.9} y={base} w={1.7} d={0.1} h={1.0} material={palette.oak} />
      <Blk x={1.15} z={11.7} y={base + 0.5} w={0.5} d={0.28} h={0.14} material={palette.upholstery} />
      <Blk x={2.25} z={11.7} y={base + 0.5} w={0.5} d={0.28} h={0.14} material={palette.upholstery} />
      <Blk x={0.55} z={11.75} y={base} w={0.42} d={0.42} h={0.45} material={palette.oak} />
      <Blk x={2.85} z={11.75} y={base} w={0.42} d={0.42} h={0.45} material={palette.oak} />
    </group>
  );
}

function Bathroom({
  base,
  palette,
  vanity,
  toilet,
  shower,
}: {
  base: number;
  palette: Palette;
  vanity: { x: number; z: number; w: number };
  toilet: { x: number; z: number };
  shower?: { x: number; z: number };
}) {
  return (
    <group>
      <Blk x={vanity.x} z={vanity.z} y={base} w={vanity.w} d={0.48} h={0.82} material={palette.oak} />
      <Blk x={vanity.x} z={vanity.z} y={base + 0.82} w={vanity.w} d={0.5} h={0.04} material={palette.stone} />
      <Cyl x={vanity.x} z={vanity.z} y={base + 0.86} r={0.19} h={0.12} material={palette.stone} />
      <Blk x={toilet.x} z={toilet.z} y={base} w={0.38} d={0.6} h={0.4} material={palette.stone} />
      <Blk x={toilet.x} z={toilet.z + 0.34} y={base} w={0.38} d={0.16} h={0.78} material={palette.stone} />
      {shower && (
        <Blk x={shower.x} z={shower.z} y={base} w={0.9} d={0.9} h={0.05} material={palette.stone} />
      )}
    </group>
  );
}

function Terrace({ palette, quality }: { palette: Palette; quality: "high" | "light" }) {
  const slats = quality === "high" ? 15 : 8;
  const vines = quality === "high" ? 11 : 5;
  const posts: Array<[number, number]> = [
    [0.55, 4.0],
    [3.1, 4.0],
    [0.55, 7.8],
    [3.1, 7.8],
  ];
  return (
    <group>
      <Blk x={1.8} z={5.9} y={0} w={3.2} d={5.0} h={0.08} material={palette.stone} />
      {posts.map(([x, z]) => (
        <Blk key={`${x}-${z}`} x={x} z={z} y={0.08} w={0.14} d={0.14} h={2.5} material={palette.timber} />
      ))}
      <Blk x={0.55} z={5.9} y={designAssumptions.pergola.heightCm / 100 - 0.18} w={0.14} d={4.2} h={0.18} material={palette.timber} />
      <Blk x={3.1} z={5.9} y={designAssumptions.pergola.heightCm / 100 - 0.18} w={0.14} d={4.2} h={0.18} material={palette.timber} />
      {Array.from({ length: slats }, (_, index) => (
        <Blk
          key={index}
          x={1.83}
          z={3.9 + (index * 4.0) / (slats - 1)}
          y={designAssumptions.pergola.heightCm / 100}
          w={2.9}
          d={0.09}
          h={0.14}
          material={palette.timber}
        />
      ))}
      {/* Climbing greenery over the pergola, as on the moodboard. */}
      {Array.from({ length: vines }, (_, index) => {
        const z = 4.1 + (index * 3.6) / (vines - 1);
        const x = index % 2 === 0 ? 0.6 : 3.05;
        const radius = 0.24 + ((index * 7) % 5) * 0.035;
        return (
          <mesh
            key={`vine-${index}`}
            position={[x - CX, designAssumptions.pergola.heightCm / 100 + 0.02, z - CZ]}
            material={palette.vine}
            castShadow
          >
            <icosahedronGeometry args={[radius, 0]} />
          </mesh>
        );
      })}
      {/* Olive trees in planters. */}
      {[
        [0.95, 3.4],
        [2.9, 8.4],
      ].map(([x, z]) => (
        <group key={`${x}-${z}`}>
          <Cyl x={x} z={z} y={0.08} r={0.32} h={0.55} material={palette.terracotta} segments={14} />
          <Cyl x={x} z={z} y={0.63} r={0.07} h={0.7} material={palette.timber} segments={8} />
          <mesh position={[x - CX, 1.6, z - CZ]} material={palette.greenery} castShadow>
            <sphereGeometry args={[0.55, 12, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ZoneFloor({
  zone,
  selected,
  onSelect,
  palette,
  showMeasurements,
}: {
  zone: HouseZone;
  selected: boolean;
  onSelect: () => void;
  palette: Palette;
  showMeasurements: boolean;
}) {
  const cx = zone.x + zone.width / 2 - CX;
  const cz = zone.z + zone.depth / 2 - CZ;

  return (
    <group>
      <mesh
        position={[cx, zone.level / 2, cz]}
        material={palette.floors[zone.id]}
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
        receiveShadow
      >
        <boxGeometry args={[zone.width, zone.level, zone.depth]} />
      </mesh>
      {selected && (
        <mesh position={[cx, zone.level + 0.006, cz]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[zone.width - 0.14, zone.depth - 0.14]} />
          <meshBasicMaterial color="#e59a50" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      )}
      <Html
        center
        position={[cx, zone.level + 1.9, cz]}
        distanceFactor={13}
        style={{ pointerEvents: "none" }}
      >
        <span className={selected ? "scene-label is-selected" : "scene-label"}>
          {zone.shortLabel}
        </span>
      </Html>
      {showMeasurements && (
        <Html
          center
          position={[cx, zone.level + 1.55, cz]}
          distanceFactor={13}
          style={{ pointerEvents: "none" }}
        >
          <span className={`measurement-chip status-${zone.status}`}>
            {Math.round(zone.width * 100)} × {Math.round(zone.depth * 100)} cm
          </span>
        </Html>
      )}
    </group>
  );
}

/**
 * Dusk gradient dome, vertex-coloured in JS so no texture or shader chunk is
 * needed: lavender-blue zenith down to a warm peach horizon that brightens
 * towards the sun, matching the evening sky in the outdoor moodboard.
 */
function SkyDome() {
  const geometry = useMemo(() => {
    const zenith = new THREE.Color("#8ea4c6");
    const horizon = new THREE.Color("#f0dcc1");
    const haze = new THREE.Color("#cfc3ac");
    const glow = new THREE.Color("#ffcf9a");
    const sun = SUN_DIRECTION;

    const sphere = new THREE.SphereGeometry(60, 32, 20);
    const position = sphere.getAttribute("position");
    const colors = new Float32Array(position.count * 3);
    const dir = new THREE.Vector3();
    const color = new THREE.Color();

    for (let i = 0; i < position.count; i += 1) {
      dir.fromBufferAttribute(position, i).normalize();
      const up = dir.y;
      if (up >= 0) {
        color.copy(horizon).lerp(zenith, THREE.MathUtils.smoothstep(up, 0, 0.55));
      } else {
        color.copy(horizon).lerp(haze, THREE.MathUtils.smoothstep(-up, 0, 0.3));
      }
      const towardsSun = Math.max(0, dir.dot(sun));
      const nearHorizon = 1 - THREE.MathUtils.smoothstep(Math.abs(up), 0, 0.7);
      color.lerp(glow, Math.pow(towardsSun, 4) * nearHorizon * 0.6);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    sphere.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return sphere;
  }, []);

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
}

function GroundSlab({ palette }: { palette: Palette }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    house.footprint.forEach(([x, z], index) => {
      if (index === 0) shape.moveTo(x - CX, z - CZ);
      else shape.lineTo(x - CX, z - CZ);
    });
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  return (
    <mesh geometry={geometry} rotation-x={Math.PI / 2} position-y={0.002} material={palette.ground} receiveShadow />
  );
}

export function MeasuredHouseScene({
  selectedZone,
  onSelectZone,
  designMode,
  quality,
  showMeasurements = false,
  onCameraAzimuth,
}: Props) {
  const palette = getPalette(designMode);
  const zoneById = useMemo(
    () => Object.fromEntries(house.zones.map((zone) => [zone.id, zone])) as Record<ZoneId, HouseZone>,
    [],
  );

  const exteriorWalls = house.footprint.map((point, index) => ({
    a: point,
    b: house.footprint[(index + 1) % house.footprint.length],
    openings: exteriorOpenings[index] ?? [],
  }));

  return (
    <Canvas
      dpr={quality === "high" ? [1, 1.75] : [0.75, 1.15]}
      shadows={quality === "high" ? "soft" : false}
      // Framed from the west, across the pergola and through the big living
      // opening — the moodboard's hero angle — rather than the old plan-like
      // view from the blank south-east corner.
      camera={{ position: [-13.2, 10.2, -3.4], fov: 36, near: 0.1, far: 200 }}
      gl={{ antialias: quality === "high", powerPreference: "high-performance" }}
    >
      <color attach="background" args={[designMode ? "#e9dcc6" : "#e9e5dc"]} />
      <fog attach="fog" args={[designMode ? "#e6d8c2" : "#e9e5dc", 24, 46]} />
      {designMode && <SkyDome />}

      {/* A single-frame lightformer probe stands in for an HDRI: warm sun wall
          to the west, cool sky overhead, sand bounce below. No external asset. */}
      {designMode && (
        <Environment frames={1} resolution={quality === "high" ? 256 : 64}>
          <color attach="background" args={["#3a3730"]} />
          <Lightformer form="rect" intensity={3.2} color="#ffd7a3" scale={[16, 6, 1]} position={[-14, 4, -3]} />
          <Lightformer form="rect" intensity={1.1} color="#b7cde9" scale={[18, 18, 1]} position={[0, 14, 0]} />
          <Lightformer form="rect" intensity={0.5} color="#c8b28e" scale={[20, 20, 1]} position={[0, -8, 0]} />
        </Environment>
      )}

      <hemisphereLight args={["#c9d8ea", "#c2a681", designMode ? 0.5 : 1.1]} />
      <ambientLight intensity={designMode ? 0.16 : 0.45} />
      <directionalLight
        position={designMode ? SUN_POSITION : [9, 13, 6]}
        intensity={designMode ? 3 : 2.3}
        color={designMode ? "#ffd3a1" : "#fff1dc"}
        castShadow={quality === "high"}
        shadow-mapSize-width={quality === "high" ? 2048 : 512}
        shadow-mapSize-height={quality === "high" ? 2048 : 512}
        shadow-camera-left={-13}
        shadow-camera-right={13}
        shadow-camera-top={13}
        shadow-camera-bottom={-13}
        shadow-camera-far={45}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={quality === "high" ? 3 : 1}
      />
      <directionalLight
        position={designMode ? [9, 6, 7] : [-8, 6, -6]}
        intensity={designMode ? 0.45 : 0.55}
        color={designMode ? "#a9c2e0" : "#ccd8e8"}
      />
      {designMode && quality === "high" && (
        <>
          <pointLight position={[0, 2.1, 0.2]} intensity={9} distance={7} color="#ffb877" />
          <pointLight position={[-0.1, 2.1, -4.2]} intensity={7} distance={6} color="#ffbe86" />
          {/* Pergola downlight, matching the terrace spots on the moodboard. */}
          <pointLight position={[-3.9, 2.4, -0.15]} intensity={6} distance={6.5} color="#ffc27f" />
        </>
      )}
      {designMode && quality === "light" && (
        <ContactShadows
          frames={1}
          position={[0, 0.105, 0]}
          scale={17}
          resolution={512}
          blur={2.6}
          far={2.4}
          opacity={0.42}
          color="#6b5a44"
        />
      )}

      <GroundSlab palette={palette} />
      {house.zones.map((zone) => (
        <ZoneFloor
          key={zone.id}
          zone={zone}
          selected={selectedZone === zone.id}
          onSelect={() => onSelectZone(zone.id)}
          palette={palette}
          showMeasurements={showMeasurements}
        />
      ))}

      {exteriorWalls.map((wall, index) => (
        <WallRun
          key={`ext-${index}`}
          a={wall.a}
          b={wall.b}
          thickness={EXT_THICKNESS}
          height={SECTION}
          openings={wall.openings}
          material={palette.exterior}
        />
      ))}
      {partitions.map((wall, index) => (
        <WallRun
          key={`int-${index}`}
          a={wall.a}
          b={wall.b}
          thickness={INT_THICKNESS}
          height={SECTION}
          openings={wall.openings}
          material={palette.interior}
        />
      ))}
      <WestGlazing palette={palette} />

      {designMode && (
        <>
          <Terrace palette={palette} quality={quality} />
          <Kitchen base={zoneById["north-extension"].level} palette={palette} />
          <Living base={zoneById["central-core"].level} palette={palette} />
          <Bedroom base={zoneById["southwest-room"].level} palette={palette} />
          <Bathroom
            base={zoneById["service-core"].level}
            palette={palette}
            vanity={{ x: 6.2, z: 11.8, w: 1.6 }}
            toilet={{ x: 5.25, z: 10.65 }}
            shower={{ x: 7.05, z: 10.75 }}
          />
          <Bathroom
            base={zoneById.ensuite.level}
            palette={palette}
            vanity={{ x: 4.15, z: 11.8, w: 1.1 }}
            toilet={{ x: 3.8, z: 10.65 }}
          />
        </>
      )}

      {!designMode && <gridHelper args={[28, 28, "#b8b1a5", "#d6d0c5"]} position={[0, -0.03, 0]} />}
      <CameraAzimuthTracker onCameraAzimuth={onCameraAzimuth} />
      <OrbitControls
        makeDefault
        target={ORBIT_TARGET}
        minDistance={9}
        maxDistance={28}
        minPolarAngle={0.24}
        maxPolarAngle={Math.PI / 2.3}
        enableDamping
        dampingFactor={0.06}
      />
    </Canvas>
  );
}
