// Run against npm run dev. Uses an optional external Playwright installation.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.RENDER_BASE_URL || 'http://localhost:3000';
const directory = process.env.RENDER_ARTIFACT_DIR || 'artifacts/walkthrough';
fs.mkdirSync(directory, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { errors: [], cases: [] };
const snapshot = (page) => page.evaluate(() => window.__gardenQA.snapshot());
const distance = (a, b) => Math.hypot(...a.map((value, i) => value - b[i]));
async function ready(page) {
  await page.waitForFunction(() => window.__gardenQA?.snapshot().calls > 0 && !document.querySelector('.is-model-loading'));
  await page.getByRole('button', { name: 'Reset position', exact: true }).waitFor();
  await page.waitForTimeout(800);
}
function watch(page) {
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
  watch(page);
  await page.goto(`${base}/?view=model&camera=overview&gardenQA=1`);
  await page.waitForFunction(() => window.__gardenQA?.snapshot().calls > 0 && !document.querySelector('.is-model-loading'));
  await page.getByRole('button', { name: 'Explore', exact: true }).click();
  await ready(page);
  assert.ok(page.url().includes('camera=walk'));
  assert.equal((await snapshot(page)).cameraType, 'PerspectiveCamera');
  const pad = page.getByRole('group', { name: 'Move and look', exact: true });
  assert.equal(await pad.isVisible(), false, 'Desktop movement pad is tucked away');
  await page.getByRole('button', { name: 'Movement pad', exact: true }).click();
  assert.equal(await pad.isVisible(), true, 'Movement pad remains available');
  await page.getByRole('button', { name: 'Movement pad', exact: true }).click();
  const start = (await snapshot(page)).camera;
  assert.ok(Math.abs(start[1] - 1.75) < 0.01, 'Eye height above existing floor');
  const canvas = page.locator('canvas').first();
  await canvas.focus();
  await page.keyboard.down('s'); await page.waitForTimeout(500); await page.keyboard.up('s');
  assert.ok(distance(start, (await snapshot(page)).camera) > 0.1, 'WASD moves camera');
  await page.waitForTimeout(200);
  const stopped = (await snapshot(page)).camera;
  await page.waitForTimeout(300);
  assert.ok(distance(stopped, (await snapshot(page)).camera) < 0.001, 'Key release stops movement');
  await page.keyboard.down('w'); await page.waitForTimeout(150);
  await page.getByRole('button', { name: 'Controls', exact: true }).focus();
  await page.waitForTimeout(150);
  const blurred = (await snapshot(page)).camera;
  await page.waitForTimeout(250); await page.keyboard.up('w');
  assert.ok(distance(blurred, (await snapshot(page)).camera) < 0.001, 'Focus loss clears movement');
  await page.getByRole('button', { name: 'Reset position', exact: true }).click();
  assert.ok(distance(start, (await snapshot(page)).camera) < 0.001, 'Reset returns to entrance');
  const rect = await canvas.boundingBox();
  const beforeLook = (await snapshot(page)).direction;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down(); await page.mouse.move(rect.x + rect.width / 2 + 100, rect.y + rect.height / 2 + 30, { steps: 10 }); await page.mouse.up();
  assert.ok(distance(beforeLook, (await snapshot(page)).direction) > 0.1, 'Drag looks around');
  assert.ok(page.url().includes('camera=walk'), 'Dragging does not select a room');
  await page.getByRole('button', { name: 'Reset position', exact: true }).click();
  // Cross the sofa's footprint, which used to trap the first-person camera.
  await page.goto(`${base}/?view=model&camera=walk&zone=central-core&gardenQA=1`); await ready(page);
  await page.evaluate(() => window.__gardenQA.camera([1, 1.75, 1.75], [1, 1.75, .75]));
  await canvas.focus(); await page.keyboard.down('w');
  await page.waitForFunction(() => window.__gardenQA.snapshot().camera[2] < -.25, null, { timeout: 10000 });
  await page.keyboard.up('w');
  assert.ok(Math.abs((await snapshot(page)).camera[1] - 1.75) < .001, 'Furniture does not raise or trap the camera');
  report.cases.push('FPS passes through furniture at stable eye height');
  // Place the camera before the bedroom door; controller heading remains north.
  // Side-step east through this exact measured opening with doors open/closed.
  await page.goto(`${base}/?view=model&camera=walk&zone=central-core&gardenQA=1`); await ready(page);
  await page.evaluate(() => window.__gardenQA.camera([1.65, 1.75, .75], [1.65, 1.75, -.25]));
  await canvas.focus(); await page.keyboard.down('d'); await page.waitForFunction(() => window.__gardenQA.snapshot().camera[0] > 2.12, null, { timeout: 8000 }); await page.keyboard.up('d');
  assert.ok((await snapshot(page)).camera[0] > 2.12, 'Open bedroom doorway permits passage');
  await page.getByRole('button', { name: 'Controls', exact: true }).click();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Close controls', exact: true }).click();
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__gardenQA.camera([1.65, 1.75, .75], [1.65, 1.75, -.25]));
  await canvas.focus(); await page.keyboard.down('d'); await page.waitForTimeout(950); await page.keyboard.up('d');
  assert.ok((await snapshot(page)).camera[0] < 1.7, 'Closed bedroom door blocks passage');
  await page.evaluate(() => window.__gardenQA.camera([1.25, 1.75, 1.6], [1.25, 1.75, .6]));
  await canvas.focus(); await page.keyboard.down('d'); await page.waitForTimeout(800); await page.keyboard.up('d');
  assert.ok((await snapshot(page)).camera[0] < 1.7, 'Solid partition blocks passage');
  report.cases.push('desktop input, focus cleanup, drag look, reset, open door, closed door, wall collision');
  for (const zone of ['north-extension', 'central-core', 'southwest-room', 'east-upper-room', 'east-lower-room', 'service-core', 'ensuite']) {
    await page.goto(`${base}/?view=model&camera=walk&zone=${zone}&gardenQA=1`); await ready(page);
    const surfaces = await page.evaluate(() => window.__gardenQA.surfaces());
    // This walkthrough stays on the default oak floor; mineral is the optional
    // microtopping finish and is checked by the mood-material verifier.
    for (const id of ['oak', 'plaster', 'linen']) assert.ok(surfaces.some(s => s.surface === id && s.loaded), `${zone}: ${id} mood texture loaded`);
    await page.screenshot({ path: `${directory}/${zone}.png` });
    report.cases.push(`${zone}: walk entry and mood textures`);
  }
  await page.getByRole('button', { name: 'Explore', exact: true }).click();
  await page.waitForTimeout(700);
  assert.ok(page.url().includes('camera=overview'));
  assert.ok((await snapshot(page)).target, 'Orbit controls restored');
  await page.getByRole('button', { name: 'Controls', exact: true }).click();
  await page.getByRole('group', { name: 'Camera view', exact: true }).getByRole('button', { name: 'Plan', exact: true }).click();
  await page.getByRole('button', { name: 'Close controls', exact: true }).click();
  await page.getByRole('button', { name: 'Explore', exact: true }).click();
  await ready(page);
  assert.equal((await snapshot(page)).cameraType, 'PerspectiveCamera', 'Plan to walk restores perspective camera');
  report.cases.push('orbit and orthographic plan transitions');
  await page.close();
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }); watch(mobile);
  await mobile.goto(`${base}/?view=model&camera=walk&gardenQA=1`); await ready(mobile);
  assert.equal(await mobile.getByRole('button', { name: 'Explore', exact: true }).isVisible(), true, 'Mobile explore option remains visible');
  const before = (await snapshot(mobile)).camera;
  await mobile.getByRole('button', { name: 'Walk backward', exact: true }).tap();
  await mobile.waitForTimeout(300);
  // A held touch uses real pointer capture, independent of click event details.
  const button = await mobile.getByRole('button', { name: 'Walk backward', exact: true }).boundingBox();
  const cdp = await mobile.context().newCDPSession(mobile);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: button.x + 22, y: button.y + 22 }] });
  await mobile.waitForTimeout(500);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.ok(distance(before, (await snapshot(mobile)).camera) > 0.1, 'Touch control moves camera');
  const after = (await snapshot(mobile)).camera; await mobile.waitForTimeout(250);
  assert.ok(distance(after, (await snapshot(mobile)).camera) < .001, 'Touch release stops');
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Mobile controls fit viewport');
  await mobile.screenshot({ path: `${directory}/mobile.png` });
  report.cases.push('mobile touch movement, release and layout'); await mobile.close();
  assert.deepEqual(report.errors, [], 'No shader or browser errors');
  report.passed = true;
} catch (error) { report.passed = false; report.failure = error.stack; process.exitCode = 1; }
finally { fs.writeFileSync(`${directory}/report.json`, JSON.stringify(report, null, 2)); console.log(JSON.stringify(report)); await browser.close(); }
