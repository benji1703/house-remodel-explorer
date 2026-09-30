"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, OrthographicCamera, useTexture } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { FurnitureId, FurnitureSizeOverrides } from "@/data/furniture";
import { designAssumptions, house, type HouseZone, type ZoneId } from "@/data/house";
import { kitchenViews, type KitchenView, type FloorFinish } from "@/data/kitchen";
import { applyMoodSurface, cloneSurfaceMaterial } from "@/lib/moodSurfaceMaterial";
import { moodSurfaces } from "@/data/moodSurfaces";
import { createTextileBump } from "@/lib/textileTexture";
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
import { gardenViews, type GardenView } from "@/data/gardenViews";
import { gardenCamera } from "@/data/landscape";
import { MediterraneanLandscape } from "./landscape/MediterraneanLandscape";
import { GardenDiagnostics } from "./scene/GardenDiagnostics";
import { LightingRig } from "./scene/LightingRig";
import { LightingPlanMarkers } from "./scene/LightingPlanMarkers";
import { dampSceneValue } from "@/lib/dampSceneValue";
import { RoomDetail, SceneQualityProvider, ShadowRefreshProvider } from "./scene/SceneDetail";
import { SceneFirstFrame, SceneLoading, ScenePending } from "./scene/SceneLoading";
import { RenderBudget } from "./scene/RenderBudget";
import { getDaylight } from "@/lib/daylight";
import { EXT_THICKNESS, INT_THICKNESS, exteriorOpenings, partitions, openingKind, type Opening } from "@/data/structuralWalls";
import { FirstPersonController, WalkControls, createWalkInput, type WalkInput } from "./scene/FirstPersonControls";
import { lightingProfiles } from "@/data/lighting";

type Props = {
  active: boolean;
  selectedZone: ZoneId;
  onSelectZone: (id: ZoneId) => void;
  designMode: boolean;
  quality: "high" | "light";
  showMeasurements?: boolean;
  onCameraAzimuth?: (radians: number) => void;
  sunHour?: number;
  houseLightsOn?: boolean;
  allDoorsOpen?: boolean;
  doorStates?: Record<string, boolean>;
  onToggleDoor?: (id: string) => void;
  cameraMode?: "overview" | "room" | "plan" | "garden" | "walk";
  cameraRevision?: number;
  gardenView?: GardenView;
  kitchenView?: KitchenView;
  floorFinish?: FloorFinish;
  kitchenAppliances?: { fridge: boolean; dishwasher: boolean };
  onToggleKitchenAppliance?: (id: "fridge" | "dishwasher") => void;
  furnitureSizes?: FurnitureSizeOverrides;
  removedFurniture?: FurnitureId[];
  selectedFurnitureId?: FurnitureId;
  onSelectFurniture?: (id: FurnitureId) => void;
  onUnavailable?: () => void;
  onShowPlan?: () => void;
  onRevealChange?: (revealed: boolean) => void;
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
  ensuite: { position: [-3.4, 2.8, 6.9], target: [-1.5, 1.14, 4.9] },
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
  ensuite: { minAzimuth: -1.55, maxAzimuth: 0.1, maxDistance: 5.5 },
};

/** Reports the camera's azimuth around ORBIT_TARGET, throttled to avoid excessive re-renders. */
function CameraAzimuthTracker({
  onCameraAzimuth,
  controlsRef,
  walking,
}: {
  walking: boolean;
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
    const azimuth = walking ? new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ").y : Math.atan2(
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
  const { gl, camera } = useThree();
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const canvas = gl.domElement;
    const onKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement !== canvas) return;
      if (["+", "=", "-", "_"].includes(event.key)) {
        event.preventDefault();
        const factor = event.key === "-" || event.key === "_" ? 1.12 : 1 / 1.12;
        if (camera instanceof THREE.OrthographicCamera) {
          camera.zoom = THREE.MathUtils.clamp(camera.zoom / factor, 10, 200);
          camera.updateProjectionMatrix();
        } else {
          const offset = camera.position.clone().sub(controls.target);
          offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
          camera.position.copy(controls.target).add(offset);
        }
        controls.update();
        return;
      }
      const directions: Record<string, [number, number]> = {
        ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1],
      };
      const direction = directions[event.key];
      if (!direction) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.shiftKey && controls.enablePan) {
        const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
        const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
        const translation = right.multiplyScalar(-direction[0] * .18).add(up.multiplyScalar(direction[1] * .18));
        camera.position.add(translation); controls.target.add(translation); controls.update();
        return;
      }
      const amount = event.shiftKey ? 0.22 : event.ctrlKey || event.metaKey ? 0.14 : 0.08;
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta += direction[0] * amount;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi + direction[1] * amount, controls.minPolarAngle + 0.01, controls.maxPolarAngle - 0.01);
      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
      camera.lookAt(controls.target);
      controls.update();
    };
    canvas.addEventListener("keydown", onKeyDown);
    return () => canvas.removeEventListener("keydown", onKeyDown);
  }, [camera, controlsRef, gl]);
  return null;
}

