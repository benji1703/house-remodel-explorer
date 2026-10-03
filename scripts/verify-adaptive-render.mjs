// PLAYWRIGHT_MODULE=/path/to/playwright node scripts/verify-adaptive-render.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium, webkit } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.RENDER_BASE_URL || 'http://localhost:3000';
const directory = process.env.RENDER_ARTIFACT_DIR || 'artifacts/safari-performance';
fs.mkdirSync(directory, { recursive: true });
const report = { cases: [], errors: [] };
const snapshot = (page) => page.evaluate(() => window.__gardenQA.snapshot());
async function idle(page) {
  let previous = (await snapshot(page)).frames;
  let stable = 0;
  for (let attempt = 0; attempt < 80; attempt++) {
    await page.waitForTimeout(150);
    const next = (await snapshot(page)).frames;
    if (next === previous) stable++;
    else { previous = next; stable = 0; }
    if (stable >= 6) return;
  }
  assert.fail('The scene did not reach an idle frame within 12 seconds');
}
async function settle(page) {
  await page.waitForFunction(() => window.__gardenQA?.snapshot().renderer, { timeout: 60000 });
  await page.waitForTimeout(2600);
  await idle(page);
}
async function observeMovingBudget(page, position, target, maximum) {
  return page.evaluate(async ({ position, target, maximum }) => {
    window.__gardenQA.camera(position, target);
    const started = performance.now();
    return new Promise(resolve => {
      const check = () => {
        const scene = window.__gardenQA.snapshot();
        if (scene.dpr <= maximum || performance.now() - started > 2000) resolve(scene);
        else requestAnimationFrame(check);
      };
      // Observe during the same frame sequence, before a 240ms idle restore
      // can happen between an evaluate response and Playwright polling.
      requestAnimationFrame(check);
    });
  }, { position, target, maximum });
}
const targets = [['webkit', webkit, false], ['chromium', chromium, false], ['webkit-mobile', webkit, true], ['chromium-mobile', chromium, true]]
  .filter(([name]) => !process.env.RENDER_BROWSERS || process.env.RENDER_BROWSERS.split(',').includes(name));
