// Local dev regression: PLAYWRIGHT_MODULE=/absolute/path/to/playwright node scripts/verify-render-upgrade.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.RENDER_BASE_URL || 'http://localhost:3000';
const directory = process.env.RENDER_ARTIFACT_DIR || 'artifacts/render-upgrade/camera';
fs.mkdirSync(directory, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { browser: await browser.version(), errors: [], cases: [] };
const closeTo = (actual, expected, label) => {
  assert.ok(actual?.length === expected.length && actual.every((n, i) => Math.abs(n - expected[i]) < 0.015),
    `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
};
async function snapshot(page) { return page.evaluate(() => window.__gardenQA.snapshot()); }
async function settle(page) {
  await page.waitForFunction(() => window.__gardenQA?.snapshot().target);
  await page.waitForTimeout(1400);
}
try {
  for (const reducedMotion of ['reduce', 'no-preference']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1, reducedMotion });
    const page = await context.newPage();
    page.on('pageerror', (error) => report.errors.push(error.message));
    await page.goto(`${base}/?view=model&camera=room&zone=north-extension&gardenQA=1`);
    await settle(page);
    const initial = await snapshot(page);
    await page.screenshot({ path: `${directory}/kitchen-${reducedMotion}.png` });
    closeTo(initial.camera, [-3.3, 2.35, -1.9], 'Kitchen side camera');
    closeTo(initial.target, [-0.2, 1.2, -4.6], 'Kitchen side target');
    await page.locator('.kitchen-view-strip button').filter({ hasText: 'Island' }).click();
    await settle(page);
    const island = await snapshot(page);
    closeTo(island.camera, [1.75, 2.05, -1.9], 'Island camera');
    closeTo(island.target, [-0.15, 1.25, -4.8], 'Island target');
    await page.locator('.kitchen-view-strip button').filter({ hasText: 'Side view' }).click();
    await settle(page);
    closeTo((await snapshot(page)).target, initial.target, 'Return to side target');
    const canvas = page.locator('canvas').first();
    await canvas.focus();
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(350);
    const orbited = await snapshot(page);
    assert.notDeepEqual(orbited.camera, initial.camera, 'Keyboard orbit moves camera');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(500);
    closeTo((await snapshot(page)).camera, orbited.camera, 'Resize retains orbit');
    await page.getByRole('button', { name: 'Return to the main house overview', exact: true }).click();
    await settle(page);
    const overview = await snapshot(page);
    closeTo(overview.camera, [-13.8, 16.4, -10.4], 'Overview camera');
    closeTo(overview.target, [-0.55, 0.32, 0.55], 'Overview target');
    report.cases.push({ reducedMotion, initial: { camera: initial.camera, target: initial.target }, island: { camera: island.camera, target: island.target }, keyboardOrbit: true, resizeRetainsOrbit: true, overview: true });
    await context.close();
  }
  assert.deepEqual(report.errors, [], 'No browser page errors');
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
