"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { lightingProfiles, mobileHighLightingProfile } from "@/data/lighting";
import * as THREE from "three";

/** Spend pixels on the settled image; cache sun shadows until a caster changes.
 * Transmission is intentionally disabled by the presentation profile: even a
 * tiny wine bottle otherwise renders the entire house into another framebuffer.
 */
export function RenderBudget({ quality, active }: { quality: "high" | "light"; active: boolean }) {
  const { get, size, setDpr, invalidate, setFrameloop } = useThree();
  const previousCamera = useMemo(() => new THREE.Matrix4(), []);
  const previousProjection = useMemo(() => new THREE.Matrix4(), []);
  const casters = useMemo(() => new WeakMap<THREE.Object3D, { matrix: THREE.Matrix4; visible: boolean; shadow: boolean; projection?: THREE.Matrix4 }>(), []);
  const prepared = useMemo(() => new WeakSet<THREE.Material>(), []);
  const shadowEligible = useMemo(() => new WeakSet<THREE.SpotLight>(), []);
  const lightPosition = useMemo(() => new THREE.Vector3(), []);
  const moving = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const casterCount = useRef(-1);
  const compactDevice = window.matchMedia("(max-width: 800px)").matches
    || window.matchMedia("(pointer: coarse)").matches;
  const profile = quality === "high" && compactDevice ? mobileHighLightingProfile : lightingProfiles[quality];
  const pixelBudget = quality === "light" && compactDevice ? 450_000 : profile.idlePixelBudget;
  const idleDpr = Math.min(window.devicePixelRatio || 1, profile.dpr[1],
    Math.sqrt(pixelBudget / Math.max(1, size.width * size.height)));

  useEffect(() => {
    const gl = get().gl;
    moving.current = false;
    setDpr(idleDpr);
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    const visibility = () => {
      setFrameloop(document.hidden || !active ? "never" : "demand");
      if (!document.hidden && active) invalidate();
    };
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      gl.shadowMap.autoUpdate = true;
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [active, get, idleDpr, setDpr, setFrameloop, invalidate]);

  useFrame(({ camera, gl, scene }) => {
    camera.updateMatrixWorld();
    if (!previousCamera.equals(camera.matrixWorld) || !previousProjection.equals(camera.projectionMatrix)) {
      previousCamera.copy(camera.matrixWorld);
      previousProjection.copy(camera.projectionMatrix);
      if (!moving.current) {
        moving.current = true;
        setDpr(Math.min(idleDpr, profile.movingDpr));
      }
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        moving.current = false;
        setDpr(idleDpr);
        invalidate();
      }, 240);
    }
    scene.updateMatrixWorld();
    // All rooms remain lit during a walkthrough, but each shadow consumes a
    // fragment texture sampler. Reserve space for PBR maps, sky and area-light
    // LUTs on 16-sampler GPUs; prioritize nearby, active practical fixtures.
    const lights: { light: THREE.SpotLight; distance: number }[] = [];
    scene.traverseVisible(object => {
      if (!(object instanceof THREE.SpotLight)) return;
      if (object.castShadow) shadowEligible.add(object);
      if (!shadowEligible.has(object)) return;
      lights.push({ light: object, distance: object.intensity > 0.001
        ? object.getWorldPosition(lightPosition).distanceToSquared(camera.position) : Infinity });
    });
    lights.sort((a, b) => a.distance - b.distance);
    const shadowLimit = Math.min(profile.maxLocalShadows, Math.max(0, gl.capabilities.maxTextures - 8));
    lights.forEach(({ light, distance }, index) => {
      const enabled = index < shadowLimit && Number.isFinite(distance);
      if (light.castShadow !== enabled) {
        light.castShadow = enabled;
        gl.shadowMap.needsUpdate = true;
      }
    });
    let count = 0;
    const prepare = (material: THREE.Material) => {
      if (prepared.has(material)) return;
      prepared.add(material);
      if (material instanceof THREE.MeshPhysicalMaterial && material.transmission > 0) {
        material.transmission = 0;
        material.needsUpdate = true;
      }
    };
    const visit = (object: THREE.Object3D, parentVisible: boolean) => {
      const visible = parentVisible && object.visible;
      if (object instanceof THREE.Mesh) {
        if (Array.isArray(object.material)) object.material.forEach(prepare);
        else prepare(object.material);
      }
      if (object.castShadow || object instanceof THREE.Light) {
        count++;
        const previous = casters.get(object);
        const projection = object instanceof THREE.DirectionalLight ? object.shadow.camera.projectionMatrix : undefined;
        if (!previous || previous.visible !== visible || previous.shadow !== object.castShadow || !previous.matrix.equals(object.matrixWorld) || (projection && !previous.projection?.equals(projection))) {
          gl.shadowMap.needsUpdate = true;
          if (previous) {
            previous.matrix.copy(object.matrixWorld);
            previous.visible = visible;
            previous.shadow = object.castShadow;
            if (projection) {
              if (previous.projection) previous.projection.copy(projection);
              else previous.projection = projection.clone();
            }
          } else {
            casters.set(object, { matrix: object.matrixWorld.clone(), visible, shadow: object.castShadow, projection: projection?.clone() });
          }
        }
      }
      for (const child of object.children) visit(child, visible);
    };
    visit(scene, true);
    if (count !== casterCount.current) gl.shadowMap.needsUpdate = true;
    casterCount.current = count;
  }, -0.5);
  return null;
}
