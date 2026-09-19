import * as THREE from "three";

/** Original deterministic material work. All distances below are render metres.
 * Source scans stay compressed KTX2/Basis; no duplicate generated bitmap maps.
 */
const mineralNoise = `
  float mineralHash(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float mineralNoise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(mineralHash(i), mineralHash(i + vec3(1,0,0)), f.x),
                   mix(mineralHash(i + vec3(0,1,0)), mineralHash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(mineralHash(i + vec3(0,0,1)), mineralHash(i + vec3(1,0,1)), f.x),
                   mix(mineralHash(i + vec3(0,1,1)), mineralHash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
`;

function worldPigment(material: THREE.MeshStandardMaterial, pigment: string, cacheKey: string) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vMineralPosition;");
    shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", `
      #include <project_vertex>
      vec4 mineralPosition = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        mineralPosition = instanceMatrix * mineralPosition;
      #endif
      vMineralPosition = (modelMatrix * mineralPosition).xyz;
    `);
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>\nvarying vec3 vMineralPosition;\n${mineralNoise}`);
    shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>\n${pigment}`);
    // Procedural height is converted into a small normal perturbation so pores
    // respond to the directional key and grazing reflections. This is a
    // shading relief only; it does not alter approved landscape geometry.
    shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_begin>", `#include <normal_fragment_begin>
      float reliefHeight = mineralNoise(vMineralPosition * 18.0) * 0.012;
      vec3 reliefGradient = vec3(dFdx(reliefHeight), dFdy(reliefHeight), 0.0);
      normal = normalize(normal + reliefGradient * 0.8);
    `);
  };
  material.customProgramCacheKey = () => cacheKey;
  return material;
}

/** Maps are caller-owned clones, repeated at the original physical 200 cm tile. */
export function createGravelMaterial(maps: readonly THREE.Texture[]) {
  const material = new THREE.MeshStandardMaterial({
    color: "#ffffff", map: maps[0], normalMap: maps[1], roughnessMap: maps[2],
    normalScale: new THREE.Vector2(0.72, 0.72), roughness: 0.92, envMapIntensity: 0.3,
  });
  return worldPigment(material, `
    // The existing scan is dark mineral aggregate. Re-map its full luminance
    // range into limestone pigment; preserve crevices instead of flattening
    // 82% of the image into one uniform pale color.
    float scanLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    float stoneGrain = smoothstep(0.018, 0.25, scanLuma);
    // Keep the path in the photograph's pale warm limestone range. Values are
    // linear scene values, so the lower endpoint must remain well above grey
    // concrete once AgX and the daylight key are applied.
    vec3 limestone = mix(vec3(0.58, 0.51, 0.40), vec3(0.86, 0.79, 0.67), stoneGrain);
    float drift = mineralNoise(vMineralPosition * 0.48);
    float mineralDust = mineralNoise(vMineralPosition * 2.3);
    diffuseColor.rgb = limestone * (0.94 + drift * 0.12 + mineralDust * 0.04);
  `, "garden-gravel-limestone-v1");
}

/** World-space pores work on UV-less rocks and keep grain scale under instancing. */
export function createLimestoneMaterial() {
  const material = new THREE.MeshStandardMaterial({
    color: "#c9baa0", roughness: 0.88, envMapIntensity: 0.28,
  });
  return worldPigment(material, `
    float cloud = mineralNoise(vMineralPosition * 5.2);
    float pitting = mineralNoise(vMineralPosition * 95.0);
    float chips = mineralNoise(vMineralPosition * 24.0);
    float pore = smoothstep(0.64, 0.79, pitting) * smoothstep(0.35, 0.62, chips);
    float sediment = sin(vMineralPosition.y * 32.0 + cloud * 4.5) * 0.035;
    diffuseColor.rgb *= 0.78 + cloud * 0.38 + sediment - pore * 0.34;
    // Dark mineral seams remain sparse; most exposed stone is pale limestone.
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.69, 0.68, 0.61),
      smoothstep(0.64, 0.81, mineralNoise(vMineralPosition * 11.0)) * 0.35);
  `, "garden-weathered-limestone-v1");
}
