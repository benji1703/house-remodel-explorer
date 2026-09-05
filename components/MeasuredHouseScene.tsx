"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Html, Lightformer, OrbitControls, useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { FurnitureId, FurnitureSizeOverrides } from "@/data/furniture";
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
import type { FurnitureEditingState } from "./rooms/EditableFurniture";
import { MediterraneanLandscape } from "./rooms/LuxuryDetails";

type Props = {
  selectedZone: ZoneId;
  onSelectZone: (id: ZoneId) => void;
  designMode: boolean;
  quality: "high" | "light";
  showMeasurements?: boolean;
  onCameraAzimuth?: (radians: number) => void;
  sunHour?: number;
  allDoorsOpen?: boolean;
  doorStates?: Record<string, boolean>;
  onToggleDoor?: (id: string) => void;
  cameraMode?: "overview" | "room" | "plan";
  cameraRevision?: number;
  furnitureSizes?: FurnitureSizeOverrides;
  removedFurniture?: FurnitureId[];
  selectedFurnitureId?: FurnitureId;
  onSelectFurniture?: (id: FurnitureId) => void;
};

// Matches OrbitControls' target below; shared so the azimuth tracker orbits
// around the same point the camera actually does.
const ORBIT_TARGET: [number, number, number] = [-1.2, 0.7, 0.4];
// Minimum change (~0.5°) before we bother lifting a new azimuth value up.
const AZIMUTH_EPSILON = 0.0087;

const ROOM_CAMERA_PRESETS: Record<ZoneId, { position: [number, number, number]; target: [number, number, number] }> = {
  "north-extension": { position: [-1.65, 1.7, -2.7], target: [-0.05, 0.92, -4.95] },
  "central-core": { position: [1.45, 1.78, 2.75], target: [-0.5, 0.86, 0] },
  "southwest-room": { position: [-5.15, 1.68, 2.75], target: [-4, 0.82, 4.7] },
  "east-upper-room": { position: [2.25, 1.68, 1.95], target: [4.3, 0.82, 0.45] },
  "east-lower-room": { position: [2.25, 1.68, 2.85], target: [4.3, 0.82, 4.6] },
  "service-core": { position: [-0.65, 1.58, 4.3], target: [0.55, 0.8, 5.37] },
  ensuite: { position: [-0.95, 1.56, 4.25], target: [-1.55, 0.8, 5.4] },
};

// Room views orbit only through the interior-facing quadrant. This keeps the
// camera on the room side of the measured envelope instead of letting zoom or
// pan carry it behind an opaque wall.
const ROOM_CAMERA_LIMITS: Record<
  ZoneId,
  { minAzimuth: number; maxAzimuth: number; maxDistance: number }
> = {
  "north-extension": { minAzimuth: -1.18, maxAzimuth: -0.05, maxDistance: 10 },
  "central-core": { minAzimuth: 0.05, maxAzimuth: 1.2, maxDistance: 12 },
  "southwest-room": { minAzimuth: -3.05, maxAzimuth: -2.05, maxDistance: 9.5 },
  "east-upper-room": { minAzimuth: -1.48, maxAzimuth: -0.42, maxDistance: 9.5 },
  "east-lower-room": { minAzimuth: -2.82, maxAzimuth: -1.72, maxDistance: 9.5 },
  "service-core": { minAzimuth: -2.85, maxAzimuth: -1.75, maxDistance: 6.5 },
  ensuite: { minAzimuth: 2.05, maxAzimuth: 3.08, maxDistance: 5.5 },
};

