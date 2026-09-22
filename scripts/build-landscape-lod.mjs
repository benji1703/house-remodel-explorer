// Derive distant meshes from the existing authored assets; never move specimens.
// LOD_TOOLS=/path/to/node_modules node scripts/build-landscape-lod.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(import.meta.url);
const load = (name) => require(process.env.LOD_TOOLS ? path.join(process.env.LOD_TOOLS, name) : name);
const { NodeIO } = load('@gltf-transform/core');
const { ALL_EXTENSIONS } = load('@gltf-transform/extensions');
const { simplify, weld, prune, meshopt, textureCompress } = load('@gltf-transform/functions');
const { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } = load('meshoptimizer');
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const dir = 'public/models/landscape';
const report = [];
for (const file of (await fs.readdir(dir)).filter((name) => !process.argv.includes('--props-only') && name.endsWith('-light.glb'))) {
  const document = await io.read(path.join(dir, file));
  const triangles = () => document.getRoot().listMeshes().flatMap((mesh) => mesh.listPrimitives()).reduce((sum, p) => sum + p.getIndices().getCount() / 3, 0);
  const before = triangles();
  // Keep UVs, vertex pigment and normals. This is an offline LOD, not a
  // runtime decimation stall on the first zoom. Fine silhouette stays nearby.
  await document.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.16, error: 0.035 }), prune());
  const after = triangles();
  await document.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  const output = file.replace('-light.glb', '-far.glb');
  await io.write(path.join(dir, output), document);
  report.push({ file: output, before, after, bytes: (await fs.stat(path.join(dir, output))).size });
}
// Preserve the scanned silhouettes in the overview, instead of replacing
// leaves with spheres. Only the nearby versions need full meshes / 1K maps.
await fs.mkdir('public/models/previews', { recursive: true });
for (const [source, name] of [
  ['potted-plant-02/potted_plant_02_1k.gltf', 'potted-plant'],
  ['periwinkle-plant/periwinkle_plant_1k.gltf', 'periwinkle'],
]) {
  const document = await io.read(`public/models/${source}`);
  await document.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.12, error: 0.02 }),
    textureCompress({ encoder: load('sharp'), resize: [256, 256] }), prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  const output = `public/models/previews/${name}.glb`;
  await io.write(output, document);
  report.push({ file: output, bytes: (await fs.stat(output)).size });
}
await fs.mkdir('artifacts/safari-performance', { recursive: true });
await fs.writeFile(`artifacts/safari-performance/${process.argv.includes('--props-only') ? 'prop' : 'lod'}-assets.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
