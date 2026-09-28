// PLAYWRIGHT_MODULE and MOOD_ASSET_TOOLS may point to external tool installs.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const assetTool = name => require(process.env.MOOD_ASSET_TOOLS ? path.join(process.env.MOOD_ASSET_TOOLS, name) : name);
const { NodeIO, getBounds } = assetTool('@gltf-transform/core');
const { ALL_EXTENSIONS } = assetTool('@gltf-transform/extensions');
const { MeshoptDecoder } = assetTool('meshoptimizer');
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const directory = 'artifacts/mood-fixtures';
const report = { assets: [], views: [], errors: [] };
for (const { file } of JSON.parse(fs.readFileSync(`${directory}/assets.json`))) {
  const doc = await io.read(file);
  const bounds = getBounds(doc.getRoot().listScenes()[0]);
  for (const n of [...bounds.min, ...bounds.max]) assert.ok(Number.isFinite(n), `${file}: finite bounds`);
  for (const mesh of doc.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) {
    for (const semantic of ['POSITION', 'NORMAL']) {
      const a = p.getAttribute(semantic);
      assert.ok(a, `${file}: ${semantic} exists`);
      assert.ok(a.getArray().every(Number.isFinite), `${file}: valid ${semantic}`);
    }
  }
  if (file.includes('toilet')) {
    const size = bounds.max.map((v, i) => v - bounds.min[i]);
    assert.ok(Math.abs(size[0] - .36) < .001, 'WC width is 36 cm');
    assert.ok(Math.abs(size[2] - .54) < .001, 'WC projection is 54 cm');
    assert.ok(Math.abs(bounds.max[1] - .478) < .001, 'WC top is 47.8 cm');
    assert.ok(bounds.min[1] > .13, 'WC has a wall-hung clearance below');
  }
  report.assets.push({ file, bounds });
}
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
  await page.goto(`${process.env.RENDER_BASE_URL || 'http://localhost:3000'}/?view=model&camera=garden&zone=central-core&gardenQA=1`);
  await page.waitForFunction(() => window.__gardenQA?.snapshot().target);
  for (const quality of ['high', 'light']) {
    if (quality === 'light') await page.getByRole('button', { name: 'Use lighter rendering' }).click();
    await page.waitForTimeout(5000);
    const plants = await page.evaluate(() => window.__gardenQA.plants().filter(p => p.accepted));
    const vines = plants.filter(p => p.species === 'trachelospermum-jasminoides');
    assert.equal(vines.flatMap(p => p.accepted).length, 2, `${quality}: both jasmine vines clear shell and paths`);
    assert.deepEqual(vines.flatMap(p => p.rejected), [], `${quality}: no rejected vines`);
    const snapshot = await page.evaluate(() => window.__gardenQA.snapshot());
    assert.ok(snapshot.assets.some(a => a.url.includes(quality === 'light' ? 'olive-pot-light.glb' : 'olive-pot.glb')), `${quality}: correct pot asset loaded`);
    await page.getByRole('button', { name: 'Terrace approach', exact: true }).click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${directory}/garden-${quality}.png` });
    report.views.push({ quality, calls: snapshot.calls, triangles: snapshot.triangles, vines, excludedPlants: plants.flatMap(p => p.rejected) });
  }
  await page.getByRole('button', { name: 'Top view', exact: true }).click();
  await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => window.__gardenQA.snapshot().cameraType), 'OrthographicCamera');
  await page.screenshot({ path: `${directory}/orthographic.png` });
  assert.deepEqual(report.errors, [], 'No asset, browser or shader errors');
  report.passed = true;
} catch (error) {
  report.passed = false; report.failure = error.message; process.exitCode = 1;
} finally {
  fs.writeFileSync(`${directory}/verification.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, failure: report.failure, assets: report.assets.length, views: report.views, errors: report.errors }));
  await browser.close();
}