function PlanCamera() {
  const { size } = useThree();
  return <OrthographicCamera makeDefault position={[0, 24, 0.001]} zoom={Math.min(size.width / 24, size.height / 21)} near={0.1} far={100} />;
}

function CameraDirector({
  zone,
  mode,
  controlsRef,
  revision,
  kitchenView,
  gardenView,
}: {
  zone: HouseZone;
  mode: "overview" | "room" | "plan" | "garden";
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  revision: number;
  kitchenView: KitchenView;
  gardenView: GardenView;
}) {
  const { camera, size, invalidate, controls: activeControls } = useThree();
  const flightRef = useRef<CameraFlight | null>(null);
  const interpolatedTarget = useRef(new THREE.Vector3());
  const lastRequest = useRef<string | null>(null);
  const lastControls = useRef<OrbitControlsImpl | null>(null);
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
    if (mode === "garden") {
      const point = (p: readonly number[]) => new THREE.Vector3(p[0] / 100 - CX, p[1] / 100, p[2] / 100 - CZ);
      const shot = gardenView === "hero" ? gardenCamera : gardenViews[gardenView];
      return { position: point(shot.positionCm), target: point(shot.targetCm) };
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
  }, [mode, zone, kitchenView, gardenView]);

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
    const controls = controlsRef.current;
    // OrbitControls installs its initial target before becoming the default.
    // Do not consume a camera request until both belong to the mounted camera;
    // otherwise its default target overwrites a cold-loaded room's look-at.
    if (!controls || controls.object !== camera || activeControls !== controls) return;
    const request = `${camera.uuid}-${mode}-${zone.id}-${kitchenView}-${gardenView}-${revision}`;
    const firstPlacement = lastRequest.current === null || lastControls.current !== controls;
    const requestChanged = firstPlacement || lastRequest.current !== request;
    lastRequest.current = request;
    lastControls.current = controls;
    const aspect = Math.max(size.width, 1) / Math.max(size.height, 1);
    const verticalFov = mode === "garden" ? 50 : mode === "room" ? 50 : 36;
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
  }, [camera, controlsRef, destination, revision, mode, zone.id, kitchenView, gardenView, size.width, size.height, invalidate, activeControls]);

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

// Keep a visible lintel above the tallest fitted opening, including the
// 240 cm living glazing. A 235 cm cut left that frame floating above its wall.
const SECTION = Math.max(...Object.values(exteriorOpenings).flat().map((opening) => opening.head)) + 0.06;

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

