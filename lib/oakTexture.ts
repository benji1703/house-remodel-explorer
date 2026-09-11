import * as THREE from "three";

/** Seamless quarter-sawn grain, without baked board joints or giant knots. */
export function createOakTexture(anisotropy: number) {
  const size = 512;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const drift = Math.sin(v * Math.PI * 2) * 0.005 + Math.sin(v * Math.PI * 6) * 0.0015;
      const grain = Math.sin((u + drift) * Math.PI * 2 * 83);
      const pores = Math.max(0, Math.sin((u + drift * 0.6) * Math.PI * 2 * 193)) ** 12;
      const broad = Math.sin((u + drift) * Math.PI * 2 * 11);
      const value = 235 + grain * 3 + broad * 4 - pores * 7;
      const i = (y * size + x) * 4;
      data[i] = value; data[i + 1] = value - 3; data[i + 2] = value - 8; data[i + 3] = 255;
    }
  }
  const map = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.magFilter = THREE.LinearFilter;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  map.anisotropy = anisotropy;
  map.needsUpdate = true;
  return map;
}
