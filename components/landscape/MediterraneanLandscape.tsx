"use client";

import { Html, useGLTF, useKTX2 } from "@react-three/drei";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { landscapePlants, landscapeSpecies, landscapeGround, landscapeRandom, landscapeRocks, isLandscapeBoundsClear, type LandscapePlant, type LandscapeSpeciesId } from "@/data/landscape";
import { CX, CZ, SoftBox, type Palette } from "../rooms/shared";
import { createGravelMaterial, createLimestoneMaterial } from "@/lib/landscapeMaterials";
import { assetHeightBounds, plantAssetIsClear, transformLandscapeBounds } from "./landscapeGeometry";

type Quality = "high" | "light";
const speciesIds = Object.keys(landscapeSpecies) as LandscapeSpeciesId[];
/** One instanced draw per species/material, with stable placement IDs for picking.
 * Blender geometry and decoded buffers are shared by every specimen of a species.
 */
function PlantBatch({ species, plants, quality, onSelect }: {
  species: LandscapeSpeciesId; plants: LandscapePlant[]; quality: Quality; onSelect: (plant: LandscapePlant) => void;
}) {
  const { scene } = useGLTF(`/models/landscape/${species}${quality === "light" ? "-light" : ""}.glb?v=leaf-v2`);
  const suffix = quality === "light" ? "-light" : "";
  const barkMaps = useKTX2(["color", "normal", "roughness"].map((map) => `/textures/landscape/bark-${map}${suffix}.ktx2`), "/decoders/basis/");
  const barkTextures = useMemo(() => barkMaps.map((source) => {
    const texture = source.clone();
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  }), [barkMaps]);
  useEffect(() => () => barkTextures.forEach((texture) => texture.dispose()), [barkTextures]);
  const parts = useMemo(() => {
    const result: { geometry: THREE.BufferGeometry; material: THREE.MeshStandardMaterial; matrix: THREE.Matrix4 }[] = [];
    scene.updateMatrixWorld(true);
    scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const material = (node.material as THREE.MeshStandardMaterial).clone();
      const foliage = /Leaf|foliage|Flower/i.test(material.name);
      material.side = foliage ? THREE.DoubleSide : THREE.FrontSide;
      // Defensive safeguard for fallback GLBs: glTF defaults omitted metallic
      // factors to 1, which makes foliage read like dark metal.
      material.metalness = 0;
      material.roughness = foliage ? species === "myrtus-communis" ? 0.66 : species === "salvia-fruticosa" ? 0.9 : 0.8 : 0.92;
      material.envMapIntensity = foliage ? 0.4 : 0.55;
      if (species === "olea-europaea" && material.name.includes("Bark")) {
        material.map = barkTextures[0];
        material.normalMap = barkTextures[1];
        material.roughnessMap = barkTextures[2];
        material.normalScale.set(0.65, 0.65);
        // Bark scan supplies pigment; vertex variation remains on foliage.
        material.vertexColors = false;
      }
      result.push({ geometry: node.geometry, material, matrix: node.matrixWorld.clone() });
    });
    return result;
  }, [scene, barkTextures, species]);
  useEffect(() => () => parts.forEach((p) => p.material.dispose()), [parts]);
  const checked = useMemo(() => {
    const bands = assetHeightBounds(parts);
    return { accepted: plants.filter((p) => plantAssetIsClear(p, bands)), rejected: plants.filter((p) => !plantAssetIsClear(p, bands)).map((p) => p.id), bands };
  }, [parts, plants]);
  return <group name={`Landscape ${species}`} userData={{ landscapeSpecies: species, acceptedIds: checked.accepted.map((p) => p.id), rejectedIds: checked.rejected, assetHeightBoundsCm: checked.bands }}>
    {parts.map((part, index) => checked.accepted.length > 0 && <Specimens key={index} {...part} species={species} plants={checked.accepted} quality={quality} onSelect={onSelect} />)}
  </group>;
}

