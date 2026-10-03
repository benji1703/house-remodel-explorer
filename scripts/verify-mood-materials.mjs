// Run against npm run dev. PLAYWRIGHT_MODULE can point to a local installation.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.RENDER_BASE_URL || 'http://localhost:3000';
const directory = process.env.RENDER_ARTIFACT_DIR || 'artifacts/mood-materials/after';
fs.mkdirSync(directory, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { errors: [], cases: [] };
const expectedImages = {
  clay: "/references/moods/mood-terrace-08.jpeg",
  oak: '/references/moods/mood-kitchen-16.jpeg',
  travertine: '/references/moods/mood-kitchen-detail.jpeg',
  plaster: '/references/moods/mood-living-14.jpeg',
  mineral: '/references/moods/mood-living-14.jpeg',
  linen: '/references/moods/mood-living-08.jpeg',
  woven: '/references/moods/mood-kitchen-06.jpeg',
};
const expectedTextures = {
  clay: '/references/moods/mood-terrace-08.jpeg',
  oak: '/textures/door-oak-albedo.jpg',
  travertine: '/references/moods/mood-kitchen-detail.jpeg',
  plaster: '/textures/lime-plaster-albedo.jpg',
  mineral: '/references/moods/mood-living-14.jpeg',
  linen: '/textures/linen-washed-albedo.jpg',
  woven: '/textures/chair-rush-albedo.jpg',
};
async function settle(page) {
  await page.waitForFunction(() => window.__gardenQA?.snapshot().target && !document.querySelector('.is-model-loading'));
  await page.waitForTimeout(1400);
}
function watch(page) {
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
}
async function inspect(page, name, expected) {
  await settle(page);
  const surfaces = await page.evaluate(() => window.__gardenQA.surfaces());
  for (const id of expected) assert.ok(surfaces.some(s => s.surface === id), `${name}: ${id} is present`);
  for (const surface of surfaces) {
    assert.equal(surface.image, expectedImages[surface.surface]);
    assert.equal(surface.texture, expectedTextures[surface.surface], `${name}: material records its dedicated texture`);
    assert.equal(new URL(surface.sourceUrl).pathname, expectedTextures[surface.surface], `${name}: dedicated finish texture is bound`);
    assert.equal(surface.loaded, true, `${name}: source image decoded`);
    assert.equal(surface.colorSpace, 'srgb');
    assert.equal(surface.shader, `mood-surface-v2-${surface.surface}`, `${name}: clones retain the crop shader`);
  }
  const snapshot = await page.evaluate(() => window.__gardenQA.snapshot());
  assert.ok(snapshot.calls > 0 && snapshot.triangles > 0, `${name}: rendered scene`);
  await page.screenshot({ path: `${directory}/${name}.png` });
  report.cases.push({ name, surfaces: [...new Set(surfaces.map(s => s.surface))], textures: snapshot.textures, calls: snapshot.calls });
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
  watch(page);
  for (const [name, zone, textiles] of [
    ['kitchen', 'north-extension', ['woven']], ['living', 'central-core', ['linen']],
    ['bedroom', 'southwest-room', ['linen']], ['guest', 'east-upper-room', ['linen']],
    ['east-bedroom', 'east-lower-room', ['linen']], ['bathroom', 'service-core', []], ['ensuite', 'ensuite', []],
  ]) {
    await page.goto(`${base}/?view=model&camera=room&zone=${zone}&gardenQA=1`);
    await inspect(page, name, ['oak', 'plaster', ...textiles]);
  }
  await page.goto(`${base}/?view=model&camera=overview&floor=sand-microtopping&gardenQA=1`);
  const qualityToggle = page.locator('button[aria-label="Toggle rendering detail"]');
  if (await qualityToggle.getAttribute('aria-pressed') === 'true') await qualityToggle.click();
  await inspect(page, 'overview', Object.keys(expectedImages));
  await qualityToggle.click();
  await inspect(page, 'overview-light', Object.keys(expectedImages));
  await page.goto(`${base}/?view=model&camera=room&zone=north-extension&floor=oak&gardenQA=1`);
  await inspect(page, 'kitchen-parquet', ['oak', 'plaster', 'travertine']);
  await page.getByRole('button', { name: 'Survey shell', exact: true }).click();
  await settle(page);
  assert.deepEqual(await page.evaluate(() => window.__gardenQA.surfaces()), [], 'Survey shell excludes mood finishes');
  report.cases.push({ name: 'survey-shell', passed: true });
  await page.close();
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  watch(mobile);
  await mobile.goto(`${base}/?view=model&camera=room&zone=north-extension&gardenQA=1`);
  await inspect(mobile, 'mobile-kitchen', ['oak', 'travertine', 'plaster', 'woven']);
  assert.equal(await mobile.locator('button[aria-label="Toggle rendering detail"]').getAttribute('aria-pressed'), 'false');
  await mobile.close();
  assert.deepEqual(report.errors, [], 'No browser or shader errors');
  report.passed = true;
} catch (error) {
  report.passed = false;
  report.failure = error.message;
  process.exitCode = 1;
} finally {
  fs.writeFileSync(`${directory}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  await browser.close();
}
