// Refine the remaining low-poly lumbar cushions without changing furniture placement.
import { createRequire } from 'node:module';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
const require = createRequire(import.meta.url);
const { NodeIO } = require(process.env.GLTF_TRANSFORM_MODULE || '/tmp/house-render-qa/node_modules/@gltf-transform/core');
const { EXTMeshoptCompression, KHRMeshQuantization } = require('/tmp/house-render-qa/node_modules/@gltf-transform/extensions');
const { MeshoptDecoder, MeshoptEncoder } = require('/tmp/house-render-qa/node_modules/meshoptimizer');
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const { dequantize } = require('/tmp/house-render-qa/node_modules/@gltf-transform/functions');
const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const selected = (process.env.INTERIOR_ASSETS || 'bed-linen,linen-lounge-chair').split(',');
for (const id of selected) {
  for (const light of [false, true]) {
    const file = `public/models/interior/${id}${light ? '-light' : ''}.glb`;
    const doc = await io.read(file);
    await doc.transform(dequantize());
    const buffer = doc.getRoot().listBuffers()[0];
    for (const mesh of doc.getRoot().listMeshes()) {
      if (!mesh.getName().startsWith('Sphere') || mesh.getExtras().tailoredCushion) continue;
      mesh.setExtras({ ...mesh.getExtras(), tailoredCushion: true });
      for (const primitive of mesh.listPrimitives()) {
        const position = primitive.getAttribute('POSITION');
        const min = position.getMin([]), max = position.getMax([]);
        const dimensions = min.map((v, i) => max[i] - v);
        const radius = Math.min(...dimensions) * .28;
        let geometry = new RoundedBoxGeometry(...dimensions, light ? 4 : 8, radius);
        const p = geometry.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
          const nx = x / (dimensions[0] / 2), ny = y / (dimensions[1] / 2), nz = z / (dimensions[2] / 2);
          p.setXYZ(i, x, y + .004 * Math.sin(nx * 21 + nz * 8) * Math.pow(Math.abs(ny), 7),
            z + Math.sign(nz) * .008 * Math.max(0, 1 - nx * nx) * Math.max(0, 1 - ny * ny));
        }
        geometry.deleteAttribute('normal'); geometry.deleteAttribute('uv');
        const welded = mergeVertices(geometry, 1e-5); geometry.dispose(); geometry = welded;
        geometry.computeVertexNormals();
        geometry.translate(...min.map((v, i) => (v + max[i]) / 2));
        const accessor = (name, type, array) => doc.createAccessor(name).setType(type).setArray(array).setBuffer(buffer);
        primitive.setAttribute('POSITION', accessor('Soft lumbar position', 'VEC3', geometry.attributes.position.array));
        primitive.setAttribute('NORMAL', accessor('Soft lumbar normal', 'VEC3', geometry.attributes.normal.array));
        primitive.setAttribute('TEXCOORD_0', null);
        primitive.setIndices(accessor('Soft lumbar indices', 'SCALAR', geometry.index.array));
        geometry.dispose();
      }
    }
    // The former refiner deleted cushion UVs, leaving cloned fabric bump maps
    // sampling a constant point. Repair old exports as well as new cushions.
    for (const mesh of doc.getRoot().listMeshes()) for (const primitive of mesh.listPrimitives()) {
      if (!primitive.getMaterial().getName().toLowerCase().includes('linen') || primitive.getAttribute('TEXCOORD_0')) continue;
      const p = primitive.getAttribute('POSITION').getArray(), n = primitive.getAttribute('NORMAL').getArray();
      const uv = new Float32Array(p.length / 3 * 2);
      for (let i = 0; i < p.length / 3; i++) {
        const axis = [Math.abs(n[i * 3]), Math.abs(n[i * 3 + 1]), Math.abs(n[i * 3 + 2])];
        uv[i * 2] = axis[0] > Math.max(axis[1], axis[2]) ? p[i * 3 + 2] : p[i * 3];
        uv[i * 2 + 1] = axis[1] > Math.max(axis[0], axis[2]) ? p[i * 3 + 2] : p[i * 3 + 1];
      }
      primitive.setAttribute('TEXCOORD_0', doc.createAccessor('Metric linen UV').setType('VEC2').setArray(uv).setBuffer(buffer));
    }
    // Drop replaced accessors rather than carrying orphaned buffers into the web asset.
    for (const accessor of doc.getRoot().listAccessors()) if (accessor.listParents().length === 1) accessor.dispose();
    await io.write(file, doc);
    console.log(`Refined ${file}`);
  }
}
