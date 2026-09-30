"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

/** Opt-in local QA. No frame loop or global debug surface in normal browsing. */
export function GardenDiagnostics() {
  const state = useThree();
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !new URLSearchParams(location.search).has("gardenQA")) return;
    const api = {
      openings: () => {
        state.scene.updateMatrixWorld(true);
        const walls: THREE.Object3D[] = [];
        state.scene.traverse((node) => { if (node.userData.wallRun) walls.push(node); });
        const report: object[] = [];
        state.scene.traverse((node) => {
          const opening = node.userData.opening;
          if (!opening) return;
          const inverse = node.matrixWorld.clone().invert();
          const bounds = new THREE.Box3();
          node.traverse((frame) => {
            if (!frame.userData.fittedFrame) return;
            frame.traverse((part) => {
              if (!(part instanceof THREE.Mesh)) return;
              part.geometry.computeBoundingBox();
              bounds.union(part.geometry.boundingBox!.clone().applyMatrix4(inverse.clone().multiply(part.matrixWorld)));
            });
          });
          const thickness = node.userData.wallThickness;
          // Probe just outside the fitted frame against actual wall meshes.
          // This catches oversized punches even if a casing hides the gap.
          const probes = [
            [-opening.width / 2 - 0.001, (opening.sill + opening.head) / 2],
            [opening.width / 2 + 0.001, (opening.sill + opening.head) / 2],
            [0, opening.head + 0.001],
          ];
          const wallContact = probes.map(([x, y]) => {
            const origin = new THREE.Vector3(x, y, thickness / 2 + 0.01).applyMatrix4(node.matrixWorld);
            const direction = new THREE.Vector3(0, 0, -1).transformDirection(node.matrixWorld);
            return new THREE.Raycaster(origin, direction, 0, thickness + 0.02).intersectObjects(walls, true).length > 0;
          });
          report.push({ name: node.name, kind: node.userData.kind, opening, thickness, frame: { min: bounds.min.toArray(), max: bounds.max.toArray() }, wallContact });
        });
        return report;
      },
      glazedDoors: () => {
        state.scene.updateMatrixWorld(true);
        const report: object[] = [];
        state.scene.traverse((node) => {
          const leaf = node.userData.glazedDoorLeaf;
          if (!leaf) return;
          const x = leaf.width * 0.28; // clear of the central muntin
          const origin = new THREE.Vector3(x, leaf.glassY, 0.05).applyMatrix4(node.matrixWorld);
          const direction = new THREE.Vector3(0, 0, -1).transformDirection(node.matrixWorld);
          const hits = new THREE.Raycaster(origin, direction, 0, 0.1).intersectObjects(node.children, true);
          report.push({ name: node.parent?.parent?.name, hits: hits.map((hit) => hit.object.name).filter(Boolean) });
        });
        return report;
      },
      interiors: () => {
        const report: object[] = [];
        state.scene.traverseVisible((node) => {
          if (!node.userData.interiorAsset) return;
          let owner = node.parent;
          while (owner && !owner.userData.furnitureId) owner = owner.parent;
          const box = new THREE.Box3().setFromObject(node);
          report.push({ name: node.name, asset: node.userData.interiorAsset, owner: owner?.userData.furnitureId, loaded: !box.isEmpty(), bounds: { min: box.min.toArray(), max: box.max.toArray() } });
        });
        return report;
      },
      surfaces: () => {
        const materials = new Set<THREE.MeshStandardMaterial>();
        state.scene.traverseVisible((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
            if (material instanceof THREE.MeshStandardMaterial && material.userData.moodSurface) materials.add(material);
          }
        });
        return [...materials].map((material) => ({
          surface: material.userData.moodSurface,
          image: material.userData.moodImage,
          sourceUrl: material.map?.image?.currentSrc || material.map?.image?.src,
          loaded: Boolean(material.map?.image?.width),
          colorSpace: material.map?.colorSpace,
          shader: material.customProgramCacheKey(),
        }));
      },
      snapshot: () => ({
        renderer: state.gl.getContext().getParameter(state.gl.getContext().RENDERER),
        cameraType: state.get().camera.type,
        calls: state.gl.info.render.calls, triangles: state.gl.info.render.triangles,
        geometries: state.gl.info.memory.geometries, textures: state.gl.info.memory.textures,
        dpr: state.gl.getPixelRatio(), size: state.size,
        drawingBuffer: state.gl.getDrawingBufferSize(new THREE.Vector2()).toArray(),
        frames: state.gl.info.render.frame,
        contactShadowRevision: state.scene.getObjectByName("scene-contact-shadows")?.userData.geometryRevision ?? 0,
        lod: (() => {
          const counts: Record<string, number> = {};
          state.scene.traverseVisible((object) => {
            if (object instanceof THREE.InstancedMesh && object.userData.detail) {
              const detail = object.userData.detail;
              counts[detail] = (counts[detail] ?? 0) + object.count;
            }
          });
          return counts;
        })(),
        clearAlpha: state.gl.getClearAlpha(),
        camera: state.get().camera.position.toArray(),
        target: (state.get().controls as unknown as { target?: THREE.Vector3 } | null)?.target?.toArray() ?? null,
        direction: state.get().camera.getWorldDirection(new THREE.Vector3()).toArray(),
        assets: performance.getEntriesByType("resource").filter((r) => /\.(glb|gltf|bin|ktx2)/.test(r.name)).map((r) => ({url:r.name, bytes:(r as PerformanceResourceTiming).encodedBodySize,duration:r.duration})),
      }),
      plants: () => {
        const report: object[] = [];
        state.scene.traverse((object) => {
          if (object.userData.acceptedIds) report.push({ species: object.userData.landscapeSpecies, accepted: object.userData.acceptedIds, rejected: object.userData.rejectedIds });
          if (object instanceof THREE.InstancedMesh && object.userData.landscapeSpecies) {
            const material = object.material as THREE.MeshStandardMaterial;
            report.push({ species: object.userData.landscapeSpecies, material: material.name, instances: object.count, metalness: material.metalness, vertexColors: material.vertexColors, texture: material.map ? { width: material.map.image?.width, height: material.map.image?.height, channel: material.map.channel, colorSpace: material.map.colorSpace } : null, attributes: Object.keys(object.geometry.attributes) });
          }
        });
        return report;
      },
      camera: (position: number[], target: number[]) => {
        const controls = state.get().controls as unknown as { target: THREE.Vector3; update: () => void; enableDamping: boolean; minPolarAngle: number; maxPolarAngle: number } | null;
        const camera = state.get().camera;
        if (controls) { controls.enableDamping = false; controls.update(); controls.target.fromArray(target); }
        camera.position.fromArray(position);
        camera.lookAt(new THREE.Vector3().fromArray(target));
        if (camera instanceof THREE.PerspectiveCamera) { camera.fov = 50; camera.updateProjectionMatrix(); }
        if (controls) controls.update();
        state.invalidate();
      },
      pickTarget: () => {
        const ray = new THREE.Raycaster();
        const candidates: THREE.Vector3[] = [];
        state.scene.traverse((object) => {
          if (!(object instanceof THREE.InstancedMesh) || !object.userData.landscapeSpecies) return;
          const geometry = object.geometry;
          geometry.computeBoundingBox();
          const center = geometry.boundingBox!.getCenter(new THREE.Vector3());
          for (let i = 0; i < Math.min(object.count, 24); i++) {
            const matrix = new THREE.Matrix4(); object.getMatrixAt(i, matrix);
            const point = center.clone().applyMatrix4(matrix).applyMatrix4(object.matrixWorld).project(state.get().camera);
            if (Math.abs(point.x) < .85 && Math.abs(point.y) < .65 && point.z < 1) candidates.push(point);
          }
        });
        for (const point of candidates) {
          ray.setFromCamera(new THREE.Vector2(point.x, point.y), state.get().camera);
          const hit = ray.intersectObjects(state.scene.children, true)[0];
          if (hit && hit.object.userData.landscapeSpecies && hit.instanceId !== undefined) return {
            x: (point.x + 1) * state.size.width / 2 + state.size.left,
            y: (1 - point.y) * state.size.height / 2 + state.size.top,
            species: hit.object.userData.landscapeSpecies,
            id: hit.object.userData.plantIds[hit.instanceId],
          };
        }
        return null;
      },
      renderSample: (count = 90) => {
        const samples: number[] = [];
        for (let i = 0; i < count; i++) {
          const start = performance.now();
          state.gl.render(state.scene, state.get().camera);
          state.gl.getContext().finish();
          samples.push(performance.now() - start);
        }
        samples.sort((a,b) => a-b);
        return { frames: count, medianMs: samples[Math.floor(count*.5)], p95Ms: samples[Math.floor(count*.95)], method: "Synchronous renderer + GPU finish; excludes UI and requestAnimationFrame cadence" };
      },
    };
    Object.assign(window, { __gardenQA: api });
    return () => { Reflect.deleteProperty(window, "__gardenQA"); };
  }, [state]);
  return null;
}
