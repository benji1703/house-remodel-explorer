// PLAYWRIGHT_MODULE=/path/to/playwright node scripts/verify-adaptive-render.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium, webkit } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.RENDER_BASE_URL || 'http://localhost:3000';
const directory = 'artifacts/safari-performance';
fs.mkdirSync(directory, { recursive: true });
const report = { cases: [], errors: [] };
const snapshot = (page) => page.evaluate(() => window.__gardenQA.snapshot());
async function settle(page) {
  await page.waitForFunction(() => window.__gardenQA?.snapshot().renderer, { timeout: 60000 });
  await page.waitForTimeout(2600);
}
for (const [name, engine, mobile] of [['webkit', webkit, false], ['chromium', chromium, false], ['webkit-mobile', webkit, true], ['chromium-mobile', chromium, true]]) {
  const browser = await engine.launch(engine === chromium ? { channel: 'chrome' } : {});
  try {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 960 }, deviceScaleFactor: mobile ? 3 : 2, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', (error) => report.errors.push({ browser: name, message: error.message }));
    page.on('console', (message) => {
      if (message.type() === 'error' && /WebGL|THREE|Maximum update|Cannot update/.test(message.text())) report.errors.push({ browser: name, message: message.text() });
    });
    page.on('response', (response) => {
      if (response.status() >= 400 && /\.(glb|gltf|bin|ktx2)/.test(response.url())) report.errors.push({ browser: name, asset: response.url(), status: response.status() });
    });
    await page.goto(`${base}/?view=model&camera=overview&zone=north-extension&gardenQA=1`);
    await settle(page);
    const overview = await snapshot(page);
    assert.ok(!overview.assets.some((r) => /models\/landscape\/[^/]+(?<!-light)(?<!-far)\.glb/.test(r.url)), `${name}: overview must not fetch high-detail garden assets`);
    assert.ok(!overview.assets.some((r) => /models\/(potted-plant-02|periwinkle-plant)\//.test(r.url)), `${name}: overview must not preload decorative scans`);
    assert.ok(overview.dpr >= (mobile ? 1.4 : 1.9), `${name}: settled Retina image is sharp`);
    assert.ok(overview.drawingBuffer[0] * overview.drawingBuffer[1] <= (mobile ? 1_600_000 : 4_000_000), `${name}: framebuffer pixel budget`);
    await page.screenshot({ path: `${directory}/${name}-overview.jpg`, quality: 88 });
    await page.waitForTimeout(500);
    assert.equal((await snapshot(page)).frames, overview.frames, `${name}: idle rendering must stop`);

    // The actual OrbitControls zoom path, with no route change, restores detail.
    await page.evaluate(() => window.__gardenQA.camera([-10.5, 4.2, -5.3], [-8, 0.8, -2.5]));
    await settle(page);
    const close = await snapshot(page);
    assert.ok(mobile ? close.lod.light > 0 : close.lod.high > 0, `${name}: zoom loads closer geometry`);
    const canvas = page.locator('canvas').first();
    await canvas.focus();
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(() => window.__gardenQA.snapshot().dpr <= 1.25, { timeout: 2000 });
    const moving = await snapshot(page);
    assert.ok(moving.dpr <= 1.25, `${name}: interaction has a smaller pixel budget`);
    await page.waitForTimeout(1100);
    assert.equal((await snapshot(page)).dpr, overview.dpr, `${name}: full resolution returns after interaction`);

    await page.goto(`${base}/?view=model&camera=garden&zone=central-core&gardenQA=1`);
    await settle(page);
    const garden = await snapshot(page);
    assert.ok(overview.triangles < 5_000_000 && garden.triangles < 8_000_000, `${name}: distant geometry stays within the triangle budget`);
    const performance = await page.evaluate(() => window.__gardenQA.renderSample(20));
    await page.screenshot({ path: `${directory}/${name}-garden.jpg`, quality: 88 });
    const pick = await page.evaluate(() => window.__gardenQA.pickTarget());
    assert.ok(pick, `${name}: instanced plant picking remains available`);
    await page.mouse.click(pick.x, pick.y);
    await page.locator('.garden-plant-label').waitFor();
    await page.getByRole('button', { name: 'Close plant details', exact: true }).click();
    await page.goto(`${base}/?view=model&camera=room&zone=north-extension&gardenQA=1`);
    await settle(page);
    const room = await snapshot(page);
    assert.ok(room.triangles < 250_000, `${name}: hidden room geometry is not submitted`);
    await page.screenshot({ path: `${directory}/${name}-kitchen.jpg`, quality: 88 });
    assert.ok(room.camera.every((n, i) => Math.abs(n - [-3.3, 2.35, -1.9][i]) < 0.02), `${name}: room camera retained`);
    if (mobile && engine === chromium) {
      const client = await context.newCDPSession(page);
      const beforeTouch = (await snapshot(page)).camera;
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 170, y: 350 }] });
      for (let i = 1; i <= 8; i++) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 170 + i * 6, y: 350 + i }] });
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(600);
      assert.notDeepEqual((await snapshot(page)).camera, beforeTouch, `${name}: touch orbit remains functional`);
    }
    await page.goto(`${base}/?view=model&camera=plan&zone=central-core&gardenQA=1`);
    await settle(page);
    assert.equal((await snapshot(page)).cameraType, 'OrthographicCamera', `${name}: top view remains available`);
    await canvas.focus();
    await page.keyboard.press('+');
    await page.waitForFunction(() => window.__gardenQA.snapshot().dpr <= 1.25, { timeout: 2000 });
    await page.waitForTimeout(800);
    assert.equal((await snapshot(page)).dpr, overview.dpr, `${name}: orthographic zoom restores resolution`);
    await canvas.evaluate((element) => element.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
    await page.waitForFunction(() => !document.querySelector('canvas'));
    assert.ok(await page.getByRole('button', { name: 'Plan', exact: true }).count(), `${name}: context loss preserves accessible navigation`);
    report.cases.push({ name, version: await browser.version(), overview, close, garden, room, performance, passed: true });
    console.log(`${name}: passed`);
  } catch (error) {
    report.cases.push({ name, passed: false, error: error.message });
    process.exitCode = 1;
    console.error(`${name}: ${error.message}`);
  } finally {
    await browser.close();
    fs.writeFileSync(`${directory}/report.json`, JSON.stringify(report, null, 2));
  }
}
if (report.errors.length) { process.exitCode = 1; console.error(report.errors); }
