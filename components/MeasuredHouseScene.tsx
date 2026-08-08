"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html, Lightformer, OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { designAssumptions, house, type HouseZone, type ZoneId } from "@/data/house";
import { CX, CZ, type Palette } from "./rooms/shared";
import { Kitchen } from "./rooms/Kitchen";
import { Living } from "./rooms/Living";
import { MasterBedroom } from "./rooms/MasterBedroom";
import { MasterPatio } from "./rooms/MasterPatio";
import { EastUpperRoom, EastLowerRoom } from "./rooms/EastRooms";
import { MainBathroom, EnsuiteBathroom } from "./rooms/Bathrooms";
import { Terrace } from "./rooms/Terrace";
import { OpeningOnWall } from "./rooms/Openings";

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

// Dollhouse cut: above window heads so punched openings read as true holes
// (bedroom window head 2.20) while still allowing an overhead look into rooms.
const SECTION = 2.35;
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
const MASTER_EXIT_WIDTH = designAssumptions.masterWestExit.widthCm / 100;
const MASTER_EXIT_HEAD = designAssumptions.masterWestExit.headHeightCm / 100;
const KITCHEN_ENTRY_WIDTH = designAssumptions.kitchenMainEntry.widthCm / 100;
const KITCHEN_ENTRY_HEAD = designAssumptions.kitchenMainEntry.headHeightCm / 100;

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
  // Kitchen north bay window.
  0: [window_(2.1, 1.6)],
  // Kitchen east: window north; main entry further south (near living open).
  1: [
    window_(0.85, 1.2),
    { at: 3.15, width: KITCHEN_ENTRY_WIDTH, sill: 0, head: KITCHEN_ENTRY_HEAD },
  ],
  2: [window_(1.9)],
  3: [window_(1.8), window_(5.0)],
  // South facade (east→west): E2, main bath, ensuite, master.
  4: [window_(1.9), window_(5.2, 1.0), window_(7.25, 0.7), window_(9.7, 1.5)],
  // Master west exit (remodel) — north of bed, clear of south nightstands.
  5: [{ at: 2.9, width: MASTER_EXIT_WIDTH, sill: 0, head: MASTER_EXIT_HEAD }],
  6: [window_(1.7)],
  7: [{ at: 2.2, width: WEST_OPENING_WIDTH, sill: 0, head: WEST_OPENING_HEAD }],
};

function openingKind(opening: Opening): "window" | "door" | "terrace" {
  if (opening.sill <= 0 && opening.width >= 2.4) return "terrace";
  if (opening.sill <= 0) return "door";
  return "window";
}

// Proposed internal partitions, derived from the zone boxes in data/house.ts.
// Owner request (2026-08-07): no wall between kitchen and living room — that
// run (a=[3.4,3.8] b=[7.6,3.8]) is intentionally omitted, open-plan.
const partitions: Array<{ a: [number, number]; b: [number, number]; openings: Opening[] }> = [
  { a: [7.6, 5.0], b: [7.6, 12.1], openings: [door(1.8), door(4.3)] },
  { a: [7.6, 8.55], b: [11.4, 8.55], openings: [] },
  { a: [3.4, 8.3], b: [3.4, 12.1], openings: [door(1.0), door(3.0, 0.8)] },
  { a: [3.4, 10.2], b: [7.6, 10.2], openings: [door(2.4, 0.8)] },
  { a: [4.9, 10.2], b: [4.9, 12.1], openings: [] },
];