/** Reports the camera's azimuth around ORBIT_TARGET, throttled to avoid excessive re-renders. */
function CameraAzimuthTracker({
  onCameraAzimuth,
  controlsRef,
}: {
  onCameraAzimuth?: (radians: number) => void;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const last = useRef(0);
  useFrame(({ camera }) => {
    if (!onCameraAzimuth) return;
    // The footprint's z=0 edge is north (see house.footprint / VectorPlan's
    // top-dimension line), so -Z is north in this scene. With OrbitControls'
    // up axis fixed to world Y, the needle's screen rotation equals this
    // azimuth directly (see MeasuredHouseScene report for the derivation).
    const target = controlsRef.current?.target;
    const azimuth = Math.atan2(
      camera.position.x - (target?.x ?? ORBIT_TARGET[0]),
      camera.position.z - (target?.z ?? ORBIT_TARGET[2]),
    );
    if (Math.abs(azimuth - last.current) > AZIMUTH_EPSILON) {
      last.current = azimuth;
      onCameraAzimuth(azimuth);
    }
  });
  return null;
}

function CameraDirector({
  zone,
  mode,
  controlsRef,
  revision,
}: {
  zone: HouseZone;
  mode: "overview" | "room" | "plan";
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  revision: number;
}) {
  const { camera } = useThree();
  const destination = useMemo(() => {
    if (mode === "overview") {
      return {
        // A high three-quarter view keeps the measured shell legible as a
        // dollhouse. Lower angles turn the 2.35 m section walls into an opaque
        // foreground and hide the remodel entirely.
        position: new THREE.Vector3(-13.8, 16.4, -10.4),
        target: new THREE.Vector3(-0.55, 0.32, 0.55),
      };
    }
    if (mode === "plan") {
      return {
        position: new THREE.Vector3(0, 20.5, 0.01),
        target: new THREE.Vector3(0, 0, 0),
      };
    }
    const preset = ROOM_CAMERA_PRESETS[zone.id];
    return {
      position: new THREE.Vector3(...preset.position),
      target: new THREE.Vector3(...preset.target),
    };
  }, [mode, zone]);

  useEffect(() => {
    const controls = controlsRef.current;
    camera.position.copy(destination.position);
    if (controls) {
      controls.target.copy(destination.target);
      controls.update();
    } else {
      camera.lookAt(destination.target);
    }
  }, [camera, controlsRef, destination, revision]);

  return null;
}

// Dollhouse cut: above window heads so punched openings read as true holes
// (bedroom window head 2.20) while still allowing an overhead look into rooms.
const SECTION = 2.35;
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

type Opening = {
  at: number;
  width: number;
  sill: number;
  head: number;
  style?: "hinged" | "sliding";
  /** Hinged: +1 opens toward local +Z, −1 toward local −Z. */
  swing?: 1 | -1;
  /** Sliding: +1 stacks toward local +X, −1 toward local −X. */
  slide?: 1 | -1;
  /** Sliding: +1 local +Z face, −1 local −Z face. */
  face?: 1 | -1;
};

const door = (
  at: number,
  width = 0.9,
  opts: { style?: "hinged" | "sliding"; swing?: 1 | -1; slide?: 1 | -1; face?: 1 | -1 } = {},
): Opening => ({
  at,
  width,
  sill: 0,
  head: DOOR_HEAD,
  style: opts.style ?? "hinged",
  swing: opts.swing ?? 1,
  slide: opts.slide ?? 1,
  face: opts.face ?? 1,
});
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
    { at: 3.15, width: KITCHEN_ENTRY_WIDTH, sill: 0, head: KITCHEN_ENTRY_HEAD, swing: 1 },
  ],
  2: [window_(1.9)],
  3: [window_(1.8), window_(5.0)],
  // South facade (east→west): E2, main bath, ensuite, master.
  4: [window_(1.9), window_(5.2, 1.0), window_(7.25, 0.7), window_(9.7, 1.5)],
  // Master west exit (remodel) — north of bed, clear of south nightstands.
  5: [{ at: 2.9, width: MASTER_EXIT_WIDTH, sill: 0, head: MASTER_EXIT_HEAD, swing: 1 }],
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
//
// Wall local frame (OpeningOnWall rot −atan2): for northbound runs, local +Z
// is west (−X world), local −Z is east (+X world).
const partitions: Array<{ a: [number, number]; b: [number, number]; openings: Opening[] }> = [
  // Living↔E1/E2: bedrooms east → local −Z → swing −1.
  { a: [7.6, 5.0], b: [7.6, 12.1], openings: [door(1.8, 0.9, { swing: -1 }), door(4.3, 0.9, { swing: -1 })] },
  { a: [7.6, 8.55], b: [11.4, 8.55], openings: [] },
  // Master (west, +Z) ↔ baths (east): BR hinged into master; ensuite slides on master face.
  {
    a: [3.4, 8.3],
    b: [3.4, 12.1],
    openings: [
      door(1.0, 0.9, { swing: 1 }),
      door(3.0, 0.8, { style: "sliding", slide: -1, face: 1 }),
    ],
  },
  // Living↔main bath: bath south → local +Z on eastbound run → swing +1.
  { a: [3.4, 10.2], b: [7.6, 10.2], openings: [door(2.4, 0.8, { swing: 1 })] },
  { a: [4.9, 10.2], b: [4.9, 12.1], openings: [] },
];

function finish(
  color: string,
  roughness: number,
  metalness = 0,
  clearcoat = 0,
  map?: THREE.Texture,
  bumpScale = 0,
) {
  const parameters: THREE.MeshPhysicalMaterialParameters = {
    color,
    bumpScale,
    roughness,
    metalness,
    clearcoat,
    clearcoatRoughness: Math.min(1, roughness + 0.08),
    envMapIntensity: 1.15,
  };
  if (map) {
    parameters.map = map;
    if (bumpScale > 0) parameters.bumpMap = map;
  }
  return new THREE.MeshPhysicalMaterial(parameters);
}

