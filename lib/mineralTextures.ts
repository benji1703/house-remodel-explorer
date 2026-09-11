import * as THREE from "three";

// Seamless, deterministic mineral maps. Colour, relief and roughness are
// independent so pigment clouds do not become oversized pits in grazing light.
export function createMineralTextures(kind: "limewash" | "microtopping", size: number, anisotropy: number) {
  const hash = (x: number, y: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + 19.19) * 43758.5453;
    return n - Math.floor(n);
  };
  const noise = (u: number, v: number, frequency: number) => {
    const x = u * frequency, y = v * frequency;
    const ix = Math.floor(x), iy = Math.floor(y);
    const sx = (x - ix) ** 2 * (3 - 2 * (x - ix));
    const sy = (y - iy) ** 2 * (3 - 2 * (y - iy));
    const h = (a: number, b: number) => hash((a % frequency + frequency) % frequency, (b % frequency + frequency) % frequency);
    return THREE.MathUtils.lerp(THREE.MathUtils.lerp(h(ix, iy), h(ix + 1, iy), sx), THREE.MathUtils.lerp(h(ix, iy + 1), h(ix + 1, iy + 1), sx), sy);
  };
  const color = new Uint8Array(size * size * 4);
  const bump = new Uint8Array(size * size * 4);
  const rough = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const cloud = noise(u, v, 4) * 0.52 + noise(u, v, 12) * 0.28 + noise(u, v, 32) * 0.2;
      const trowel = Math.sin((u * 5 + v * 3) * Math.PI * 2 + noise(u, v, 8) * 3) * 0.5 + 0.5;
      const grain = noise(u, v, 128);
      const pigment = kind === "limewash" ? 229 + cloud * 20 : 235 + cloud * 14;
      const relief = 115 + grain * 24 + trowel * 2;
      const roughness = (kind === "limewash" ? 232 : 195) + cloud * 18 + grain * 5;
      const i = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) {
        color[i + c] = pigment;
        bump[i + c] = relief;
        rough[i + c] = roughness;
      }
      color[i + 3] = bump[i + 3] = rough[i + 3] = 255;
    }
  }
  const make = (data: Uint8Array, colorSpace: THREE.ColorSpace) => {
    const map = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    map.colorSpace = colorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.magFilter = THREE.LinearFilter;
    map.minFilter = THREE.LinearMipmapLinearFilter;
    map.generateMipmaps = true;
    map.anisotropy = anisotropy;
    map.needsUpdate = true;
    return map;
  };
  return { albedo: make(color, THREE.SRGBColorSpace), bump: make(bump, THREE.NoColorSpace), roughness: make(rough, THREE.NoColorSpace) };
}