function standard(color: string, roughness: number, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

/** Soft sage — Klil Belgian frames / shutters (light, not racing green). */
const FRAME_GREEN = "#b8c9a8";
/** Warm plaster beige for shell walls. */
const WALL_BEIGE_EXT = "#e2d4bc";
const WALL_BEIGE_INT = "#ebe0cc";
/** Light oak — hinged doors + warm joinery. */
const LIGHT_OAK = "#e2c9a4";

function buildPalette(designMode: boolean) {
  if (!designMode) {
    const grey = standard("#b6b5b0", 0.9);
    return {
      exterior: standard("#d9cdb8", 0.92),
      interior: standard("#e2d8c6", 0.92),
      ground: standard("#bebdb7", 0.94),
      glass: new THREE.MeshStandardMaterial({
        color: "#d6dcdd",
        roughness: 0.15,
        transparent: true,
        opacity: 0.2,
      }),
      frame: standard(FRAME_GREEN, 0.7, 0.08),
      oak: standard("#cfc4b4", 0.75),
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

  // Finishes: lime-wash beige shell, soft sage Klil windows, light-oak doors.
  const travertine = standard("#d6cec0", 0.78);
  const microcement = standard("#cdc5b7", 0.9);
  return {
    exterior: standard(WALL_BEIGE_EXT, 0.98),
    interior: standard(WALL_BEIGE_INT, 0.97),
    ground: standard("#c8bfae", 0.95),
    glass: new THREE.MeshStandardMaterial({
      color: "#bcd2d6",
      roughness: 0.05,
      metalness: 0.25,
      envMapIntensity: 1.5,
      transparent: true,
      opacity: 0.18,
    }),
    frame: standard(FRAME_GREEN, 0.62, 0.1),
    oak: standard(LIGHT_OAK, 0.72),
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
      "service-core": microcement,
      ensuite: microcement,
    } as Record<ZoneId, THREE.Material>,
  };
}

const paletteCache = new Map<boolean, Palette>();
paletteCache.clear();
function getPalette(designMode: boolean) {
  const cached = paletteCache.get(designMode);
  if (cached) return cached;
  const built = buildPalette(designMode);
  paletteCache.set(designMode, built);
  return built;
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
    // Slight reveal so frame isn't coplanar with wall jambs.
    const reveal = 0.012;
    for (const opening of [...openings].sort((left, right) => left.at - right.at)) {
      const from = opening.at - opening.width / 2 - reveal;
      const to = opening.at + opening.width / 2 + reveal;
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

// Room furniture: see components/rooms/*

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
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <color attach="background" args={[designMode ? "#e8e8ed" : "#e5e5ea"]} />
      <fog attach="fog" args={[designMode ? "#e8e8ed" : "#e5e5ea", 24, 46]} />
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

      {/* Klil Belgian-style glazed units in every punched opening. */}
      {exteriorWalls.map((wall, wi) =>
        wall.openings.map((opening, oi) => (
          <OpeningOnWall
            key={`ext-open-${wi}-${oi}`}
            a={wall.a}
            b={wall.b}
            opening={opening}
            kind={openingKind(opening)}
            palette={palette}
            exterior
            wallThickness={EXT_THICKNESS}
          />
        )),
      )}
      {partitions.map((wall, wi) =>
        wall.openings.map((opening, oi) => (
          <OpeningOnWall
            key={`int-open-${wi}-${oi}`}
            a={wall.a}
            b={wall.b}
            opening={opening}
            kind="door"
            palette={palette}
            wallThickness={INT_THICKNESS}
          />
        )),
      )}

      {designMode && (
        <>
          <Terrace palette={palette} quality={quality} />
          <MasterPatio palette={palette} quality={quality} />
          <Kitchen base={zoneById["north-extension"].level} palette={palette} />
          <Living base={zoneById["central-core"].level} palette={palette} />
          <MasterBedroom base={zoneById["southwest-room"].level} palette={palette} />
          <EastUpperRoom base={zoneById["east-upper-room"].level} palette={palette} />
          <EastLowerRoom base={zoneById["east-lower-room"].level} palette={palette} />
          <MainBathroom base={zoneById["service-core"].level} palette={palette} />
          <EnsuiteBathroom base={zoneById.ensuite.level} palette={palette} />
        </>
      )}

      {!designMode && <gridHelper args={[28, 28, "#b8b1a5", "#d6d0c5"]} position={[0, -0.03, 0]} />}
      <CameraAzimuthTracker onCameraAzimuth={onCameraAzimuth} />
      <OrbitControls
        makeDefault
        target={ORBIT_TARGET}
        minDistance={quality === "light" ? 5.5 : 9}
        maxDistance={quality === "light" ? 20 : 28}
        minPolarAngle={0.24}
        maxPolarAngle={Math.PI / 2.3}
        enableDamping
        dampingFactor={quality === "light" ? 0.08 : 0.06}
        rotateSpeed={quality === "light" ? 0.7 : 1}
        zoomSpeed={quality === "light" ? 0.85 : 1}
        panSpeed={quality === "light" ? 0.7 : 1}
        enablePan={quality === "high"}
      />
    </Canvas>
  );
}