function Specimens({ geometry, material, matrix, plants, quality, onSelect, species }: {
  species: LandscapeSpeciesId;
  geometry: THREE.BufferGeometry; material: THREE.Material; matrix: THREE.Matrix4;
  plants: LandscapePlant[]; quality: Quality; onSelect: (plant: LandscapePlant) => void;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const transform = new THREE.Object3D();
    plants.forEach((plant, index) => {
      const [x, y, z] = plant.positionCm;
      transform.position.set(x / 100 - CX, y / 100, z / 100 - CZ);
      transform.rotation.set(0, plant.rotation, 0);
      transform.scale.setScalar(plant.scale);
      transform.updateMatrix();
      ref.current!.setMatrixAt(index, transform.matrix.clone().multiply(matrix));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [plants, matrix]);
  return <instancedMesh ref={ref} args={[geometry, material, plants.length]} dispose={null}
    castShadow={quality === "high"} receiveShadow userData={{ landscapeSpecies: species, plantIds: plants.map((p) => p.id) }}
    onClick={(event) => {
      if (event.instanceId === undefined || event.delta > 5) return;
      event.stopPropagation();
      onSelect(plants[event.instanceId]);
    }} />;
}

function Gravel({ quality }: { quality: Quality }) {
  const suffix = quality === "light" ? "-light" : "";
  const sources = useKTX2(["color", "normal", "roughness"].map((map) => `/textures/landscape/gravel-${map}${suffix}.ktx2`), "/decoders/basis/");
  const maps = useMemo(() => sources.map((source, i) => {
    const map = source.clone();
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(landscapeGround.sizeCm[0] / landscapeGround.textureTileCm, landscapeGround.sizeCm[1] / landscapeGround.textureTileCm);
    map.anisotropy = quality === "high" ? 8 : 2;
    map.colorSpace = i === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    map.needsUpdate = true;
    return map;
  }), [sources, quality]);
  const material = useMemo(() => createGravelMaterial(maps), [maps]);
  useEffect(() => () => { maps.forEach((map) => map.dispose()); material.dispose(); }, [maps, material]);
  return <mesh name="Proposed continuous limestone gravel" position={[landscapeGround.centerCm[0] / 100 - CX, landscapeGround.centerCm[1] / 100, landscapeGround.centerCm[2] / 100 - CZ]} rotation-x={-Math.PI / 2} receiveShadow material={material}>
    <planeGeometry args={[landscapeGround.sizeCm[0] / 100, landscapeGround.sizeCm[1] / 100]} />
  </mesh>;
}

/** Quiet mineral/organic transitions under stems. Alpha vanishes through an
 * irregular feathered edge; there is no geometric border or elevated bed. */
function PlantingBeds() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const plants = useMemo(() => landscapePlants.filter((p) => p.species !== "bougainvillea-glabra"), []);
  const material = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ color: "#5e5746", transparent: true, opacity: 0.22, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vSoilUV;").replace("#include <uv_vertex>", "#include <uv_vertex>\nvSoilUV = uv;");
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec2 vSoilUV;").replace("#include <alphamap_fragment>", `#include <alphamap_fragment>
        vec2 soilPoint = vSoilUV * 2.0 - 1.0;
        float angle = atan(soilPoint.y, soilPoint.x);
        float brokenEdge = 0.80 + 0.10 * sin(angle * 5.0) + 0.08 * cos(angle * 9.0 + 0.8);
        diffuseColor.a *= 1.0 - smoothstep(0.08, brokenEdge, length(soilPoint));`);
    };
    m.customProgramCacheKey = () => "mineral-soil-feather-v1";
    return m;
  }, []);
  useEffect(() => () => material.dispose(), [material]);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const object = new THREE.Object3D();
    plants.forEach((p, i) => {
      const diameterCm = Math.min(landscapeSpecies[p.species].spreadCm * 0.64, 120) * p.scale;
      object.position.set(p.positionCm[0] / 100 - CX, -0.034, p.positionCm[2] / 100 - CZ);
      object.rotation.set(-Math.PI / 2, 0, p.rotation);
      object.scale.set(diameterCm / 100, diameterCm / 100, 1);
      object.updateMatrix(); ref.current!.setMatrixAt(i, object.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true; ref.current.computeBoundingSphere();
  }, [plants]);
  return <instancedMesh name="Feathered mineral underplanting" ref={ref} args={[undefined, material, plants.length]}><planeGeometry args={[1, 1]} /></instancedMesh>;
}

function Limestone({ quality }: { quality: Quality }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => {
    // Shared irregular fallback while the Blender rock is integrated. No sphere
    // silhouette: mineral bedding shears the broad, flattened chipped shape.
    const g = new THREE.IcosahedronGeometry(1, quality === "high" ? 3 : 2);
    const position = g.getAttribute("position");
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
      const eroded = 1 + 0.09 * Math.sin(x * 11 + z * 4) * Math.cos(y * 13) + 0.045 * Math.sin(z * 29 + x * 15);
      position.setXYZ(i, (x * 0.50 + y * 0.075) * eroded, (y * 0.31 + 0.04 * Math.sin(x * 9 + z * 6)) * eroded, z * 0.36 * eroded);
    }
    g.computeVertexNormals(); g.computeBoundingBox();
    return g;
  }, [quality]);
  const material = useMemo(() => createLimestoneMaterial(), []);
  const checked = useMemo(() => {
    const box = geometry.boundingBox!;
    const bounds = { minCm: box.min.clone().multiplyScalar(100).toArray() as [number, number, number], maxCm: box.max.clone().multiplyScalar(100).toArray() as [number, number, number] };
    return landscapeRocks.filter((rock) => isLandscapeBoundsClear(transformLandscapeBounds(bounds, rock.positionCm, rock.scale, rock.rotation)));
  }, [geometry]);
  useEffect(() => () => { geometry.dispose(); }, [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const object = new THREE.Object3D();
    checked.forEach((rock, i) => {
      object.position.set(rock.positionCm[0] / 100 - CX, rock.positionCm[1] / 100, rock.positionCm[2] / 100 - CZ);
      object.rotation.set(0, rock.rotation, 0);
      object.scale.set(...rock.scale); object.updateMatrix();
      ref.current!.setMatrixAt(i, object.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true; ref.current.computeBoundingSphere();
  }, [checked]);
  return <instancedMesh name="Embedded proposed limestone" ref={ref} args={[geometry, material, checked.length]} castShadow={quality === "high"} receiveShadow userData={{ rockIds: checked.map((r) => r.id), rejectedIds: landscapeRocks.filter((r) => !checked.includes(r)).map((r) => r.id) }} />;
}

function GravelGrain({ quality }: { quality: Quality }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = landscapeGround.pebbleCount[quality];
  const material = useMemo(() => createLimestoneMaterial(), []);
  useEffect(() => () => material.dispose(), [material]);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const object = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // Seeded gravel grain, 0.8–2.2cm radius. Entire footprint is outside
      // architecture; these flat grains are the walkable mineral surface.
      const x = -790 + landscapeRandom(i * 5) * 760;
      const z = 80 + landscapeRandom(i * 5 + 1) * 740;
      const radiusCm = 0.8 + landscapeRandom(i * 5 + 2) * 1.4;
      object.position.set(x / 100 - CX, -0.036, z / 100 - CZ);
      object.rotation.set(landscapeRandom(i + 19), i * 2.399, landscapeRandom(i + 43));
      object.scale.set(radiusCm / 100, radiusCm * 0.45 / 100, radiusCm * 0.7 / 100);
      object.updateMatrix(); ref.current.setMatrixAt(i, object.matrix);
      color.setHSL(0.11, 0.09 + landscapeRandom(i + 3) * 0.06, 0.58 + landscapeRandom(i + 7) * 0.24);
      ref.current.setColorAt(i, color);
    }
    ref.current.instanceMatrix.needsUpdate = true; ref.current.computeBoundingSphere();
  }, [count]);
  return <instancedMesh ref={ref} name="Limestone surface grain" args={[undefined, material, count]} receiveShadow><icosahedronGeometry args={[1, 0]} /></instancedMesh>;
}

function LandscapeCommitted({ quality, onReady }: { quality: Quality; onReady: (quality: Quality) => void }) {
  useEffect(() => { onReady(quality); }, [onReady, quality]);
  return null;
}

export function MediterraneanLandscape({ palette, quality, onReady }: { palette: Palette; quality: Quality; onReady: (quality: Quality) => void }) {
  const [selected, setSelected] = useState<LandscapePlant | null>(null);
  const batches = useMemo(() => speciesIds.map((species) => ({ species, plants: landscapePlants.filter((p) => p.species === species) })), []);
  const info = selected ? landscapeSpecies[selected.species] : null;
  return <group name="Proposed Mediterranean garden">
    <Suspense fallback={null}>
      <Gravel quality={quality} />
      <PlantingBeds />
      <Limestone quality={quality} />
      <GravelGrain quality={quality} />
      {batches.map(({ species, plants }) => plants.length > 0 && <PlantBatch key={`${species}-${quality}`} species={species} plants={plants} quality={quality} onSelect={setSelected} />)}
      <LandscapeCommitted quality={quality} onReady={onReady} />
    </Suspense>
    {Array.from({ length: 6 }, (_, index) => <SoftBox key={index} x={8.25 + index * 0.82} z={3.18} y={-0.035} w={0.64} d={0.88} h={0.055} radius={0.025} material={palette.stone} />)}
    {selected && info && <Html position={[selected.positionCm[0] / 100 - CX, Math.min(info.heightCm * selected.scale / 100, 1.8), selected.positionCm[2] / 100 - CZ]} center zIndexRange={[30, 20]}>
      <div className="garden-plant-label" role="status" onPointerDown={(event) => event.stopPropagation()}>
        <button type="button" aria-label="Close plant details" onClick={() => setSelected(null)}>×</button>
        <small>Proposed planting</small><strong>{info.name}</strong><em>{info.botanical}</em>
        <p>{info.role}</p>
        <a href={`/?view=plants&camera=garden&zone=central-core#plant-${info.reference}`}>Planting palette ↗</a>
      </div>
    </Html>}
  </group>;
}