/** Soft sage — Klil Belgian frames / shutters (light, not racing green). */
const FRAME_GREEN = "#66735e";
/** Pale natural oak — shared by doors and joinery to sit quietly with the floor. */
const LIGHT_OAK = "#d8c0a1";

function buildPalette(
  designMode: boolean,
  textures: {
    plaster: THREE.Texture;
    oak: THREE.Texture;
    herringbone: HerringboneTextureSet;
    stone: THREE.Texture;
  },
) {
  if (!designMode) {
    const grey = finish("#b6b5b0", 0.9);
    grey.side = THREE.DoubleSide;
    return {
      exterior: finish("#d9cdb8", 0.92),
      interior: finish("#e2d8c6", 0.92),
      ground: finish("#bebdb7", 0.94),
      glass: new THREE.MeshPhysicalMaterial({
        color: "#d6dcdd",
        roughness: 0.08,
        transparent: true,
        opacity: 0.24,
        transmission: 0.72,
        thickness: 0.012,
        envMapIntensity: 1.8,
      }),
      frame: finish(FRAME_GREEN, 0.7, 0.08),
      oak: finish("#cfc4b4", 0.75),
      timber: grey,
      upholstery: finish("#c4c3bd", 0.9),
      stone: finish("#c9c8c2", 0.7),
      charcoal: finish("#6f6f6b", 0.7),
      greenery: finish("#a5a9a0", 0.9),
      vine: finish("#9ca396", 0.9),
      flower: grey,
      terracotta: finish("#b7b3aa", 0.85),
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
  const travertine = finish("#d7c9b5", 0.58, 0, 0.035, textures.stone, 0.008);
  const microcement = finish("#c8beb1", 0.89, 0, 0.02, textures.stone, 0.004);
  const oakFloor = new THREE.MeshPhysicalMaterial({
    color: "#d8c3a5",
    map: textures.herringbone.albedo,
    normalMap: textures.herringbone.normal,
    normalScale: new THREE.Vector2(0.3, 0.3),
    roughness: 0.84,
    roughnessMap: textures.herringbone.roughness,
    clearcoat: 0.035,
    clearcoatRoughness: 0.78,
    envMapIntensity: 0.96,
  });
  const greenery = finish("#789064", 0.82, 0, 0.025);
  const vine = finish("#4f6941", 0.86);
  const flower = finish("#f7f1e7", 0.72, 0, 0.04);
  greenery.side = THREE.DoubleSide;
  vine.side = THREE.DoubleSide;
  flower.side = THREE.DoubleSide;
  return {
    exterior: finish("#e4d7c5", 0.96, 0, 0, textures.plaster, 0.01),
    interior: finish("#eee7dd", 0.95, 0, 0, textures.plaster, 0.007),
    ground: finish("#bdb19e", 0.94, 0, 0, textures.stone, 0.005),
    glass: new THREE.MeshPhysicalMaterial({
      color: "#bcd2d6",
      roughness: 0.025,
      metalness: 0,
      envMapIntensity: 2.2,
      transparent: true,
      opacity: 0.28,
      transmission: 0.82,
      thickness: 0.018,
      ior: 1.46,
    }),
    frame: finish(FRAME_GREEN, 0.53, 0.36, 0.06),
    oak: finish(LIGHT_OAK, 0.61, 0, 0.035, textures.oak, 0.004),
    timber: finish("#765338", 0.72, 0, 0.025),
    upholstery: finish("#ddd3c3", 0.98),
    stone: travertine,
    charcoal: finish("#38352f", 0.48, 0.14, 0.08),
    greenery,
    vine,
    flower,
    terracotta: finish("#c0906a", 0.8, 0, 0.04),
    floors: {
      "north-extension": oakFloor,
      "central-core": oakFloor,
      "southwest-room": oakFloor,
      "east-upper-room": oakFloor,
      "east-lower-room": oakFloor,
      "service-core": microcement,
      ensuite: microcement,
    } as Record<ZoneId, THREE.Material>,
  };
}

function prepareTexture(source: THREE.Texture, repeat: [number, number], anisotropy: number) {
  const texture = source.clone();
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.anisotropy = anisotropy;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

type HerringboneTextureSet = {
  albedo: THREE.Texture;
  normal: THREE.Texture;
  roughness: THREE.Texture;
};

const HERRINGBONE_MODULE_METERS = 3.4;

function prepareGradedFloorMap(
  source: THREE.Texture,
  anisotropy: number,
  filter: string,
  colorSpace: THREE.ColorSpace,
  wash?: string,
) {
  if (typeof document === "undefined" || !source.image) {
    const fallback = prepareTexture(source, [1, 1], anisotropy);
    fallback.colorSpace = colorSpace;
    fallback.needsUpdate = true;
    return fallback;
  }

  const image = source.image as CanvasImageSource & { width: number; height: number };
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  if (!context) return prepareTexture(source, [1, 1], anisotropy);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.filter = filter;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  if (wash) {
    context.filter = "none";
    context.fillStyle = wash;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function prepareHerringboneTexture(
  albedoSource: THREE.Texture,
  normalSource: THREE.Texture,
  roughnessSource: THREE.Texture,
  anisotropy: number,
): HerringboneTextureSet {
  const albedo = prepareGradedFloorMap(
    albedoSource,
    anisotropy,
    "brightness(3.2) saturate(0.3) contrast(0.54)",
    THREE.SRGBColorSpace,
    "rgba(255, 246, 232, 0.3)",
  );
  const normal = prepareTexture(normalSource, [1, 1], anisotropy);
  const roughness = prepareGradedFloorMap(
    roughnessSource,
    anisotropy,
    "brightness(1.48) contrast(0.72)",
    THREE.NoColorSpace,
  );
  normal.colorSpace = THREE.NoColorSpace;
  roughness.colorSpace = THREE.NoColorSpace;
  normal.needsUpdate = true;
  roughness.needsUpdate = true;
  return { albedo, normal, roughness };
}

type PlanPoint = [number, number];

function segmentsIntersect(a: PlanPoint, b: PlanPoint, c: PlanPoint, d: PlanPoint) {
  const cross = (p: PlanPoint, q: PlanPoint, r: PlanPoint) =>
    (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  return abC * abD < 0 && cdA * cdB < 0;
}

function wallObstructsZone(a: PlanPoint, b: PlanPoint, camera: PlanPoint, zone: HouseZone) {
  const inset = Math.min(0.22, zone.width * 0.12, zone.depth * 0.12);
  const left = zone.x + inset;
  const right = zone.x + zone.width - inset;
  const top = zone.z + inset;
  const bottom = zone.z + zone.depth - inset;
  const samples: PlanPoint[] = [
    [zone.x + zone.width / 2, zone.z + zone.depth / 2],
    [left, top],
    [right, top],
    [left, bottom],
    [right, bottom],
  ];
  return samples.some((target) => segmentsIntersect(camera, target, a, b));
}

function CutawayOpening({
  a,
  b,
  focusZone,
  children,
}: {
  a: PlanPoint;
  b: PlanPoint;
  focusZone?: HouseZone;
  children: ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    if (!focusZone) {
      groupRef.current.visible = true;
      return;
    }
    const cameraPlan: PlanPoint = [camera.position.x + CX, camera.position.z + CZ];
    groupRef.current.visible = !wallObstructsZone(a, b, cameraPlan, focusZone);
  });
  return <group ref={groupRef}>{children}</group>;
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
  focusZone,
}: {
  a: PlanPoint;
  b: PlanPoint;
  thickness: number;
  height: number;
  openings?: Opening[];
  material: THREE.Material;
  focusZone?: HouseZone;
}) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  const ext = thickness / 2;
  const groupRef = useRef<THREE.Group>(null);
  const obstructedRef = useRef(false);
  const displayMaterial = useMemo(() => {
    if (!focusZone) return material;
    const clone = material.clone();
    clone.transparent = true;
    clone.opacity = 1;
    clone.depthWrite = true;
    clone.side = THREE.DoubleSide;
    return clone;
  }, [focusZone, material]);

  useEffect(() => {
    if (displayMaterial === material) return;
    return () => displayMaterial.dispose();
  }, [displayMaterial, material]);

  useFrame(({ camera }, delta) => {
    if (!focusZone || displayMaterial === material) return;
    const firstMesh = groupRef.current?.children.find((object): object is THREE.Mesh => object instanceof THREE.Mesh);
    const activeMaterial = firstMesh?.material;
    if (!(activeMaterial instanceof THREE.Material)) return;
    const cameraPlan: PlanPoint = [camera.position.x + CX, camera.position.z + CZ];
    const obstructed = wallObstructsZone(a, b, cameraPlan, focusZone);
    activeMaterial.opacity = THREE.MathUtils.damp(activeMaterial.opacity, obstructed ? 0.1 : 1, 12, delta);
    activeMaterial.depthWrite = !obstructed;
    if (obstructed === obstructedRef.current) return;
    obstructedRef.current = obstructed;
    groupRef.current?.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = !obstructed;
      object.receiveShadow = !obstructed;
    });
  });

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
    <group ref={groupRef} position={[(a[0] + b[0]) / 2 - CX, 0, (a[1] + b[1]) / 2 - CZ]} rotation-y={-angle}>
      {pieces.map((piece, index) => (
        <mesh
          key={index}
          position={[
            (piece.from + piece.to) / 2 - length / 2,
            (piece.bottom + piece.top) / 2,
            0,
          ]}
          material={displayMaterial}
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
  showLabel,
}: {
  zone: HouseZone;
  selected: boolean;
  onSelect: () => void;
  palette: Palette;
  showMeasurements: boolean;
  showLabel: boolean;
}) {
  const cx = zone.x + zone.width / 2 - CX;
  const cz = zone.z + zone.depth / 2 - CZ;
  const sourceFloorMaterial = palette.floors[zone.id];
  const floorMaterial = useMemo(() => {
    if (!(sourceFloorMaterial instanceof THREE.MeshStandardMaterial) || !sourceFloorMaterial.map) {
      return sourceFloorMaterial;
    }
    const material = sourceFloorMaterial.clone();
    const moduleMeters = sourceFloorMaterial.normalMap
      ? HERRINGBONE_MODULE_METERS
      : 1.6;
    const cloneMap = (source: THREE.Texture | null) => {
      if (!source) return null;
      const map = source.clone();
      map.repeat.set(zone.width / moduleMeters, zone.depth / moduleMeters);
      // BoxGeometry starts UVs again for every room. Offset each clone by its
      // measured plan origin so the parquet is one continuous installation
      // through the open kitchen/living threshold instead of visibly resetting.
      map.offset.set(-zone.x / moduleMeters, -(zone.z + zone.depth) / moduleMeters);
      map.needsUpdate = true;
      return map;
    };
    // Separate maps keep the compact 40 × 8 cm boards crisp without turning
    // the darker grain itself into exaggerated surface relief.
    material.map = cloneMap(sourceFloorMaterial.map);
    material.bumpMap = cloneMap(sourceFloorMaterial.bumpMap);
    material.normalMap = cloneMap(sourceFloorMaterial.normalMap);
    material.roughnessMap = cloneMap(sourceFloorMaterial.roughnessMap);
    material.needsUpdate = true;
    return material;
  }, [sourceFloorMaterial, zone.depth, zone.width, zone.x, zone.z]);

  useEffect(() => {
    if (floorMaterial === sourceFloorMaterial) return;
    return () => {
      if (floorMaterial instanceof THREE.MeshStandardMaterial) {
        floorMaterial.map?.dispose();
        floorMaterial.bumpMap?.dispose();
        floorMaterial.normalMap?.dispose();
        floorMaterial.roughnessMap?.dispose();
      }
      floorMaterial.dispose();
    };
  }, [floorMaterial, sourceFloorMaterial]);

  return (
    <group>
      <mesh
        position={[cx, zone.level / 2, cz]}
        material={floorMaterial}
        receiveShadow
      >
        <boxGeometry args={[zone.width, zone.level, zone.depth]} />
      </mesh>
      {showLabel && (
        <Html
          center
          position={[cx, zone.level + 1.9, cz]}
          style={{ pointerEvents: "auto" }}
        >
          <button
            type="button"
            className={selected ? "scene-label is-selected" : "scene-label"}
            aria-label={`View ${zone.label}`}
            onClick={(event) => {
              event.stopPropagation();
              onSelect();
            }}
          >
            {zone.shortLabel}
          </button>
        </Html>
      )}
      {showMeasurements && (
        <Html
          center
          position={[cx, zone.level + 1.55, cz]}
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
function SkyDome({ sunDirection, hour }: { sunDirection: THREE.Vector3; hour: number }) {
  const geometry = useMemo(() => {
    const daylight = Math.sin(THREE.MathUtils.clamp((hour - 6) / 14, 0, 1) * Math.PI);
    const zenith = new THREE.Color("#273549").lerp(new THREE.Color("#9db7d6"), daylight);
    const horizon = new THREE.Color("#826b70").lerp(new THREE.Color("#edf1ef"), daylight * 0.86);
    const haze = new THREE.Color("#424653").lerp(new THREE.Color("#c9d0ce"), daylight);
    const glow = new THREE.Color("#ff9b52").lerp(new THREE.Color("#fff0cf"), daylight);
    const sun = sunDirection;

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
  }, [hour, sunDirection]);

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

function SceneContent({
  selectedZone,
  onSelectZone,
  designMode,
  quality,
  showMeasurements = false,
  onCameraAzimuth,
  sunHour = 16.5,
  allDoorsOpen = true,
  doorStates = {},
  onToggleDoor,
  cameraMode = "overview",
  cameraRevision = 0,
  furnitureSizes = {},
  removedFurniture = [],
  selectedFurnitureId = "living-sofa",
  onSelectFurniture = () => undefined,
}: Props) {
  const { gl } = useThree();
  const floorResolution = quality === "high" ? "2k" : "1k";
  const [
    plasterSource,
    oakSource,
    herringboneSource,
    herringboneNormalSource,
    herringboneRoughnessSource,
    stoneSource,
  ] = useTexture([
    "/textures/lime-plaster-ai.jpg",
    "/textures/light-oak-ai.jpg",
    `/textures/herringbone-parquet-diff-${floorResolution}.jpg`,
    `/textures/herringbone-parquet-normal-${floorResolution}.jpg`,
    `/textures/herringbone-parquet-rough-${floorResolution}.jpg`,
    "/textures/jerusalem-stone-ai.jpg",
  ]);
  const textureAnisotropy = Math.min(gl.capabilities.getMaxAnisotropy(), quality === "high" ? 16 : 4);
  const textureSet = useMemo(
    () => ({
      plaster: prepareGradedFloorMap(
        plasterSource,
        textureAnisotropy,
        "brightness(1.52) saturate(0.42) contrast(0.72)",
        THREE.SRGBColorSpace,
        "rgba(244, 238, 228, 0.12)",
      ),
      oak: prepareGradedFloorMap(
        oakSource,
        textureAnisotropy,
        "brightness(1.65) saturate(0.48) contrast(0.8)",
        THREE.SRGBColorSpace,
      ),
      herringbone: prepareHerringboneTexture(
        herringboneSource,
        herringboneNormalSource,
        herringboneRoughnessSource,
        textureAnisotropy,
      ),
      stone: prepareGradedFloorMap(
        stoneSource,
        textureAnisotropy,
        "brightness(1.22) saturate(0.55) contrast(0.82)",
        THREE.SRGBColorSpace,
      ),
    }),
    [
      herringboneNormalSource,
      herringboneRoughnessSource,
      herringboneSource,
      oakSource,
      plasterSource,
      stoneSource,
      textureAnisotropy,
    ],
  );
  const palette = useMemo(() => buildPalette(designMode, textureSet), [designMode, textureSet]);
  const zoneById = useMemo(
    () => Object.fromEntries(house.zones.map((zone) => [zone.id, zone])) as Record<ZoneId, HouseZone>,
    [],
  );

  const exteriorWalls = house.footprint.map((point, index) => ({
    a: point,
    b: house.footprint[(index + 1) % house.footprint.length],
    openings: exteriorOpenings[index] ?? [],
  }));
  const sun = useMemo(() => {
    const progress = THREE.MathUtils.clamp((sunHour - 6) / 14, 0, 1);
    const angle = progress * Math.PI;
    const altitude = Math.max(0, Math.sin(angle));
    const position: [number, number, number] = [
      Math.cos(angle) * 18,
      (sunHour >= 6 && sunHour <= 20 ? 0.35 : -3) + altitude * 15,
      Math.sin(angle) * 17,
    ];
    const dawnDusk = 1 - altitude;
    return {
      position,
      direction: new THREE.Vector3(...position).normalize(),
      color: new THREE.Color("#fff3d6").lerp(new THREE.Color("#ff9c55"), dawnDusk * 0.82),
      intensity: sunHour >= 6 && sunHour <= 20 ? 0.08 + altitude * 3.55 : 0,
      sky: new THREE.Color("#28384e").lerp(new THREE.Color("#b7cce1"), altitude),
      practical: THREE.MathUtils.smoothstep(sunHour, 16, 19),
      daylight: altitude,
    };
  }, [sunHour]);
  const isDoorOpen = (id: string) => doorStates[id] ?? allDoorsOpen;
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const roomCameraLimits = ROOM_CAMERA_LIMITS[selectedZone];
  const furnitureEditing = useMemo<FurnitureEditingState>(() => ({
    sizes: furnitureSizes,
    removedIds: removedFurniture,
    selectedId: selectedFurnitureId,
    onSelect: onSelectFurniture,
  }), [furnitureSizes, onSelectFurniture, removedFurniture, selectedFurnitureId]);

  return (
    <>
      <color attach="background" args={[designMode ? sun.sky : "#e5e5ea"]} />
      <fog attach="fog" args={[designMode ? sun.sky : "#e5e5ea", 25, 49]} />
      {designMode && <SkyDome sunDirection={sun.direction} hour={sunHour} />}

      {/* A single-frame lightformer probe stands in for an HDRI: warm sun wall
          to the west, cool sky overhead, sand bounce below. No external asset. */}
      {designMode && (
        <Environment frames={1} resolution={quality === "high" ? 512 : 64}>
          <color attach="background" args={["#3a3730"]} />
          <Lightformer form="rect" intensity={0.18 + sun.daylight * 2.8} color={sun.color} scale={[16, 6, 1]} position={sun.position} />
          <Lightformer form="rect" intensity={0.2 + sun.daylight * 1.15} color="#c9dcf1" scale={[18, 18, 1]} position={[0, 14, 0]} />
          <Lightformer form="rect" intensity={0.1 + sun.daylight * 0.42} color="#c8b28e" scale={[20, 20, 1]} position={[0, -8, 0]} />
        </Environment>
      )}

      <hemisphereLight args={["#d4e2f2", "#b99470", designMode ? 0.16 + sun.daylight * 0.52 : 1.1]} />
      <ambientLight intensity={designMode ? 0.07 + sun.daylight * 0.14 : 0.45} />
      <directionalLight
        position={designMode ? sun.position : [9, 13, 6]}
        intensity={designMode ? sun.intensity : 2.3}
        color={designMode ? sun.color : "#fff1dc"}
        castShadow={quality === "high"}
        shadow-mapSize-width={quality === "high" ? 4096 : 512}
        shadow-mapSize-height={quality === "high" ? 4096 : 512}
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
        intensity={designMode ? 0.08 + sun.daylight * 0.38 : 0.55}
        color={designMode ? "#a9c2e0" : "#ccd8e8"}
      />
      {designMode && quality === "high" && (
        <>
          <pointLight position={[0, 2.1, 0.2]} intensity={0.5 + sun.practical * 4.5} distance={6} decay={2} color="#ffd1a0" />
          <pointLight position={[-0.1, 2.1, -4.2]} intensity={0.4 + sun.practical * 3.8} distance={5.5} decay={2} color="#ffd1a0" />
          {/* Pergola downlight, matching the terrace spots on the moodboard. */}
          <pointLight position={[-3.9, 2.4, -0.15]} intensity={0.35 + sun.practical * 3.4} distance={5.5} decay={2} color="#ffc58a" />
        </>
      )}
      {designMode && (
        <>
          <pointLight position={[-4.0, 1.05, 5.05]} intensity={0.08 + sun.practical * 3.4} distance={3.7} decay={2} color="#ffc27f" />
          <pointLight position={[4.55, 1.05, 0.4]} intensity={0.08 + sun.practical * 3.0} distance={3.5} decay={2} color="#ffc786" />
          <pointLight position={[4.55, 1.05, 4.8]} intensity={0.08 + sun.practical * 3.0} distance={3.5} decay={2} color="#ffc786" />
        </>
      )}
      {designMode && (
        <ContactShadows
          frames={1}
          position={[0, 0.105, 0]}
          scale={17}
          resolution={quality === "high" ? 1024 : 512}
          blur={quality === "high" ? 2.1 : 2.6}
          far={2.4}
          opacity={quality === "high" ? 0.24 : 0.3}
          color="#62594f"
        />
      )}

      {designMode && cameraMode !== "room" && <MediterraneanLandscape palette={palette} quality={quality} />}
      <GroundSlab palette={palette} />
      {house.zones.map((zone) => (
        <ZoneFloor
          key={zone.id}
          zone={zone}
          selected={selectedZone === zone.id}
          onSelect={() => onSelectZone(zone.id)}
          palette={palette}
          showMeasurements={showMeasurements}
          showLabel={cameraMode !== "room"}
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
          focusZone={cameraMode === "room" ? zoneById[selectedZone] : undefined}
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
          focusZone={cameraMode === "room" ? zoneById[selectedZone] : undefined}
        />
      ))}

      {/* Klil Belgian-style glazed units in every punched opening. */}
      {exteriorWalls.map((wall, wi) =>
        wall.openings.map((opening, oi) => {
          const id = `ext-${wi}-${oi}`;
          return (
            <CutawayOpening key={`ext-open-${wi}-${oi}`} a={wall.a} b={wall.b} focusZone={cameraMode === "room" ? zoneById[selectedZone] : undefined}>
              <OpeningOnWall
                a={wall.a}
                b={wall.b}
                opening={opening}
                kind={openingKind(opening)}
                palette={palette}
                exterior
                wallThickness={EXT_THICKNESS}
                open={isDoorOpen(id)}
                onToggle={openingKind(opening) === "window" ? undefined : () => onToggleDoor?.(id)}
              />
            </CutawayOpening>
          );
        }),
      )}
      {partitions.map((wall, wi) =>
        wall.openings.map((opening, oi) => {
          const id = `int-${wi}-${oi}`;
          return (
            <CutawayOpening key={`int-open-${wi}-${oi}`} a={wall.a} b={wall.b} focusZone={cameraMode === "room" ? zoneById[selectedZone] : undefined}>
              <OpeningOnWall
                a={wall.a}
                b={wall.b}
                opening={opening}
                kind="door"
                palette={palette}
                wallThickness={INT_THICKNESS}
                open={isDoorOpen(id)}
                onToggle={() => onToggleDoor?.(id)}
              />
            </CutawayOpening>
          );
        }),
      )}

      {designMode && (
        <>
          {cameraMode !== "room" && <Terrace palette={palette} quality={quality} furnitureEditing={furnitureEditing} />}
          {cameraMode !== "room" && <MasterPatio palette={palette} quality={quality} furnitureEditing={furnitureEditing} />}
          {(cameraMode !== "room" || selectedZone === "north-extension" || selectedZone === "central-core") && (
            <Kitchen base={zoneById["north-extension"].level} palette={palette} furnitureEditing={furnitureEditing} />
          )}
          {(cameraMode !== "room" || selectedZone === "central-core" || selectedZone === "north-extension") && (
            <Living base={zoneById["central-core"].level} palette={palette} furnitureEditing={furnitureEditing} />
          )}
          {(cameraMode !== "room" || selectedZone === "southwest-room") && (
            <MasterBedroom base={zoneById["southwest-room"].level} palette={palette} furnitureEditing={furnitureEditing} nightFactor={sun.practical} />
          )}
          {(cameraMode !== "room" || selectedZone === "east-upper-room") && (
            <EastUpperRoom base={zoneById["east-upper-room"].level} palette={palette} furnitureEditing={furnitureEditing} nightFactor={sun.practical} />
          )}
          {(cameraMode !== "room" || selectedZone === "east-lower-room") && (
            <EastLowerRoom base={zoneById["east-lower-room"].level} palette={palette} furnitureEditing={furnitureEditing} nightFactor={sun.practical} />
          )}
          {(cameraMode !== "room" || selectedZone === "service-core") && (
            <MainBathroom base={zoneById["service-core"].level} palette={palette} />
          )}
          {(cameraMode !== "room" || selectedZone === "ensuite") && (
            <EnsuiteBathroom base={zoneById.ensuite.level} palette={palette} />
          )}
        </>
      )}

      {!designMode && <gridHelper args={[28, 28, "#b8b1a5", "#d6d0c5"]} position={[0, -0.03, 0]} />}
      <CameraAzimuthTracker onCameraAzimuth={onCameraAzimuth} controlsRef={controlsRef} />
      <CameraDirector
        zone={zoneById[selectedZone]}
        mode={cameraMode}
        controlsRef={controlsRef}
        revision={cameraRevision}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={ORBIT_TARGET}
        minDistance={cameraMode === "room" ? 0.65 : quality === "light" ? 5.5 : 8}
        maxDistance={cameraMode === "room" ? roomCameraLimits.maxDistance : quality === "light" ? 20 : 28}
        minAzimuthAngle={cameraMode === "room" ? roomCameraLimits.minAzimuth : -Infinity}
        maxAzimuthAngle={cameraMode === "room" ? roomCameraLimits.maxAzimuth : Infinity}
        minPolarAngle={cameraMode === "plan" ? 0.01 : 0.24}
        maxPolarAngle={Math.PI / 2.3}
        enableDamping
        dampingFactor={quality === "light" ? 0.08 : 0.06}
        rotateSpeed={quality === "light" ? 0.7 : 1}
        zoomSpeed={quality === "light" ? 0.85 : 1}
        panSpeed={quality === "light" ? 0.7 : 1}
        enablePan={quality === "high" && cameraMode !== "room"}
      />
    </>
  );
}

export function MeasuredHouseScene(props: Props) {
  const { designMode, quality } = props;

  return (
    <Canvas
      dpr={quality === "high" ? [1, 2] : [0.75, 1.15]}
      shadows={quality === "high" ? "soft" : false}
      // The initial camera matches CameraDirector's composed dollhouse view so
      // there is no low-angle flash while controls mount.
      camera={{ position: [-13.8, 16.4, -10.4], fov: 36, near: 0.1, far: 200 }}
      gl={{ antialias: quality === "high", powerPreference: "high-performance", alpha: false }}
      performance={{ min: quality === "high" ? 0.7 : 0.5 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = designMode ? 0.98 : 0.95;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <SceneContent {...props} />
    </Canvas>
  );
}
