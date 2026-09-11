"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useTexture } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { FurnitureId, FurnitureSizeOverrides } from "@/data/furniture";
import { designAssumptions, house, type HouseZone, type ZoneId } from "@/data/house";
import { kitchenViews, type KitchenView, type FloorFinish } from "@/data/kitchen";
import { createMineralTextures } from "@/lib/mineralTextures";
import { createOakTexture } from "@/lib/oakTexture";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
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
import { LightingRig } from "./scene/LightingRig";
import { lightingProfiles } from "@/data/lighting";

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
  kitchenView?: KitchenView;
  floorFinish?: FloorFinish;
  kitchenAppliances?: { fridge: boolean; dishwasher: boolean };
  onToggleKitchenAppliance?: (id: "fridge" | "dishwasher") => void;
  furnitureSizes?: FurnitureSizeOverrides;
  removedFurniture?: FurnitureId[];
  selectedFurnitureId?: FurnitureId;
  onSelectFurniture?: (id: FurnitureId) => void;
  onUnavailable?: () => void;
};

// Matches OrbitControls' target below; shared so the azimuth tracker orbits
// around the same point the camera actually does.
const ORBIT_TARGET: [number, number, number] = [-1.2, 0.7, 0.4];
// Minimum change (~0.5°) before we bother lifting a new azimuth value up.
const AZIMUTH_EPSILON = 0.0087;
const CAMERA_TRANSITION_MS = 260;

type CameraFlight = {
  startedAt: number;
  fromPosition: THREE.Vector3;
  toPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  fromFov: number;
  toFov: number;
  controls: OrbitControlsImpl | null;
  controlsEnabled: boolean;
};

const ROOM_CAMERA_PRESETS: Record<ZoneId, { position: [number, number, number]; target: [number, number, number] }> = {
  // Land room views from a generous architectural distance so the transition
  // reveals the whole composition before the user chooses to zoom in.
  "north-extension": { position: [-2.45, 2.09, -1.58], target: [-0.05, 0.92, -4.95] },
  "central-core": { position: [2.43, 2.24, 4.13], target: [-0.5, 0.86, 0] },
  "southwest-room": { position: [-5.73, 2.11, 1.78], target: [-4, 0.82, 4.7] },
  "east-upper-room": { position: [1.2, 2.15, -0.7], target: [4.3, 0.86, 0.65] },
  "east-lower-room": { position: [1.23, 2.11, 1.98], target: [4.3, 0.82, 4.6] },
  "service-core": { position: [-2.1, 2.15, 3.15], target: [0.55, 0.95, 5.15] },
  ensuite: { position: [-0.1, 2.2, 3.25], target: [-1.55, 0.95, 5.1] },
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
  "east-upper-room": { minAzimuth: -2.65, maxAzimuth: -0.42, maxDistance: 9.5 },
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

function KeyboardOrbitBridge({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const { gl } = useThree();
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.listenToKeyEvents(gl.domElement);
    return () => controls.stopListenToKeyEvents();
  }, [controlsRef, gl]);
  return null;
}

