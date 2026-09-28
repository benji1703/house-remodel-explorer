// MOOD_ASSET_TOOLS=/path/to/node_modules node scripts/pack-mood-fixtures.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
const require = createRequire(import.meta.url);
const load = name => require(process.env.MOOD_ASSET_TOOLS ? path.join(process.env.MOOD_ASSET_TOOLS, name) : name);
const { NodeIO } = load('@gltf-transform/core');
const { ALL_EXTENSIONS } = load('@gltf-transform/extensions');
const { weld, prune, meshopt } = load('@gltf-transform/functions');
const { MeshoptDecoder, MeshoptEncoder } = load('meshoptimizer');
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const files = ['toilet-wall-hung', 'olive-pot', 'olive-pot-light'].map(name => `public/models/mood/${name}.glb`);
for (const species of ['trachelospermum-jasminoides', 'myrtus-communis', 'salvia-fruticosa', 'salvia-rosmarinus']) {
  for (const suffix of ['', '-light', '-far']) files.push(`public/models/landscape/${species}${suffix}.glb`);
}
const report = [];
for (const file of files) {
  const document = await io.read(file);
  await document.transform(weld(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await io.write(file, document);
  const meshes = document.getRoot().listMeshes();
  report.push({ file, bytes: (await fs.stat(file)).size, triangles: meshes.flatMap(m => m.listPrimitives()).reduce((n, p) => n + p.getIndices().getCount() / 3, 0) });
}
await fs.mkdir('artifacts/mood-fixtures', { recursive: true });
await fs.writeFile('artifacts/mood-fixtures/assets.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
