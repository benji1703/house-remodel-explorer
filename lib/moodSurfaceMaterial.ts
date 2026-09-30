import * as THREE from "three";
import { moodSurfaces, type MoodSurface, type MoodSurfaceId } from "@/data/moodSurfaces";

/** Keep the original image intact: sample only the documented material patch.
 * Mirrored UVs join the patch edges without sampling neighbouring furniture.
 * Dividing out a low-frequency image sample reduces photographed illumination;
 * scene lights still supply the shading. For mineral surfaces only, high-pass
 * photographic grain supplies estimated micro-relief and roughness variation.
 * These are appearance estimates, not scanned PBR or geometric displacement.
 */
export function applyMoodSurface<T extends THREE.MeshStandardMaterial>(
  material: T, map: THREE.Texture, id: MoodSurfaceId,
): T {
  const surface: MoodSurface = moodSurfaces[id];
  const mineral = surface.mineralFinish;
  const albedo = surface.albedo === true;
  material.map = map;
  material.color.set(surface.color);
  material.userData.moodSurface = id;
  material.userData.moodImage = surface.referenceImage ?? surface.image;
  material.userData.moodTexture = surface.image;
  if (mineral) {
    // Mineral channels now share world projection and scale, rather than mixing
    // a photo albedo with unrelated, stretched procedural UV maps.
    material.bumpMap = null;
    material.normalMap = null;
    material.roughnessMap = null;
    material.userData.moodReliefMm = mineral.reliefMm;
    material.userData.moodRoughness = mineral.roughness;
  }
  material.onBeforeCompile = (shader) => {
    const [x, y, w, h] = surface.crop;
    shader.uniforms.moodCrop = { value: new THREE.Vector4(x, 1 - y - h, w, h) };
    shader.uniforms.moodSize = { value: new THREE.Vector2(...surface.sampleCm).multiplyScalar(0.01) };
    shader.uniforms.moodDetail = { value: surface.detail };
    shader.uniforms.moodRelief = { value: (mineral?.reliefMm ?? 0) / 1000 };
    shader.uniforms.moodRoughness = { value: new THREE.Vector2(...(mineral?.roughness ?? [1, 1])) };
    shader.uniforms.moodLightLod = { value: mineral?.illuminationLod ?? 4 };
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
      varying vec3 vMoodPosition;
      varying vec3 vMoodNormal;
    `).replace("#include <begin_vertex>", `#include <begin_vertex>
      ${surface.space === "world" ? `
        vMoodPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        vMoodNormal = normalize(mat3(modelMatrix) * normal);
      ` : `
        vMoodPosition = position * vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));
        vMoodNormal = normal;
      `}
    `);
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
      varying vec3 vMoodPosition;
      varying vec3 vMoodNormal;
      uniform vec4 moodCrop;
      uniform vec2 moodSize;
      uniform float moodDetail;
      uniform float moodRelief;
      uniform vec2 moodRoughness;
      uniform float moodLightLod;
    `).replace("#include <map_fragment>", `
      #ifdef USE_MAP
        vec3 axis = abs(normalize(vMoodNormal));
        vec2 surfaceUv = axis.y > max(axis.x, axis.z) ? vMoodPosition.xz
          : axis.x > axis.z ? vMoodPosition.zy : vMoodPosition.xy;
        vec2 tileUv = 1.0 - abs(mod(surfaceUv / moodSize, 2.0) - 1.0);
        // Keep filtering within the photographed patch, away from skirting,
        // foliage and shadows. Repeat only the material, never the whole room.
        vec2 patchUv = moodCrop.xy + moodCrop.zw * mix(vec2(0.14), vec2(0.86), tileUv);
        vec2 footprint = max(abs(dFdx(patchUv)), abs(dFdy(patchUv))) * vec2(textureSize(map, 0));
        float moodLod = log2(max(max(footprint.x, footprint.y), 1.0));
        vec3 pigment = texture2D(map, patchUv).rgb;
        vec3 illumination = max(textureLod(map, patchUv, moodLightLod).rgb, vec3(0.025));
        vec3 moodRatio = ${albedo ? "pigment" : "clamp(pigment / illumination, 0.55, 1.65)"};
        float moodTone = dot(moodRatio, vec3(0.2126, 0.7152, 0.0722));
        float moodDetailFade = ${albedo ? "1.0" : "1.0 - smoothstep(3.0, 6.0, moodLod)"};
        diffuseColor.rgb *= mix(vec3(1.0), moodRatio, moodDetail * moodDetailFade);
        // A shorter high-pass separates fine plaster pores from photographed
        // colour clouds. Never use the image's broad shadows as surface relief.
        vec3 grainMean = max(textureLod(map, patchUv, min(moodLod + 2.0, moodLightLod)).rgb, vec3(0.025));
        float moodGrain = clamp(dot(pigment / grainMean - 1.0, vec3(0.2126, 0.7152, 0.0722)), -0.35, 0.35);
      #endif
    `);
    if (mineral) {
      shader.fragmentShader = shader.fragmentShader.replace("#include <roughnessmap_fragment>", `
        float roughnessFactor = mix(moodRoughness.x, moodRoughness.y,
          clamp(0.5 + (moodTone - 1.0) * 2.0 + moodGrain, 0.0, 1.0));
      `).replace("#include <normal_fragment_maps>", `
        #include <normal_fragment_maps>
        // Surface gradients in world metres keep relief constant at every
        // distance and across adjoining wall pieces / room floor slabs.
        float moodHeight = moodGrain * moodRelief * moodDetailFade;
        vec3 moodDx = dFdx(-vViewPosition);
        vec3 moodDy = dFdy(-vViewPosition);
        vec3 moodR1 = cross(moodDy, normal);
        vec3 moodR2 = cross(normal, moodDx);
        float moodDet = dot(moodDx, moodR1) * faceDirection;
        vec3 moodGradient = sign(moodDet) * (dFdx(moodHeight) * moodR1 + dFdy(moodHeight) * moodR2);
        normal = normalize(max(abs(moodDet), 1e-10) * normal - moodGradient);
      `);
    }
  };
  material.customProgramCacheKey = () => `mood-surface-v2-${id}`;
  material.needsUpdate = true;
  return material;
}

/** Three's Material.clone intentionally omits shader hooks. Preserve them for
 * cutaway walls, room floor instances and warmer kitchen joinery. */
export function cloneSurfaceMaterial<T extends THREE.Material>(source: T): T {
  const clone = source.clone();
  clone.onBeforeCompile = source.onBeforeCompile;
  clone.customProgramCacheKey = source.customProgramCacheKey;
  return clone;
}