function CameraDirector({
  zone,
  mode,
  controlsRef,
  revision,
  kitchenView,
}: {
  zone: HouseZone;
  mode: "overview" | "room" | "plan";
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  revision: number;
  kitchenView: KitchenView;
}) {
  const { camera, size, invalidate } = useThree();
  const flightRef = useRef<CameraFlight | null>(null);
  const interpolatedTarget = useRef(new THREE.Vector3());
  const lastRequest = useRef<string | null>(null);
  const reducedMotion = useRef(false);
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
    if (zone.id === "north-extension") {
      const shot = kitchenViews.find((entry) => entry.id === kitchenView) ?? kitchenViews[0];
      const point = (value: readonly number[]) => new THREE.Vector3(value[0] / 100 - CX, value[1] / 100 + zone.level, value[2] / 100 - CZ);
      return { position: point(shot.position), target: point(shot.target) };
    }
    const preset = ROOM_CAMERA_PRESETS[zone.id];
    return {
      position: new THREE.Vector3(...preset.position),
      target: new THREE.Vector3(...preset.target),
    };
  }, [mode, zone, kitchenView]);

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reducedMotion.current = media.matches;
      invalidate();
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [invalidate]);

  useLayoutEffect(() => {
    // A resize adjusts the lens without returning an already-orbited camera
    // to its preset. Repeated navigation retargets from the current frame.
    const request = `${mode}-${zone.id}-${kitchenView}-${revision}`;
    const firstPlacement = lastRequest.current === null;
    const requestChanged = lastRequest.current !== request;
    lastRequest.current = request;
    const controls = controlsRef.current;
    const aspect = Math.max(size.width, 1) / Math.max(size.height, 1);
    const verticalFov = mode === "room" ? 50 : 36;
    const fov = aspect < 1 ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(verticalFov) / 2) / aspect)) : verticalFov;
    const setFov = (value: number) => {
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.setFocalLength(0.5 * camera.getFilmHeight() / Math.tan(THREE.MathUtils.degToRad(value) / 2));
      }
    };
    if (!requestChanged) {
      setFov(fov);
      invalidate();
      return;
    }

    const fromPosition = camera.position.clone();
    const fromTarget = controls?.target.clone() ?? destination.target.clone();
    const fromFov = camera instanceof THREE.PerspectiveCamera ? camera.fov : fov;
    const controlsEnabled = controls?.enabled ?? true;

    // Clear residual orbit damping, then resolve the final pose against the
    // new room's limits before interpolating. Controls cannot clamp the
    // camera halfway through its journey or add a long settling tail.
    const damping = controls?.enableDamping ?? false;
    if (controls) {
      controls.enableDamping = false;
      controls.update();
    }
    camera.position.copy(destination.position);
    if (controls) {
      controls.target.copy(destination.target);
      controls.update();
      controls.enableDamping = damping;
    } else {
      camera.lookAt(destination.target);
    }
    const toPosition = camera.position.clone();
    const toTarget = controls?.target.clone() ?? destination.target.clone();
    if (firstPlacement || reducedMotion.current) {
      setFov(fov);
      invalidate();
      return;
    }

    camera.position.copy(fromPosition);
    camera.lookAt(fromTarget);
    if (controls) {
      controls.target.copy(fromTarget);
      controls.enabled = false;
    }
    const flight: CameraFlight = {
      startedAt: performance.now(),
      fromPosition, toPosition, fromTarget, toTarget, fromFov, toFov: fov,
      controls, controlsEnabled,
    };
    flightRef.current = flight;
    invalidate();
    return () => {
      if (flightRef.current === flight) flightRef.current = null;
      if (controls) controls.enabled = controlsEnabled;
    };
  }, [camera, controlsRef, destination, revision, mode, zone.id, kitchenView, size.width, size.height, invalidate]);

  // Run before OrbitControls (-1), so it resumes only after the final pose.
  // Wall-clock time keeps navigation bounded even when a slow frame occurs.
  useFrame(() => {
    const flight = flightRef.current;
    if (!flight) return;
    const progress = reducedMotion.current ? 1 : Math.min(1, (performance.now() - flight.startedAt) / CAMERA_TRANSITION_MS);
    const eased = 1 - (1 - progress) ** 3;
    camera.position.lerpVectors(flight.fromPosition, flight.toPosition, eased);
    const target = flight.controls?.target ?? interpolatedTarget.current;
    target.lerpVectors(flight.fromTarget, flight.toTarget, eased);
    camera.lookAt(target);
    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = THREE.MathUtils.lerp(flight.fromFov, flight.toFov, eased);
      camera.setFocalLength(0.5 * camera.getFilmHeight() / Math.tan(THREE.MathUtils.degToRad(fov) / 2));
    }
    if (progress === 1) {
      flightRef.current = null;
      if (flight.controls) flight.controls.enabled = flight.controlsEnabled;
    } else {
      invalidate();
    }
  }, -2);

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
  fixed?: boolean;
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