for (const [name, engine, mobile] of targets) {
  const browser = await engine.launch(engine === chromium ? { channel: 'chrome' } : {});
  try {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 960 }, deviceScaleFactor: mobile ? 3 : 2, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
    const landing = await context.newPage();
    await landing.goto(`${base}/?view=plan`);
    await landing.locator('.app-body.is-plan').waitFor();
    assert.equal(await landing.locator('canvas').count(), 0, `${name}: landing plan avoids allocating WebGL`);
    assert.equal(await landing.getByRole('button', { name: 'House', exact: true }).isVisible(), true, `${name}: 3D remains easy to enter`);
    report.cases.push({ name: `${name}-explicit-plan`, passed: true, canvasCount: 0 });
    await landing.close();
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
    const compactDevice = await page.evaluate(() => matchMedia('(max-width: 800px)').matches || matchMedia('(pointer: coarse)').matches);
    await page.waitForFunction(() => {
      const canvas = document.querySelector('canvas');
      const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
      if (!canvas || !gl) return false;
      const ratio = gl.drawingBufferWidth / Math.max(1, canvas.clientWidth);
      return Math.abs(ratio - window.__gardenQA.snapshot().dpr) < 0.03;
    });
    const overview = await snapshot(page);
    console.log(`${name}: default DPR ${overview.dpr}, framebuffer ${overview.drawingBuffer.join('x')} (${overview.drawingBuffer[0] * overview.drawingBuffer[1]} px)`);
    assert.equal(await page.locator('button[aria-label="Toggle rendering detail"]').getAttribute('aria-pressed'), 'false', `${name}: high detail is the 3D default`);
    assert.equal(await page.locator('button[aria-label="Toggle rendering detail"]').innerText(), compactDevice ? 'Detail: High' : 'Detail: Very High', `${name}: detail tier is named for the device`);
    assert.equal(overview.shadowType, 2, `${name}: shadows use filtered PCF sampling`);
    assert.ok(overview.sunShadowMapSize[0] >= (compactDevice ? 1024 : 2048), `${name}: shadow map is detailed enough for the device`);
    assert.ok(!overview.assets.some((r) => /models\/landscape\/[^/]+(?<!-light)(?<!-far)\.glb/.test(r.url)), `${name}: overview must not fetch high-detail garden assets`);
    assert.ok(!overview.assets.some((r) => /models\/(potted-plant-02|periwinkle-plant)\//.test(r.url)), `${name}: overview must not preload decorative scans`);
    assert.ok(overview.dpr <= (compactDevice ? 1.5 : 2), `${name}: device-appropriate default caps pixel ratio`);
    assert.ok(overview.drawingBuffer[0] * overview.drawingBuffer[1] <= (compactDevice ? 1_250_000 : 4_000_000), `${name}: high-detail framebuffer budget (${overview.dpr}x, ${overview.drawingBuffer.join('x')})`);
    await page.screenshot({ path: `${directory}/${name}-overview.jpg`, quality: 88 });
    await idle(page);
    const settledFrames = (await snapshot(page)).frames;
    await page.waitForTimeout(300);
    assert.equal((await snapshot(page)).frames, settledFrames, `${name}: idle rendering must stop`);

    // The actual OrbitControls zoom path, with no route change, restores detail.
    await page.evaluate(() => window.__gardenQA.camera([-10.5, 4.2, -5.3], [-8, 0.8, -2.5]));
    // High-tier plant models stream only after their projected-size threshold
    // is crossed. Frame idleness is not a load signal: WebKit can stop drawing
    // while GLTFLoader is still fetching/decoding the requested tier.
    try {
      await page.waitForFunction(() => window.__gardenQA?.snapshot().lod.high > 0, null, { timeout: 30000 });
    } catch {
      const state = await snapshot(page);
      throw new Error(`${name}: zoom did not render high-detail geometry within 30s (LOD ${JSON.stringify(state.lod)}; plant GLBs ${JSON.stringify(state.assets.filter((asset) => /models\/landscape\/.*\.glb/.test(asset.url)).map((asset) => asset.url))})`);
    }
    await settle(page);
    const close = await snapshot(page);
    assert.ok(close.lod.high > 0, `${name}: zoom loads the high-detail geometry tier`);
    const moving = await observeMovingBudget(page, [-9.8, 4.2, -5.3], [-8, 0.8, -2.5], compactDevice ? 0.95 : 1.3);
    assert.ok(moving.dpr <= (compactDevice ? 0.95 : 1.3), `${name}: interaction has a smaller pixel budget (${moving.dpr}x)`);
    await page.waitForTimeout(1100);
    assert.equal((await snapshot(page)).dpr, overview.dpr, `${name}: full resolution returns after interaction`);

    await page.goto(`${base}/?view=model&camera=garden&zone=central-core&gardenQA=1`);
    await settle(page);
    const garden = await snapshot(page);
    assert.ok(overview.triangles < 5_000_000 && garden.triangles < 8_000_000, `${name}: distant geometry stays within the triangle budget`);
    const performance = await page.evaluate(() => window.__gardenQA.renderSample(20));
    await page.screenshot({ path: `${directory}/${name}-garden.jpg`, quality: 88 });
    if (engine === chromium) {
      await page.waitForFunction(() => window.__gardenQA.pickTarget(), null, { timeout: 20000 });
      const pick = await page.evaluate(() => window.__gardenQA.pickTarget());
      assert.ok(pick, `${name}: instanced plant picking remains available`);
      await page.mouse.click(pick.x, pick.y);
      await page.locator('.garden-plant-label').waitFor();
      await page.getByRole('button', { name: 'Close plant details', exact: true }).click();
    }
    await page.goto(`${base}/?view=model&camera=room&zone=north-extension&gardenQA=1`);
    await settle(page);
    const room = await snapshot(page);
    assert.ok(room.triangles < 250_000, `${name}: hidden room geometry is not submitted`);
    await page.screenshot({ path: `${directory}/${name}-kitchen.jpg`, quality: 88 });
    assert.ok(room.camera.every((n, i) => Math.abs(n - [-3.3, 2.35, -1.9][i]) < 0.02), `${name}: room camera retained (${room.camera.join(', ')})`);
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
    const planMoving = await observeMovingBudget(page, [0, 19.5, 0.01], [0, 0, 0], compactDevice ? 0.95 : 1.3);
    assert.ok(planMoving.dpr <= (compactDevice ? 0.95 : 1.3), `${name}: orthographic interaction adapts resolution`);
    await page.waitForTimeout(800);
    assert.equal((await snapshot(page)).dpr, overview.dpr, `${name}: orthographic zoom restores resolution`);
    await page.locator('canvas').first().evaluate((element) => element.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
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
