// PLAYWRIGHT_MODULE=/path/to/playwright node scripts/verify-night-lighting.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { PNG } = createRequire(process.env.PLAYWRIGHT_MODULE ? `${process.env.PLAYWRIGHT_MODULE}/package.json` : import.meta.url)('pngjs');
const browser = await chromium.launch({ channel: 'chrome' });
const directory = process.env.RENDER_ARTIFACT_DIR || '/tmp/house-night-lighting';
fs.mkdirSync(directory, { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${process.env.RENDER_BASE_URL || 'http://localhost:3000'}/?view=model&camera=room&zone=central-core&gardenQA=1`);
  await page.waitForFunction(() => window.__gardenQA?.snapshot().renderer, { timeout: 60000 });
  await page.getByRole('button', { name: 'Controls', exact: true }).click();
  await page.getByRole('group', { name: 'House lights', exact: true }).getByRole('button', { name: 'Off', exact: true }).click();
  const samples = [];
  for (const hour of [12, 24, 0]) {
    await page.locator('#sun-hour').fill(String(hour));
    await page.waitForTimeout(1800);
    const buffer = await page.locator('canvas').screenshot({ style: '* { visibility: hidden !important; } canvas { visibility: visible !important; }' });
    const { data } = PNG.sync.read(buffer);
    let sum = 0, lit = 0;
    for (let i = 0; i < data.length; i += 4) { const value = Math.max(data[i], data[i+1], data[i+2]); sum += value; if (value > 5) lit++; }
    const pixels = { mean: sum / (data.length / 4), litFraction: lit / (data.length / 4) };
    await page.screenshot({ path: `${directory}/hour-${hour}.png` });
    samples.push({ hour, ...pixels });
  }
  console.log(samples);
  assert.ok(samples[0].mean > 20, 'day remains lit');
  assert.ok(samples[1].mean < 1 && samples[1].litFraction < 0.01, 'midnight is black with lights off');
  assert.ok(Math.abs(samples[1].mean - samples[2].mean) < 0.1, '00 and 24 match');
  const before = await page.evaluate(() => window.__gardenQA.snapshot().frames);
  await page.waitForTimeout(700);
  assert.equal(await page.evaluate(() => window.__gardenQA.snapshot().frames), before, 'idle rendering stops');
  await page.getByRole('group', { name: 'House lights', exact: true }).getByRole('button', { name: 'On', exact: true }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${directory}/night-lights-on.png` });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ samples, idle: 'passed', errors }, null, 2));
} finally { await browser.close(); }