// Approved sill/head dimensions are above finished floor. The floor slab's
// world elevation must be included, otherwise the kitchen counter buries the
// bottom 10 cm of the window frame.
const kitchenWindow = (at: number, width: number): Opening => {
  const floorLevel = house.zones.find((zone) => zone.id === "north-extension")!.level;
  return { ...window_(at, width), sill: WINDOW_SILL + floorLevel, head: WINDOW_HEAD + floorLevel };
};

// Keyed by footprint edge index (edge n runs from point n to point n+1).
const exteriorOpenings: Record<number, Opening[]> = {
  // Kitchen north bay window.
  0: [kitchenWindow(2.1, 1.6)],
  // Kitchen east: window north; main entry further south (near living open).
  1: [
    kitchenWindow(0.85, 1.2),
    // Hinge outward so the entry leaf never swings across the kitchen joinery.
    { at: 3.15, width: KITCHEN_ENTRY_WIDTH, sill: 0, head: KITCHEN_ENTRY_HEAD, swing: -1 },
  ],
  2: [window_(1.9)],
  3: [window_(1.8), window_(5.0)],
  // South facade (east→west): E2, main bath, ensuite, master.
  4: [window_(1.9), window_(5.2, 1.0), window_(7.25, 0.7), window_(9.7, 1.5)],
  // Master west exit (remodel) — north of bed, clear of south nightstands.
  5: [{ at: 2.9, width: MASTER_EXIT_WIDTH, sill: 0, head: MASTER_EXIT_HEAD, swing: 1 }],
  6: [window_(1.7)],
  7: [{ at: 2.2, width: WEST_OPENING_WIDTH, sill: 0, head: WEST_OPENING_HEAD, fixed: true }],
};

