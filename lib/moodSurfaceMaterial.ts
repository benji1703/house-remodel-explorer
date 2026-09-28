import * as THREE from "three";
import { moodSurfaces, type MoodSurfaceId } from "@/data/moodSurfaces";

/** Keep the original image intact: sample only the documented material patch.
 * Mirrored UVs join the patch edges without sampling neighbouring furniture.
 * Dividing out a low-frequency image sample reduces photographed illumination;
 * scene lights still supply the shading. This is an approximate albedo treatment,
 * not a scanned PBR material: pigment is deliberately never used as displacement.
 */
export function applyMoodSurface<T extends THREE.MeshStandardMaterial>(
  material: T, map: THREE.Texture, id: MoodSurfaceId,
): T {
  const surface = moodSurfaces[id];
  material.map = map;
  material.color.set(surface.color);
  material.userData.moodSurface = id;
  material.userData.moodImage = surface.image;
  material.onBeforeCompile = (shader) => {
    const [x, y, w, h] = surface.crop;
    shader.uniforms.moodCrop = { value: new THREE.Vector4(x, 1 - y - h, w, h) };
    shader.uniforms.moodSize = { value: new THREE.Vector2(...surface.sampleCm).multiplyScalar(0.01) };
    shader.uniforms.moodDetail = { value: surface.detail };
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
    `).replace("#include <map_fragment>", `
      #ifdef USE_MAP
        vec3 axis = abs(normalize(vMoodNormal));
        vec2 surfaceUv = axis.y > max(axis.x, axis.z) ? vMoodPosition.xz
          : axis.x > axis.z ? vMoodPosition.zy : vMoodPosition.xy;
        vec2 tileUv = 1.0 - abs(mod(surfaceUv / moodSize, 2.0) - 1.0);
        // Inset prevents mip filtering from bleeding outside the selected patch.
        vec2 patchUv = moodCrop.xy + moodCrop.zw * mix(vec2(0.06), vec2(0.94), tileUv);
        vec3 pigment = texture2D(map, patchUv).rgb;
        vec2 footprint = max(abs(dFdx(patchUv)), abs(dFdy(patchUv))) * vec2(textureSize(map, 0));
        float illuminationLod = max(4.0, log2(max(max(footprint.x, footprint.y), 1.0)));
        vec3 illumination = max(textureLod(map, patchUv, illuminationLod).rgb, vec3(0.025));
        diffuseColor.rgb *= mix(vec3(1.0), clamp(pigment / illumination, 0.55, 1.65), moodDetail);
      #endif
    `);
  };
  material.customProgramCacheKey = () => `mood-surface-v1-${id}`;
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
