"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { Suspense, createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";

const DetailContext = createContext(false);
export const useSceneDetail = () => useContext(DetailContext);

/** Screen-space detail with separate entry/exit thresholds prevents zoom flicker.
 * CSS pixels, not device pixels: a Retina display must not load a bigger scene.
 */
export function useProjectedDetail(center: readonly number[], diameter: number, threshold = 340, enabled = true) {
  const { camera, size } = useThree();
  const point = useMemo(() => new THREE.Vector3(...center), [center]);
  const [detail, setDetail] = useState(false);
  const current = useRef(false);
  const frustum = useMemo(() => new THREE.Frustum(), []);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const sphere = useMemo(() => new THREE.Sphere(point, diameter / 2), [point, diameter]);
  useFrame(() => {
    camera.updateMatrixWorld();
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);
    const distance = Math.max(camera.position.distanceTo(point), 0.1);
    const pixels = camera instanceof THREE.PerspectiveCamera
      ? diameter * size.height / (2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
      : camera instanceof THREE.OrthographicCamera ? diameter * size.height * camera.zoom / (camera.top - camera.bottom) : 0;
    const next = enabled && frustum.intersectsSphere(sphere) && pixels > threshold * (current.current ? 0.78 : 1);
    if (next !== current.current) {
      current.current = next;
      setDetail(next);
    }
  });
  return detail;
}

export function RoomDetail({ center, visible, children }: { center: readonly number[]; visible: boolean; children: ReactNode }) {
  const detail = useProjectedDetail(center, 3.5, 340, visible);
  // Unvisited/hidden rooms do not retain cloned materials or frame subscribers.
  return visible ? <DetailContext.Provider value={detail}><group userData={{ roomDetail: detail }}><Suspense fallback={null}>{children}</Suspense></group></DetailContext.Provider> : null;
}