function openingKind(opening: Opening): "window" | "door" | "terrace" {
  if (opening.fixed) return "window";
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
const LIGHT_OAK = "#e6d6bb";

function buildPalette(
  designMode: boolean,
  textures: {
    plaster: THREE.Texture;
    oak: THREE.Texture;
    herringbone: HerringboneTextureSet;
    stone: THREE.Texture;
    limewash: ReturnType<typeof createMineralTextures>;
    microtopping: ReturnType<typeof createMineralTextures>;
  },
  floorFinish: FloorFinish,
  enableTransmission: boolean,
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
        transmission: enableTransmission ? 0.72 : 0,
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
    color: "#e6d5b9",
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
  const mineralWall = new THREE.MeshPhysicalMaterial({
    color: "#efe6d7", map: textures.limewash.albedo,
    bumpMap: textures.limewash.bump, bumpScale: 0.0008,
    roughness: 1, roughnessMap: textures.limewash.roughness,
    envMapIntensity: 0.8,
  });
  const sandFloor = new THREE.MeshPhysicalMaterial({
    color: "#eee4d3", map: textures.microtopping.albedo,
    bumpMap: textures.microtopping.bump, bumpScale: 0.00065,
    roughness: 1, roughnessMap: textures.microtopping.roughness,
    clearcoat: 0.06, clearcoatRoughness: 0.65, envMapIntensity: 1,
    // Restrained diffuse bounce compensates for the real-time renderer's
    // missing indirect illumination; direct and contact shadows remain visible.
    emissive: "#e8ddc9", emissiveIntensity: 0.12,
  });
  sandFloor.userData.moduleMeters = 4;
  oakFloor.userData.moduleMeters = HERRINGBONE_MODULE_METERS;
  const dryFloor = floorFinish === "sand-microtopping" ? sandFloor : oakFloor;
  const vine = finish("#4f6941", 0.86);
  const flower = finish("#f7f1e7", 0.72, 0, 0.04);
  greenery.side = THREE.DoubleSide;
  vine.side = THREE.DoubleSide;
  flower.side = THREE.DoubleSide;
  return {
    exterior: mineralWall,
    interior: mineralWall,
    ground: finish("#bdb19e", 0.94, 0, 0, textures.stone, 0.005),
    glass: new THREE.MeshPhysicalMaterial({
      color: "#bcd2d6",
      roughness: 0.025,
      metalness: 0,
      envMapIntensity: 2.2,
      transparent: true,
      opacity: 0.28,
      transmission: enableTransmission ? 0.82 : 0,
      thickness: 0.018,
      ior: 1.46,
    }),
    frame: finish(FRAME_GREEN, 0.53, 0.36, 0.06),
    oak: finish(LIGHT_OAK, 0.61, 0, 0.035, textures.oak, 0.00035),
    timber: finish("#765338", 0.72, 0, 0.025),
    upholstery: finish("#ddd3c3", 0.98),
    stone: travertine,
    charcoal: finish("#38352f", 0.48, 0.14, 0.08),
    greenery,
    vine,
    flower,
    terracotta: finish("#c0906a", 0.8, 0, 0.04),
    floors: {
      "north-extension": dryFloor,
      "central-core": dryFloor,
      "southwest-room": dryFloor,
      "east-upper-room": dryFloor,
      "east-lower-room": dryFloor,
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
    "brightness(1.18) saturate(0.86) contrast(1.02)",
    THREE.SRGBColorSpace,
    "rgba(255, 246, 232, 0.08)",
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
    activeMaterial.opacity = THREE.MathUtils.damp(activeMaterial.opacity, obstructed ? 0.055 : 1, 12, delta);
    const transparent = activeMaterial.opacity < 0.999;
    if (activeMaterial.transparent !== transparent) {
      activeMaterial.transparent = transparent;
      activeMaterial.needsUpdate = true;
    }
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
          <boxGeometry args={[piece.to - piece.from, piece.top - piece.bottom, thickness]} onUpdate={(geometry) => {
            const positions = geometry.attributes.position;
            const normals = geometry.attributes.normal;
            const uv = geometry.attributes.uv;
            for (let i = 0; i < positions.count; i++) {
              const along = positions.getX(i) + (piece.from + piece.to) / 2;
              const height = positions.getY(i) + (piece.bottom + piece.top) / 2;
              const depth = positions.getZ(i);
              uv.setXY(i, (Math.abs(normals.getX(i)) > 0.5 ? depth : along) / 2.4, (Math.abs(normals.getY(i)) > 0.5 ? depth : height) / 2.4);
            }
            uv.needsUpdate = true;
          }} />
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
    const moduleMeters = sourceFloorMaterial.userData.moduleMeters ?? 1.6;
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
  kitchenView = "entrance",
  floorFinish = "oak",
  kitchenAppliances,
  onToggleKitchenAppliance,
  furnitureSizes = {},
  removedFurniture = [],
  selectedFurnitureId,
  onSelectFurniture = () => undefined,
}: Props) {
  const { gl } = useThree();
  const floorResolution = quality === "high" ? "2k" : "1k";
  const [
    plasterSource,
    herringboneSource,
    herringboneNormalSource,
    herringboneRoughnessSource,
    stoneSource,
  ] = useTexture([
    "/textures/lime-plaster-ai.jpg",
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
      oak: createOakTexture(textureAnisotropy),
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
      limewash: createMineralTextures("limewash", quality === "high" ? 512 : 256, textureAnisotropy),
      microtopping: createMineralTextures("microtopping", quality === "high" ? 512 : 256, textureAnisotropy),
    }),
    [
      herringboneNormalSource,
      herringboneRoughnessSource,
      herringboneSource,
      plasterSource,
      stoneSource,
      textureAnisotropy,
      quality,
    ],
  );
  const palette = useMemo(() => buildPalette(designMode, textureSet, floorFinish, false), [designMode, textureSet, floorFinish]);
  useEffect(() => {
    RectAreaLightUniformsLib.init();
  }, []);
  useEffect(() => () => {
    for (const value of Object.values(textureSet)) {
      if (value instanceof THREE.Texture) value.dispose();
      else for (const texture of Object.values(value)) texture.dispose();
    }
  }, [textureSet]);
  useEffect(() => () => {
    const materials = new Set<THREE.Material>(Object.values(palette.floors));
    Object.values(palette).forEach((value) => { if (value instanceof THREE.Material) materials.add(value); });
    materials.forEach((material) => material.dispose());
  }, [palette]);
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
  const kitchenRoom = cameraMode === "room" && selectedZone === "north-extension";
  const furnitureEditing = useMemo<FurnitureEditingState>(() => ({
    sizes: furnitureSizes,
    removedIds: removedFurniture,
    selectedId: selectedFurnitureId,
    onSelect: onSelectFurniture,
  }), [furnitureSizes, onSelectFurniture, removedFurniture, selectedFurnitureId]);

  return (
    <>
      <LightingRig designMode={designMode} quality={quality} kitchenRoom={kitchenRoom} cameraMode={cameraMode} selectedZone={selectedZone} floorFinish={floorFinish} removedFurniture={removedFurniture} furnitureSignature={JSON.stringify(furnitureSizes)} sunHour={sunHour} sun={sun} />

      {designMode && <MediterraneanLandscape palette={palette} quality={quality} />}
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
          height={cameraMode === "room" ? designAssumptions.finishedCeilingHeightCm / 100 + zoneById[selectedZone].level : SECTION}
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
                // Pocket leaves retract into the wall pocket; they never swing
                // across the master bedroom or WC clearance.
                open={opening.style === "sliding" ? true : isDoorOpen(id)}
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
          {(cameraMode !== "room" || selectedZone === "central-core") && <Terrace palette={palette} quality={quality} furnitureEditing={furnitureEditing} />}
          {(cameraMode !== "room" || selectedZone === "southwest-room") && <MasterPatio palette={palette} quality={quality} furnitureEditing={furnitureEditing} />}
          {(cameraMode !== "room" || selectedZone === "north-extension" || selectedZone === "central-core") && (
            <Kitchen base={zoneById["north-extension"].level} palette={palette} furnitureEditing={furnitureEditing} appliances={kitchenAppliances} onToggleAppliance={onToggleKitchenAppliance} />
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
            <MainBathroom base={zoneById["service-core"].level} palette={palette} reflections={quality === "high" && cameraMode === "room"} />
          )}
          {(cameraMode !== "room" || selectedZone === "ensuite") && (
            <EnsuiteBathroom base={zoneById.ensuite.level} palette={palette} reflections={quality === "high" && cameraMode === "room"} />
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
        kitchenView={kitchenView}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={ORBIT_TARGET}
        minDistance={cameraMode === "room" ? 0.65 : quality === "light" ? 5.5 : 8}
        maxDistance={kitchenRoom ? 7 : cameraMode === "room" ? roomCameraLimits.maxDistance : quality === "light" ? 20 : 28}
        minAzimuthAngle={cameraMode === "room" && !kitchenRoom ? roomCameraLimits.minAzimuth : -Infinity}
        maxAzimuthAngle={cameraMode === "room" && !kitchenRoom ? roomCameraLimits.maxAzimuth : Infinity}
        minPolarAngle={cameraMode === "plan" ? 0.01 : 0.24}
        maxPolarAngle={kitchenRoom ? Math.PI / 2 - 0.03 : Math.PI / 2.3}
        enableDamping
        dampingFactor={quality === "light" ? 0.08 : 0.06}
        rotateSpeed={quality === "light" ? 0.7 : 1}
        zoomSpeed={quality === "light" ? 0.85 : 1}
        panSpeed={quality === "light" ? 0.7 : 1}
        enablePan={quality === "high" && (cameraMode !== "room" || kitchenRoom)}
      />
      <KeyboardOrbitBridge controlsRef={controlsRef} />
    </>
  );
}

export function MeasuredHouseScene(props: Props) {
  const { designMode, quality, onUnavailable } = props;
  const profile = lightingProfiles[quality];

  return (
    <Canvas
      dpr={profile.dpr}
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
        const canvas = gl.domElement;
        canvas.tabIndex = 0;
        canvas.setAttribute("aria-label", "Interactive 3D house. Focus and use arrow keys to orbit, plus and minus to zoom.");
        const onContextLost = (event: Event) => {
          event.preventDefault();
          onUnavailable?.();
        };
        canvas.addEventListener("webglcontextlost", onContextLost, { once: true });
      }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <SceneContent {...props} />
    </Canvas>
  );
}
