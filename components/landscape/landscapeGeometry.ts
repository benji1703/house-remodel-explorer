import * as THREE from "three";
import { isLandscapeBoundsClear, type LandscapeBounds, type LandscapePlant } from "@/data/landscape";

export type AssetPart = { geometry: THREE.BufferGeometry; matrix: THREE.Matrix4 };
/** Conservative bounds for every exported triangle in 25cm vertical slabs.
 * Vertices are transformed by the actual GLB node matrix first. Assigning every
 * crossed slab the whole triangle bounds also covers leaves crossing a slab edge.
 * This catches canopy/rock intersections that a species-radius filter misses.
 */
export function assetHeightBounds(parts: readonly AssetPart[]): LandscapeBounds[] {
  const slabs = new Map<number, THREE.Box3>();
  const vertices = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  for (const { geometry, matrix } of parts) {
    const positions = geometry.getAttribute("position");
    const count = geometry.index?.count ?? positions.count;
    for (let i = 0; i < count; i += 3) {
      for (let j = 0; j < 3; j++) vertices[j].fromBufferAttribute(positions, geometry.index?.getX(i + j) ?? i + j).applyMatrix4(matrix).multiplyScalar(100);
      const low = Math.floor(Math.min(...vertices.map((v) => v.y)) / 25);
      const high = Math.floor(Math.max(...vertices.map((v) => v.y)) / 25);
      for (let h = low; h <= high; h++) {
        const box = slabs.get(h) ?? new THREE.Box3();
        vertices.forEach((v) => box.expandByPoint(v));
        slabs.set(h, box);
      }
    }
  }
  return [...slabs.values()].map((box) => ({ minCm: box.min.toArray() as [number, number, number], maxCm: box.max.toArray() as [number, number, number] }));
}

export function transformLandscapeBounds(bounds: LandscapeBounds, positionCm: readonly [number, number, number], scale: readonly [number, number, number], rotation: number): LandscapeBounds {
  const matrix = new THREE.Matrix4().compose(new THREE.Vector3(...positionCm), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation), new THREE.Vector3(...scale));
  const box = new THREE.Box3(new THREE.Vector3(...bounds.minCm), new THREE.Vector3(...bounds.maxCm)).applyMatrix4(matrix);
  return { minCm: box.min.toArray() as [number, number, number], maxCm: box.max.toArray() as [number, number, number] };
}
export function plantAssetIsClear(plant: LandscapePlant, bands: readonly LandscapeBounds[]) {
  return bands.every((band) => isLandscapeBoundsClear(transformLandscapeBounds(band, plant.positionCm, [plant.scale, plant.scale, plant.scale], plant.rotation), plant.species === "bougainvillea-glabra"));
}
