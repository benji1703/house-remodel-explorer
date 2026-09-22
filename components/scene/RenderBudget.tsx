"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/** Spend pixels on the settled image; cache sun shadows until a caster changes.
 * Transmission is intentionally disabled by the presentation profile: even a
 * tiny wine bottle otherwise renders the entire house into another framebuffer.
 */
export function RenderBudget({ quality }: { quality: "high" | "light" }) {
  const { get, size, setDpr, invalidate, setFrameloop } = useThree();
  const previousCamera = useMemo(() => new THREE.Matrix4(), []);
  const previousProjection = useMemo(() => new THREE.Matrix4(), []);
  const casters = useMemo(() => new WeakMap<THREE.Object3D, { matrix: THREE.Matrix4; visible: boolean }>(), []);
  const prepared = useMemo(() => new WeakSet<THREE.Material>(), []);
  const moving = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const casterCount = useRef(-1);
  const idleDpr = Math.min(window.devicePixelRatio || 1, quality === "high" ? 2 : 1.5,
    Math.sqrt((quality === "high" ? 4_000_000 : 1_600_000) / Math.max(1, size.width * size.height)));

  useEffect(() => {
    const gl = get().gl;
    moving.current = false;
    setDpr(idleDpr);
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    const visibility = () => {
      setFrameloop(document.hidden ? "never" : "demand");
      if (!document.hidden) invalidate();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      gl.shadowMap.autoUpdate = true;
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [get, idleDpr, setDpr, setFrameloop, invalidate]);

  useFrame(({ camera, gl, scene }) => {
    camera.updateMatrixWorld();
    if (!previousCamera.equals(camera.matrixWorld) || !previousProjection.equals(camera.projectionMatrix)) {
      previousCamera.copy(camera.matrixWorld);
      previousProjection.copy(camera.projectionMatrix);
      if (!moving.current) {
        moving.current = true;
        setDpr(Math.min(idleDpr, quality === "high" ? 1.25 : 1));
      }
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        moving.current = false;
        setDpr(idleDpr);
        invalidate();
      }, 240);
    }
    scene.updateMatrixWorld();
    let count = 0;
    const visit = (object: THREE.Object3D, parentVisible: boolean) => {
      const visible = parentVisible && object.visible;
      if (object instanceof THREE.Mesh) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (prepared.has(material)) continue;
          prepared.add(material);
          if (material instanceof THREE.MeshPhysicalMaterial && material.transmission > 0) {
            material.transmission = 0;
            material.needsUpdate = true;
          }
        }
      }
      if (object.castShadow || object instanceof THREE.Light) {
        count++;
        const previous = casters.get(object);
        if (!previous || previous.visible !== visible || !previous.matrix.equals(object.matrixWorld)) {
          gl.shadowMap.needsUpdate = true;
          if (previous) { previous.matrix.copy(object.matrixWorld); previous.visible = visible; }
          else casters.set(object, { matrix: object.matrixWorld.clone(), visible });
        }
      }
      for (const child of object.children) visit(child, visible);
    };
    visit(scene, true);
    if (count !== casterCount.current) gl.shadowMap.needsUpdate = true;
    casterCount.current = count;
  });
  return null;
}
