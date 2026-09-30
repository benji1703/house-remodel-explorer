// MOOD_ASSET_TOOLS=/path/to/node_modules node scripts/pack-interior-mood.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const require = createRequire(import.meta.url);
const load = name => require(process.env.MOOD_ASSET_TOOLS ? path.join(process.env.MOOD_ASSET_TOOLS, name) : name);
const { NodeIO, getBounds } = load('@gltf-transform/core');
const { ALL_EXTENSIONS } = load('@gltf-transform/extensions');
const { weld, prune, meshopt } = load('@gltf-transform/functions');
const { MeshoptDecoder, MeshoptEncoder } = load('meshoptimizer');
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const report = [];
for (const name of (await fs.readdir('public/models/interior')).filter(n => n.endsWith('.glb')).sort()) {
  const file = `public/models/interior/${name}`;
  const doc = await io.read(file);
  await doc.transform(weld(), prune({ keepAttributes: true }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  // Fabrics acquire shared mood textures at runtime; keep their UVs even
  // though the source GLBs intentionally contain no duplicate texture images.
  for (const mesh of doc.getRoot().listMeshes()) for (const primitive of mesh.listPrimitives()) {
    for (const semantic of ['POSITION', 'NORMAL']) {
      const attribute = primitive.getAttribute(semantic);
      assert.ok(attribute && attribute.getArray().every(Number.isFinite), `${file}: valid ${semantic}`);
    }
    if (primitive.getMaterial().getName().includes('linen')) {
      assert.ok(primitive.getAttribute('TEXCOORD_0'), `${file}: preserve textile UVs`);
    }
  }
  await io.write(file, doc);
  const bounds = getBounds(doc.getRoot().listScenes()[0]);
  if (name.startsWith('tailored-linen-sofa')) {
    const size = bounds.max.map((n, i) => n - bounds.min[i]);
    assert.ok(Math.abs(size[0] - 0.90) < 0.025, `${name}: 90 cm sofa depth`);
    assert.ok(Math.abs(size[1] - 0.75) < 0.04, `${name}: 75 cm sofa height`);
    assert.ok(Math.abs(size[2] - 2.2) < 0.02, `${name}: 220 cm sofa length`);
  }
  report.push({ file, bytes: (await fs.stat(file)).size, bounds, triangles: doc.getRoot().listMeshes().flatMap(m => m.listPrimitives()).reduce((n,p) => n + p.getIndices().getCount()/3, 0) });
}
await fs.mkdir('artifacts/interior-styling', { recursive: true });
await fs.writeFile('artifacts/interior-styling/assets.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
