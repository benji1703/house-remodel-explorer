// Run against npm run dev. Captures and checks actual fixture shadows and door travel.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const directory = process.env.RENDER_ARTIFACT_DIR || '/tmp/house-practical-lighting';
fs.mkdirSync(directory, {recursive: true});
const browser = await chromium.launch({channel: 'chrome', headless: true});
async function look(page, position, target) {
  await page.evaluate(([p,t]) => window.__gardenQA.camera(p,t), [position, target]);
  await page.waitForTimeout(100);
  const direction = await page.evaluate(() => window.__gardenQA.snapshot().direction);
  const currentYaw = Math.atan2(-direction[0], -direction[2]);
  const desiredYaw = Math.atan2(position[0]-target[0], position[2]-target[2]);
  const difference = Math.atan2(Math.sin(desiredYaw-currentYaw), Math.cos(desiredYaw-currentYaw));
  const rect = await page.locator('canvas').first().boundingBox();
  const delta = -difference / .004;
  const startX = delta > 0 ? rect.x + 100 : rect.x + rect.width - 100;
  const y = rect.y + rect.height / 2;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX + delta, y, {steps: 12});
  await page.mouse.up();
}
const errors = [];
const cases = [];
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 960}, reducedMotion: 'reduce'});
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${process.env.RENDER_BASE_URL || 'http://localhost:3000'}/?view=model&camera=walk&zone=central-core&gardenQA=1`, {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => window.__gardenQA?.lighting().fixtures.length === 6 && !document.querySelector('.is-model-loading'));
  const qualityToggle = page.locator('button[aria-label="Toggle rendering detail"]');
  await page.getByRole('button', {name: 'Controls', exact: true}).click({noWaitAfter: true});
  await page.getByRole('button', {name: 'Evening glow', exact: true}).click({noWaitAfter: true});
  const allDoors = page.getByRole('group', {name: 'Set all doors', exact: true});
  await allDoors.getByRole('button', {name: 'Open', exact: true}).click({noWaitAfter: true});
  await page.waitForFunction(() => window.__gardenQA.lighting().doors.every(d => Math.abs(Math.abs(d.angle) - Math.PI / 2) < .005));
  await page.getByRole('button', {name: 'Close controls', exact: true}).click({noWaitAfter: true});
  for (const quality of ['high', 'light']) {
    const light = await qualityToggle.getAttribute('aria-pressed') === 'true';
    if (light !== (quality === 'light')) await qualityToggle.click({noWaitAfter: true});
    await page.waitForFunction(() => {
      const report = window.__gardenQA.lighting();
      return report.fixtures.length === 6 && report.sources.length >= 6 && report.shadowsEnabled && report.sources.filter(l => l.intensity > 0).every(l => l.castShadow && l.shadowMapAllocated);
    });
    const lighting = await page.evaluate(() => window.__gardenQA.lighting());
    assert.equal(lighting.fixtures.length, 6);
    assert.ok(lighting.doors.length >= 5);
    assert.ok(lighting.sources.every(l => l.type === 'SpotLight'), 'No unoccluded point/window-fill lights');
    for (const fixture of lighting.fixtures) assert.ok(lighting.sources.some(l => l.name === fixture.id && l.intensity > 0), `${fixture.id}: visible fixture has an active light`);
    await look(page, [1.15, 1.75, 2.9], [2.7, 1.75, 3.25]);
    await page.waitForTimeout(700);
    await page.screenshot({path: `${directory}/hallway-${quality}.png`});
    await look(page, [.65, 1.75, 5.37], [-.7, 1.75, 5.37]);
    await page.waitForTimeout(700);
    await page.screenshot({path: `${directory}/sconce-${quality}.png`});
    cases.push({quality, lighting});
  }
  await page.getByRole('button', {name: 'Controls', exact: true}).click({noWaitAfter: true});
  await page.getByRole('group', {name: 'House lights', exact: true}).getByRole('button', {name: 'Off', exact: true}).click({noWaitAfter: true});
  await page.waitForFunction(() => window.__gardenQA.lighting().sources.every(l => l.intensity === 0));
  await allDoors.getByRole('button', {name: 'Close', exact: true}).click({noWaitAfter: true});
  await page.waitForFunction(() => window.__gardenQA.lighting().doors.every(d => Math.abs(d.angle) < .005));
  cases.push({name: 'lights-off-and-doors-closed', passed: true});
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({passed: true, cases: cases.map(c => c.quality || c.name), errors}));
  fs.writeFileSync(`${directory}/report.json`, JSON.stringify({passed: true, cases, errors}, null, 2));
} finally { await browser.close(); }
