// Run with the dev server and PLAYWRIGHT_MODULE=/path/to/playwright.
// Exercise real shaders on desktop/WebKit/mobile, including the 16-sampler
// walkthrough regression. Screenshots are also the apartment's visual audit.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium, webkit } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.RENDER_BASE_URL || 'http://localhost:3000';
const directory = process.env.RENDER_ARTIFACT_DIR || 'artifacts/apartment-review';
fs.mkdirSync(directory, { recursive: true });
const report = { errors: [], cases: [] };

async function ready(page) {
  await page.waitForFunction(() => window.__gardenQA?.snapshot().calls > 0
    && !document.querySelector('.is-model-loading') && !document.querySelector('[data-lighting-loading]')
    && window.__gardenQA.interiors().every(asset => asset.loaded), null, { timeout: 60000 });
  await page.waitForTimeout(900);
}
function watch(page, browser) {
  page.on('pageerror', error => report.errors.push({ browser, error: error.message }));
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push({ browser, error: message.text() });
  });
  page.on('response', response => {
    if (response.status() >= 400 && /\.(glb|gltf|ktx2)/.test(response.url()))
      report.errors.push({ browser, error: `${response.status()} ${response.url()}` });
  });
}
async function setQuality(page, quality) {
  const toggle = page.locator('button[aria-label="Toggle rendering detail"]');
  const light = await toggle.getAttribute('aria-pressed') === 'true';
  if (light !== (quality === 'light')) await toggle.click();
}
async function capture(page, name, shadowLimit, minimumDpr = 1.8) {
  if (minimumDpr >= 1.8) await setQuality(page, 'high');
  await ready(page);
  const gpu = await page.evaluate(() => window.__gardenQA.gpu());
  assert.equal(gpu.contextLost, false, `${name}: WebGL context stays live`);
  assert.deepEqual(gpu.errors, [], `${name}: no pending WebGL errors`);
  assert.equal(gpu.linkedProgramCount, gpu.programCount, `${name}: all compiled shaders link`);
  assert.ok(gpu.maxTextureImageUnits >= 8, `${name}: fragment texture units reported`);
  const lighting = await page.evaluate(() => window.__gardenQA.lighting());
  const shadows = lighting.sources.filter(light => light.type === 'SpotLight' && light.castShadow);
  assert.ok(shadows.length <= shadowLimit, `${name}: bounded local shadow samplers`);
  assert.ok(shadows.length <= Math.max(0, gpu.maxTextureImageUnits - 8), `${name}: shadow samplers fit this GPU`);
  assert.ok(shadows.every(light => light.shadowMapAllocated), `${name}: selected shadows render`);
  const snapshot = await page.evaluate(() => window.__gardenQA.snapshot());
  assert.ok(snapshot.dpr >= minimumDpr, `${name}: settled ${minimumDpr}× render density (received ${snapshot.dpr}×)`);
  assert.deepEqual(snapshot.drawingBuffer, gpu.drawingBuffer, `${name}: render buffer matches the verified canvas`);
  assert.ok(snapshot.contactShadowRevision > 0, `${name}: asset arrivals refresh floor contact shadows`);
  assert.ok(snapshot.camera.every(Number.isFinite), `${name}: finite camera pose`);
  const props = await page.evaluate(() => window.__gardenQA.interiors());
  assert.ok(props.every(asset => asset.bounds.min.concat(asset.bounds.max).every(Number.isFinite)), `${name}: valid asset bounds`);
  await page.screenshot({ path: `${directory}/${name}.png` });
  report.cases.push({ name, snapshot, gpu, lighting, props });
  console.log(name);
}
async function preset(page, name, hour) {
  await page.getByRole('button', { name: 'Controls', exact: true }).click();
  await page.getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: 'Close controls', exact: true }).click();
  await page.waitForFunction(hour => window.__gardenQA.lighting().settings.hour === hour, hour);
  await ready(page);
}
async function sofaCamera(page) {
  const position = [-.8, 1.8, .65], target = [1, .60, 0];
  await page.evaluate(([p, t]) => window.__gardenQA.camera(p, t), [position, target]);
  await page.waitForTimeout(100);
  const direction = await page.evaluate(() => window.__gardenQA.snapshot().direction);
  const yaw = Math.atan2(-direction[0], -direction[2]);
  const goal = Math.atan2(position[0] - target[0], position[2] - target[2]);
  const delta = -Math.atan2(Math.sin(goal - yaw), Math.cos(goal - yaw)) / .004;
  const rect = await page.locator('canvas').first().boundingBox();
  const x = delta > 0 ? rect.x + 90 : rect.x + rect.width - 90, y = rect.y + rect.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + delta, y, { steps: 12 }); await page.mouse.up();
  const current = await page.evaluate(() => window.__gardenQA.snapshot().direction);
  const pitch = Math.atan2(target[1] - position[1], Math.hypot(target[0] - position[0], target[2] - position[2]));
  await page.mouse.move(rect.x + rect.width / 2, y); await page.mouse.down();
  await page.mouse.move(rect.x + rect.width / 2, y - (pitch - Math.asin(current[1])) / .004, { steps: 10 });
  await page.mouse.up();
}
try {
  for (const [browserName, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch(engine === chromium ? { channel: 'chrome', headless: true } : { headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
      watch(page, browserName);
      if (browserName === 'chromium') {
        for (const [name, zone] of [['living', 'central-core'], ['kitchen', 'north-extension'], ['master', 'southwest-room'],
          ['guest', 'east-upper-room'], ['east-bedroom', 'east-lower-room'], ['bathroom', 'service-core'], ['ensuite', 'ensuite']]) {
          await page.goto(`${base}/?view=model&camera=room&zone=${zone}&gardenQA=1`);
          await ready(page);
          assert.equal((await page.evaluate(() => window.__gardenQA.lighting())).settings.hour, 13.5, 'Legible daylight default');
          const surfaces = await page.evaluate(() => window.__gardenQA.surfaces());
          if (['bathroom', 'ensuite'].includes(name)) assert.ok(surfaces.some(surface => surface.surface === 'mineral' && surface.loaded), `${name}: wet-room mineral floor`);
          await capture(page, name, 6);
        }
        await page.goto(`${base}/?view=model&camera=overview&gardenQA=1`);
        await capture(page, 'overview', 6);
      }
      await page.goto(`${base}/?view=model&camera=walk&zone=central-core&gardenQA=1`);
      await ready(page);
      await setQuality(page, 'high');
      await ready(page);
      await sofaCamera(page);
      await ready(page); // Let OrbitControls damping settle before comparing quality changes.
      for (const quality of ['high', 'light']) {
        const before = await page.evaluate(() => window.__gardenQA.snapshot());
        await setQuality(page, quality);
        await ready(page);
        const after = await page.evaluate(() => window.__gardenQA.snapshot());
        for (const property of ['camera', 'direction']) assert.ok(after[property].every((value, i) => Math.abs(value - before[property][i]) < .01), `${quality}: quality change preserves walkthrough pose`);
        const sofa = (await page.evaluate(() => window.__gardenQA.interiors())).find(asset => asset.asset === 'tailored-linen-sofa');
        assert.equal(sofa.owner, 'living-sofa');
        const size = sofa.bounds.max.map((value, i) => value - sofa.bounds.min[i]);
        assert.ok(Math.abs(size[0] - 1.02) < .025 && Math.abs(size[2] - 2.2) < .025, 'Original editable sofa envelope');
        await capture(page, `${browserName}-sofa-${quality}`, quality === 'high' ? 6 : 3, quality === 'high' ? 1.8 : 1.05);
      }
      await preset(page, 'Evening glow', 21);
      await capture(page, `${browserName}-evening-light`, 3, 1.05);
      await page.getByRole('button', { name: 'Toggle rendering detail' }).click();
      await capture(page, `${browserName}-evening-high`, 6, 1.8);
      await page.close();

      const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
        isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
      watch(mobile, `${browserName}-mobile`);
      await mobile.goto(`${base}/?view=model&camera=walk&zone=central-core&gardenQA=1`);
      await ready(mobile);
      assert.equal(await mobile.locator('button[aria-label="Toggle rendering detail"]').getAttribute('aria-pressed'), 'false');
      await capture(mobile, `${browserName}-mobile`, 3, 1.05);
      // Context loss must retain the accessible 2D plan, with room navigation.
      await mobile.locator('canvas').first().evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
      await mobile.waitForFunction(() => !document.querySelector('canvas'));
      assert.ok(await mobile.getByRole('button', { name: 'Plan', exact: true }).count());
      await mobile.close();
    } finally { await browser.close(); }
  }
  assert.deepEqual(report.errors, [], 'No JavaScript, asset or shader errors');
  report.passed = true;
} catch (error) {
  report.passed = false; report.failure = error.stack; process.exitCode = 1;
} finally {
  fs.writeFileSync(`${directory}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, failure: report.failure, cases: report.cases.map(test => test.name), errors: report.errors }));
}