function buildPalette(
  designMode: boolean,
  textures: {
    plaster: THREE.Texture;
    oak: THREE.Texture;
    travertine: THREE.Texture;
    clay: THREE.Texture;
    linen: THREE.Texture;
    mineral: THREE.Texture;
    textileBump: THREE.Texture;
    herringbone: HerringboneTextureSet;
    stone: THREE.Texture;
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
      ceiling: finish("#e2d8c6", 0.92),
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
  const travertine = applyMoodSurface(finish("#ffffff", 0.64, 0, 0.025), textures.travertine, "travertine");
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
    roughness: 0.94,
    envMapIntensity: 0.8,
  });
  applyMoodSurface(mineralWall, textures.plaster, "plaster");
  const ceiling = cloneSurfaceMaterial(mineralWall);
  ceiling.color.set("#f5e8cf");
  const sandFloor = new THREE.MeshPhysicalMaterial({
    roughness: 0.58,
    clearcoat: 0.1, clearcoatRoughness: 0.48, envMapIntensity: 1.15,
  });
  applyMoodSurface(sandFloor, textures.mineral, "mineral");
  sandFloor.userData.moduleMeters = 4;
  oakFloor.userData.moduleMeters = HERRINGBONE_MODULE_METERS;
  const roomFloor = floorFinish === "sand-microtopping" ? sandFloor : oakFloor;
  const vine = finish("#4f6941", 0.86);
  const flower = finish("#f7f1e7", 0.72, 0, 0.04);
  greenery.side = THREE.DoubleSide;
  vine.side = THREE.DoubleSide;
  flower.side = THREE.DoubleSide;
  return {
    exterior: mineralWall,
    interior: mineralWall,
    ceiling,
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
    oak: applyMoodSurface(finish("#ffffff", 0.64, 0, 0.025), textures.oak, "oak"),
    timber: finish("#765338", 0.72, 0, 0.025),
    upholstery: applyMoodSurface(new THREE.MeshPhysicalMaterial({
      roughness: 0.96, sheen: 0.5, sheenRoughness: 0.85,
      sheenColor: new THREE.Color("#fff7eb"), envMapIntensity: 0.65,
      bumpMap: textures.textileBump, bumpScale: 0.0007, side: THREE.DoubleSide,
    }), textures.linen, "linen"),
    stone: travertine,
    charcoal: finish("#38352f", 0.48, 0.14, 0.08),
    greenery,
    vine,
    flower,
    terracotta: applyMoodSurface(finish("#ffffff", 0.91), textures.clay, "clay"),
    floors: {
      "north-extension": roomFloor,
      "central-core": roomFloor,
      "southwest-room": roomFloor,
      "east-upper-room": roomFloor,
      "east-lower-room": roomFloor,
      "service-core": roomFloor,
      ensuite: roomFloor,
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
    const clone = cloneSurfaceMaterial(material);
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

  useFrame(({ camera, invalidate }, delta) => {
    if (!focusZone || displayMaterial === material) return;
    const firstMesh = groupRef.current?.children.find((object): object is THREE.Mesh => object instanceof THREE.Mesh);
    const activeMaterial = firstMesh?.material;
    if (!(activeMaterial instanceof THREE.Material)) return;
    const cameraPlan: PlanPoint = [camera.position.x + CX, camera.position.z + CZ];
    const obstructed = wallObstructsZone(a, b, cameraPlan, focusZone);
    activeMaterial.opacity = dampSceneValue(activeMaterial.opacity, obstructed ? 0.055 : 1, 12, delta, invalidate);
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
    // The punched wall and fitted frame share the exact opening datum.
    // A reveal is wall depth, not an air gap around the frame perimeter.
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
    <group ref={groupRef} userData={{ wallRun: true }} position={[(a[0] + b[0]) / 2 - CX, 0, (a[1] + b[1]) / 2 - CZ]} rotation-y={-angle}>
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
    const material = cloneSurfaceMaterial(sourceFloorMaterial);
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

function FootprintSurface({ material, elevation, ceiling = false }: { material: THREE.Material; elevation: number; ceiling?: boolean }) {
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
    <mesh geometry={geometry} rotation-x={Math.PI / 2} position-y={elevation} material={material} castShadow={ceiling} receiveShadow />
  );
}

function SceneContent({
  active,
  walkInput,
  selectedZone,
  onSelectZone,
  designMode,
  quality,
  showMeasurements = false,
  onCameraAzimuth,
  sunHour = 13.5,
  houseLightsOn = true,
  allDoorsOpen = true,
  doorStates = {},
  onToggleDoor,
  cameraMode = "overview",
  gardenView = "hero",
  cameraRevision = 0,
  kitchenView = "entrance",
  floorFinish = "oak",
  kitchenAppliances,
  onToggleKitchenAppliance,
  furnitureSizes = {},
  removedFurniture = [],
  selectedFurnitureId,
  onSelectFurniture = () => undefined,
  onReady,
  landscapeReady,
  onLandscapeReady,
}: Props & { walkInput: React.RefObject<WalkInput>; onReady: () => void; landscapeReady: "high" | "light" | null; onLandscapeReady: (quality: "high" | "light") => void }) {
  const { gl } = useThree();
  const [geometryRevision, setGeometryRevision] = useState(0);
  const shadowRefreshFrame = useRef<number | null>(null);
  const refreshShadows = useCallback(() => {
    // Asset effects run after commit. Batch concurrent arrivals so a room
    // takes one fresh contact capture, without a perpetual shadow render loop.
    if (shadowRefreshFrame.current !== null) return;
    shadowRefreshFrame.current = requestAnimationFrame(() => {
      shadowRefreshFrame.current = null;
      setGeometryRevision((revision) => revision + 1);
    });
  }, []);
  useEffect(() => () => {
    if (shadowRefreshFrame.current !== null) cancelAnimationFrame(shadowRefreshFrame.current);
  }, []);
  const floorResolution = quality === "high" ? "2k" : "1k";
  const [
    plasterSource,
    oakSource,
    travertineSource,
    claySource,
    linenSource,
    mineralSource,
    herringboneSource,
    herringboneNormalSource,
    herringboneRoughnessSource,
    stoneSource,
  ] = useTexture([
    moodSurfaces.plaster.image,
    moodSurfaces.oak.image,
    moodSurfaces.travertine.image,
    moodSurfaces.clay.image,
    moodSurfaces.linen.image,
    moodSurfaces.mineral.image,
    `/textures/herringbone-parquet-diff-${floorResolution}.jpg`,
    `/textures/herringbone-parquet-normal-${floorResolution}.jpg`,
    `/textures/herringbone-parquet-rough-${floorResolution}.jpg`,
    "/textures/jerusalem-stone-ai.jpg",
  ]);
  const textureAnisotropy = Math.min(gl.capabilities.getMaxAnisotropy(), quality === "high" ? 16 : 4);
  const textureSet = useMemo(
    () => ({
      plaster: prepareTexture(plasterSource, [1, 1], textureAnisotropy),
      oak: prepareTexture(oakSource, [1, 1], textureAnisotropy),
      travertine: prepareTexture(travertineSource, [1, 1], textureAnisotropy),
      clay: prepareTexture(claySource, [1, 1], textureAnisotropy),
      linen: prepareTexture(linenSource, [1, 1], textureAnisotropy),
      mineral: prepareTexture(mineralSource, [1, 1], textureAnisotropy),
      textileBump: createTextileBump(),
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
      plasterSource,
      oakSource,
      travertineSource,
      claySource,
      linenSource,
      mineralSource,
      stoneSource,
      textureAnisotropy,
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
  const sun = useMemo(() => getDaylight(sunHour), [sunHour]);
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
      <LightingRig geometryRevision={geometryRevision} designMode={designMode} quality={quality} landscapeReady={landscapeReady} kitchenRoom={kitchenRoom} cameraMode={cameraMode} selectedZone={selectedZone} floorFinish={floorFinish} removedFurniture={removedFurniture} furnitureSignature={JSON.stringify(furnitureSizes)} sunHour={sunHour} houseLightsOn={houseLightsOn} sun={sun} />

      {designMode && <MediterraneanLandscape palette={palette} quality={quality} onReady={onLandscapeReady} />}
      <FootprintSurface material={palette.ground} elevation={0.002} />
      {cameraMode === "walk" && <FootprintSurface material={palette.ceiling} elevation={zoneById[selectedZone].level + designAssumptions.finishedCeilingHeightCm / 100} ceiling />}
      {house.zones.map((zone) => (
        <ZoneFloor
          key={zone.id}
          zone={zone}
          selected={selectedZone === zone.id}
          onSelect={() => { if (cameraMode !== "walk") onSelectZone(zone.id); }}
          palette={palette}
          showMeasurements={showMeasurements}
          showLabel={cameraMode === "overview" || cameraMode === "plan"}
        />
      ))}

      {exteriorWalls.map((wall, index) => (
        <WallRun
          key={`ext-${index}`}
          a={wall.a}
          b={wall.b}
          thickness={EXT_THICKNESS}
          height={cameraMode === "room" || cameraMode === "garden" || cameraMode === "walk" ? designAssumptions.finishedCeilingHeightCm / 100 + zoneById[selectedZone].level : SECTION}
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
          height={cameraMode === "walk" ? designAssumptions.finishedCeilingHeightCm / 100 + zoneById[selectedZone].level : SECTION}
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

      {/* Room silhouettes stay legible; close details follow projected size as you zoom. */}
      {designMode && (
        <SceneQualityProvider value={quality}><ShadowRefreshProvider value={refreshShadows}>
          <RoomDetail center={[-3.9, 0.8, -0.15]} visible={(cameraMode !== "room" || selectedZone === "central-core")}><Terrace palette={palette} quality={quality} furnitureEditing={furnitureEditing} /></RoomDetail>
          <RoomDetail center={[-7, 0.8, 4.2]} visible={(cameraMode !== "room" || selectedZone === "southwest-room")}><MasterPatio palette={palette} quality={quality} furnitureEditing={furnitureEditing} /></RoomDetail>
          <RoomDetail center={[-0.3, 0.8, -4.3]} visible={(cameraMode !== "room" || selectedZone === "north-extension" || selectedZone === "central-core")}>
            <Kitchen base={zoneById["north-extension"].level} palette={palette} furnitureEditing={furnitureEditing} appliances={kitchenAppliances} onToggleAppliance={onToggleKitchenAppliance} lightsOn={houseLightsOn} nightFactor={sun.practical} />
          </RoomDetail>
          <RoomDetail center={[-0.3, 0.8, 0.05]} visible={(cameraMode !== "room" || selectedZone === "central-core" || selectedZone === "north-extension")}>
            <Living base={zoneById["central-core"].level} palette={palette} furnitureEditing={furnitureEditing} lightsOn={houseLightsOn} nightFactor={sun.practical} />
          </RoomDetail>
          <RoomDetail center={[-4, 0.8, 4.9]} visible={(cameraMode !== "room" || selectedZone === "southwest-room")}>
            <MasterBedroom base={zoneById["southwest-room"].level} palette={palette} furnitureEditing={furnitureEditing} nightFactor={houseLightsOn ? sun.practical : 0} />
          </RoomDetail>
          <RoomDetail center={[4.3, 0.8, 0.5]} visible={(cameraMode !== "room" || selectedZone === "east-upper-room")}>
            <EastUpperRoom base={zoneById["east-upper-room"].level} palette={palette} furnitureEditing={furnitureEditing} nightFactor={houseLightsOn ? sun.practical : 0} />
          </RoomDetail>
          <RoomDetail center={[4.3, 0.8, 4.65]} visible={(cameraMode !== "room" || selectedZone === "east-lower-room")}>
            <EastLowerRoom base={zoneById["east-lower-room"].level} palette={palette} furnitureEditing={furnitureEditing} nightFactor={houseLightsOn ? sun.practical : 0} />
          </RoomDetail>
          <RoomDetail center={[0, 0.8, 4.9]} visible={(cameraMode !== "room" || selectedZone === "service-core")}>
            <MainBathroom base={zoneById["service-core"].level} palette={palette} reflections={quality === "high" && cameraMode === "room" && selectedZone === "service-core"} lightsOn={houseLightsOn} />
          </RoomDetail>
          <RoomDetail center={[-1.5, 0.8, 4.7]} visible={(cameraMode !== "room" || selectedZone === "ensuite")}>
            <EnsuiteBathroom base={zoneById.ensuite.level} palette={palette} reflections={quality === "high" && cameraMode === "room" && selectedZone === "ensuite"} lightsOn={houseLightsOn} />
          </RoomDetail>
        </ShadowRefreshProvider></SceneQualityProvider>
      )}

      {!designMode && <gridHelper args={[28, 28, "#b8b1a5", "#d6d0c5"]} position={[0, -0.03, 0]} />}
      {cameraMode === "plan" && <PlanCamera />}
      <LightingPlanMarkers visible={cameraMode === "plan"} lightsOn={houseLightsOn} nightFactor={sun.practical} />
      <CameraAzimuthTracker onCameraAzimuth={onCameraAzimuth} controlsRef={controlsRef} walking={cameraMode === "walk"} />
      {cameraMode === "walk" ? <FirstPersonController input={walkInput} active={active} zone={selectedZone} revision={cameraRevision} allDoorsOpen={allDoorsOpen} doorStates={doorStates} /> : <>
      <CameraDirector
        zone={zoneById[selectedZone]}
        mode={cameraMode}
        gardenView={gardenView}
        controlsRef={controlsRef}
        revision={cameraRevision}
        kitchenView={kitchenView}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={ORBIT_TARGET}
        minDistance={cameraMode === "garden" ? 1.5 : cameraMode === "room" ? 0.65 : 3}
        maxDistance={kitchenRoom ? 7 : cameraMode === "room" ? roomCameraLimits.maxDistance : quality === "light" ? 20 : 28}
        minAzimuthAngle={cameraMode === "room" && !kitchenRoom ? roomCameraLimits.minAzimuth : -Infinity}
        maxAzimuthAngle={cameraMode === "room" && !kitchenRoom ? roomCameraLimits.maxAzimuth : Infinity}
        minPolarAngle={cameraMode === "plan" ? 0 : 0.24}
        maxPolarAngle={cameraMode === "plan" ? 0.001 : cameraMode === "garden" || kitchenRoom ? Math.PI / 2 - 0.03 : Math.PI / 2.3}
        enableDamping
        dampingFactor={quality === "light" ? 0.08 : 0.06}
        rotateSpeed={quality === "light" ? 0.7 : 1}
        zoomSpeed={quality === "light" ? 0.85 : 1}
        panSpeed={quality === "light" ? 0.7 : 1}
        enablePan={quality === "high" && (cameraMode !== "room" || kitchenRoom)}
      />
      <KeyboardOrbitBridge controlsRef={controlsRef} />
      </>}
      <SceneFirstFrame onReady={onReady} enabled={!designMode || cameraMode !== "garden" || landscapeReady === quality} />
    </>
  );
}

export function MeasuredHouseScene(props: Props) {
  const { designMode, quality, onUnavailable } = props;
  const profile = lightingProfiles[quality];
  const walkInput = useRef<WalkInput>(createWalkInput());

  const [ready, setReady] = useState(false);
  const [landscapeReady, setLandscapeReady] = useState<"high" | "light" | null>(null);
  const handleReady = useCallback(() => setReady(true), []);
  const handlePending = useCallback(() => setReady(false), []);
  const presentable = ready && (!designMode || props.cameraMode !== "garden" || landscapeReady === quality);

  return (
    <>
    <Canvas
      frameloop={props.active ? "demand" : "never"}
      dpr={profile.dpr}
      shadows={quality === "high" ? "soft" : false}
      // The initial camera matches CameraDirector's composed dollhouse view so
      // there is no low-angle flash while controls mount.
      camera={{ position: [-13.8, 16.4, -10.4], fov: 36, near: 0.1, far: 200 }}
      // ContactShadows renders against a temporarily empty background. An
      // opaque clear alpha fills that offscreen map with a grey rectangle.
      // The scene's explicit background keeps the visible canvas opaque.
      gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
      performance={{ min: quality === "high" ? 0.7 : 0.5 }}
      onCreated={({ gl }) => {
        // AgX preserves highlight detail in the sunlit limestone and timber,
        // giving the presentation the soft rolloff of a modern path-traced
        // architectural still instead of the clipped game-render look.
        gl.toneMapping = THREE.AgXToneMapping;
        gl.toneMappingExposure = designMode ? 1.08 : 1;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.getContext().enable(gl.getContext().DITHER);
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
      <Suspense fallback={<ScenePending onPending={handlePending} />}>
        <SceneContent {...props} walkInput={walkInput} onReady={handleReady} landscapeReady={landscapeReady} onLandscapeReady={setLandscapeReady} />
      </Suspense>
      <RenderBudget quality={quality} active={props.active} />
      <GardenDiagnostics />
    </Canvas>
    {props.cameraMode === "walk" && props.active && presentable && <WalkControls input={walkInput} onReset={() => { walkInput.current.reset?.(); }} />}
    <SceneLoading ready={presentable} onShowPlan={props.onShowPlan} onRevealChange={props.onRevealChange} />
    </>
  );
}
