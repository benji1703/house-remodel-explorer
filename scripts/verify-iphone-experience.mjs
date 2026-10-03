// PLAYWRIGHT_MODULE=/path/to/playwright node scripts/verify-iphone-experience.mjs
// WebKit emulates iPhone layout/touch, not the performance of a physical phone.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const { chromium, webkit } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.RENDER_BASE_URL || 'http://localhost:3000';
const directory = process.env.RENDER_ARTIFACT_DIR || '/tmp/house-iphone-experience';
fs.mkdirSync(directory, { recursive: true });
const report = { cases: [], errors: [] };
const snapshot = page => page.evaluate(() => window.__gardenQA.snapshot());
async function ready(page) {
  await page.waitForFunction(() => document.querySelector('.app-body.is-model') && window.__gardenQA?.snapshot().calls > 0 &&
    !document.querySelector('.app-body.is-model-loading, .scene-transition-status, [data-lighting-loading]'), null, { timeout: 60000 });
}
async function idle(page) {
  let frames = (await snapshot(page)).frames;
  let stable = 0;
  for (let i = 0; i < 80; i++) {
    await page.waitForTimeout(150);
    const next = (await snapshot(page)).frames;
    stable = frames === next ? stable + 1 : 0;
    frames = next;
    if (stable >= 6) return;
  }
  assert.fail('The view never stopped rendering while idle');
}
async function capture(page, name) {
  await page.screenshot({ path: `${directory}/${name}.jpg`, quality: 90 });
}
async function checkPhoneLayout(page) {
  const layout = await page.evaluate(() => ({
    width: innerWidth,
    contentWidth: document.documentElement.scrollWidth,
    toolbarBlur: getComputedStyle(document.querySelector('.stage-toolbar')).backdropFilter,
    targets: [...document.querySelectorAll('.stage-toolbar button, .room-chip, .tab-item, .experience-close, .quality-options button')]
      .map(element => ({ label: element.textContent.trim() || element.getAttribute('aria-label'),
        width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }))
      .filter(target => target.width > 0 && target.height > 0),
  }));
  assert.ok(layout.contentWidth <= layout.width, 'The phone layout must not overflow horizontally');
  assert.equal(layout.toolbarBlur, 'none', 'Phone overlays must not continuously filter the canvas');
  assert.ok(layout.targets.every(target => target.height >= 44), `Small touch targets: ${JSON.stringify(layout.targets.filter(target => target.height < 44))}`);
  return layout;
}
const engines = [['webkit-mobile', webkit], ['chromium-mobile', chromium]]
  .filter(([name]) => !process.env.RENDER_BROWSERS || process.env.RENDER_BROWSERS.split(',').includes(name));
for (const [name, engine] of engines) {
  const browser = await engine.launch(engine === chromium ? { channel: 'chrome' } : {});
  let release;
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3,
      isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.on('pageerror', error => report.errors.push({ browser: name, message: error.message }));
    page.on('console', message => {
      if (message.type() === 'error' && /WebGL|THREE|Maximum update|Cannot update|shader/i.test(message.text())) {
        report.errors.push({ browser: name, message: message.text() });
      }
    });
    page.on('response', response => {
      if (response.status() >= 400 && /\.(glb|ktx2|jpe?g|webp)/.test(response.url())) {
        report.errors.push({ browser: name, asset: response.url(), status: response.status() });
      }
    });
    const held = new Promise(resolve => { release = resolve; });
    await page.route(/\.(glb|jpe?g|png|webp)(\?.*)?$/, async route => { await held; await route.continue().catch(() => {}); });
    await page.goto(`${base}/?gardenQA=1`, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('.stage.is-model').count(), 1, 'Default opens the full-house 3D view');
    const cover = page.locator('.scene-loading-cover:not(.is-revealed)');
    await cover.waitFor({ timeout: 60000 });
    assert.ok(await cover.getByText('Downloading the room materials', { exact: false }).isVisible());
    const initialLoading = await cover.locator('.loading-card').boundingBox();
    await cover.locator('.loading-wait-note').getByText('Loading for', { exact: false }).waitFor({ timeout: 12000 });
    const waitingLoading = await cover.locator('.loading-card').boundingBox();
    assert.ok(Math.abs(initialLoading.y - waitingLoading.y) < 2 && Math.abs(initialLoading.height - waitingLoading.height) < 2,
      'Long-wait feedback must not jump the loading layout');
    const progress = cover.getByRole('progressbar');
    const value = Number(await progress.getAttribute('aria-valuenow'));
    assert.ok(value >= 0 && value < 100, 'An unfinished download must not display completion');
    assert.match(await progress.getAttribute('aria-valuetext'), /\d+ of \d+ scene files loaded/);
    await capture(page, `${name}-slow-loading`);
    await context.setOffline(true);
    await cover.getByText('You are offline.', { exact: false }).waitFor();
    await capture(page, `${name}-offline`);
    await context.setOffline(false);
    release();
    await ready(page);
    await page.waitForTimeout(3000);
    await idle(page);
    const overview = await snapshot(page);
    assert.equal(overview.shadowType, 2, 'High detail uses filtered shadows');
    assert.deepEqual(overview.sunShadowMapSize, [1024, 1024], 'Mobile retains a detailed shadow map');
    const layout = await checkPhoneLayout(page);
    const controlClicks = [];
    for (let i = 0; i < 3; i++) {
      await idle(page);
      const measurement = await page.evaluate(async () => {
        const frames = window.__gardenQA.snapshot().frames;
        const started = performance.now();
        document.querySelector('.controls-trigger').click();
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return { ms: performance.now() - started, frames: window.__gardenQA.snapshot().frames - frames };
      });
      assert.equal(measurement.frames, 0, 'Opening Controls must not redraw the scene');
      controlClicks.push(measurement);
      await page.getByRole('button', { name: 'Close controls', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    const quality = page.locator('.quality-control');
    assert.equal(await quality.getByRole('button', { name: 'High', exact: true }).getAttribute('aria-pressed'), 'true');
    await checkPhoneLayout(page);
    assert.ok(await quality.evaluate(element => {
      const box = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
    }), '3D labels must not appear above the controls');
    await capture(page, `${name}-controls`);
    await quality.getByRole('button', { name: 'Faster', exact: true }).click();
    await ready(page);
    assert.equal(await quality.getByRole('button', { name: 'Faster', exact: true }).getAttribute('aria-pressed'), 'true');
    await quality.getByRole('button', { name: 'High', exact: true }).click();
    await ready(page);
    assert.equal(await quality.getByRole('button', { name: 'High', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Close controls', exact: true }).click();
    const typography = await page.evaluate(async () => {
      await document.fonts.ready;
      const families = ['--font-sans', '--font-display'].flatMap(variable => getComputedStyle(document.body)
        .getPropertyValue(variable).split(',').map(family => family.trim().replace(/['"]/g, '')));
      return {
        body: getComputedStyle(document.body).fontFamily,
        labels: [...document.querySelectorAll('.stage-toolbar button, .room-chip, .tab-item')]
          .filter(element => element.getBoundingClientRect().height > 0)
          .map(element => ({ label: element.textContent.trim(), size: parseFloat(getComputedStyle(element).fontSize) })),
        faces: [...document.fonts].filter(font => families.includes(font.family.replace(/['"]/g, '')))
          .map(font => ({ family: font.family, status: font.status, display: font.display })),
      };
    });
    assert.ok(typography.labels.every(label => label.size >= 11), 'Phone navigation labels must be legible');
    assert.ok(typography.faces.every(font => font.display === 'optional' || /Fallback/.test(font.family)), 'Fonts must not swap late during loading');
    await page.getByRole('button', { name: 'Finishes', exact: true }).click();
    assert.equal(await page.locator('.scene-transition-status').count(), 0, 'Tapping the selected mode must not start an endless loader');
    await page.getByRole('button', { name: 'Shell', exact: true }).click();
    await ready(page);
    await page.getByRole('button', { name: 'Shell', exact: true }).click();
    assert.equal(await page.locator('.scene-transition-status').count(), 0);
    // Reverse a pending change before its expensive work begins.
    await page.evaluate(async () => {
      const finishes = document.querySelector('.segmented button:nth-child(2)');
      const shell = document.querySelector('.segmented button:first-child');
      finishes.click();
      await new Promise(resolve => requestAnimationFrame(resolve));
      shell.click();
    });
    await ready(page);
    assert.equal(await page.getByRole('button', { name: 'Shell', exact: true }).getAttribute('aria-pressed'), 'true', 'The latest tap must win');
    await page.getByRole('button', { name: 'Finishes', exact: true }).click();
    await ready(page);
    await page.getByRole('button', { name: 'Explore', exact: true }).click();
    await page.locator('.app-body.is-walk').waitFor();
    await ready(page);
    await capture(page, `${name}-explore`);
    await page.getByRole('button', { name: 'Return to the main house overview', exact: true }).click();
    await ready(page);
    assert.match(page.url(), /camera=overview/, 'Back to house must restore the full overview on phones');
    await page.getByRole('group', { name: 'Rooms', exact: true }).getByRole('button', { name: 'LR Living', exact: true }).click();
    await ready(page);
    await idle(page);
    await capture(page, `${name}-living`);
    const gpu = await page.evaluate(() => window.__gardenQA.gpu());
    assert.equal(gpu.contextLost, false);
    assert.equal(gpu.linkedProgramCount, gpu.programCount, 'Every rendered shader must link');
    assert.deepEqual(gpu.errors, [], 'No WebGL errors');
    // A newer tab selection must cancel scene navigation queued by a room tap.
    await page.evaluate(() => {
      document.querySelector('.room-chip').click();
      [...document.querySelectorAll('.tab-bar button')].find(button => button.textContent.trim() === 'Plan').click();
    });
    await page.locator('.app-body.is-plan').waitFor();
    await page.waitForTimeout(600);
    assert.equal(await page.locator('.app-body.is-plan').count(), 1, 'An older room request must not override the selected Plan tab');
    await idle(page);
    const paused = (await snapshot(page)).frames;
    await page.waitForTimeout(600);
    assert.equal((await snapshot(page)).frames, paused, 'The hidden viewer must stay paused');
    assert.equal(await page.locator('canvas').count(), 1, 'Returning to House should reuse its WebGL context');
    for (const [label, view] of [['Mood', 'references'], ['Materials', 'materials'], ['Products', 'sourcebook'], ['Plants', 'plants']]) {
      await page.locator('.tab-bar').getByRole('button', { name: label, exact: true }).click();
      await page.locator(`.app-body.is-${view}`).waitFor();
      await page.waitForTimeout(600);
      assert.equal((await snapshot(page)).frames, paused, `${label} must keep the hidden viewer paused`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label} must fit the phone`);
      await capture(page, `${name}-${view}`);
    }
    await page.locator('.tab-bar').getByRole('button', { name: 'House', exact: true }).click();
    await ready(page);
    assert.match(page.url(), /camera=overview/);
    await page.locator('.tab-bar').getByRole('button', { name: 'Plants', exact: true }).click();
    await page.locator('.app-body.is-plants').waitFor();
    // Returning to the already selected tab also cancels a queued House request.
    await page.evaluate(() => {
      const tabs = [...document.querySelectorAll('.tab-bar button')];
      tabs.find(button => button.textContent.trim() === 'House').click();
      tabs.find(button => button.textContent.trim() === 'Plants').click();
    });
    await page.waitForTimeout(600);
    assert.equal(await page.locator('.app-body.is-plants').count(), 1, 'The latest same-tab selection must win');
    await page.locator('.tab-bar').getByRole('button', { name: 'House', exact: true }).click();
    await ready(page);
    await idle(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const motion = await page.evaluate(async () => {
      const poses = [];
      const intervals = [];
      const started = performance.now();
      let last = started;
      let lastPose = -100;
      const initial = window.__gardenQA.snapshot().camera;
      [...document.querySelectorAll('.room-chip')].find(button => button.querySelector('em')?.textContent === 'LR').click();
      await new Promise(resolve => {
        const sample = now => {
          intervals.push(now - last); last = now;
          if (now - lastPose >= 75) {
            const scene = window.__gardenQA.snapshot();
            poses.push({ ms: now - started, camera: scene.camera, dpr: scene.dpr });
            lastPose = now;
          }
          if (now - started < 1400) requestAnimationFrame(sample);
          else resolve();
        };
        requestAnimationFrame(sample);
      });
      return { initial, poses, maximumRafGapMs: Math.max(...intervals), method: 'Emulated phone on host GPU, normal motion; timing is diagnostic, not physical iPhone performance' };
    });
    await ready(page);
    await idle(page);
    const destination = (await snapshot(page)).camera;
    const distance = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]));
    assert.ok(distance(motion.initial, destination) > 1, 'Normal-motion navigation reaches another viewpoint');
    assert.ok(motion.poses.filter(pose => distance(pose.camera, motion.initial) > 0.1 && distance(pose.camera, destination) > 0.1).length >= 3,
      'Phone room navigation must animate through intermediate camera positions');
    assert.ok(motion.poses.some(pose => pose.dpr < overview.dpr), 'Moving navigation adapts its pixel budget');
    assert.equal((await snapshot(page)).dpr, overview.dpr, 'Settled navigation restores sharpness');
    await capture(page, `${name}-normal-motion-living`);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('button', { name: 'Return to the main house overview', exact: true }).click();
    await ready(page);
    await idle(page);
    await page.setViewportSize({ width: 320, height: 568 });
    await ready(page);
    await checkPhoneLayout(page);
    await capture(page, `${name}-small-phone`);
    await page.setViewportSize({ width: 844, height: 390 });
    if (engine === chromium) {
      // Reapply the intended touch profile after Chrome viewport emulation.
      const client = await context.newCDPSession(page);
      await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    }
    await ready(page);
    const landscape = await page.evaluate(() => ({ coarse: matchMedia('(pointer: coarse)').matches,
      touchPoints: navigator.maxTouchPoints, width: innerWidth, mobileRail: getComputedStyle(document.querySelector('.mobile-room-rail')).display }));
    // Desktop WebKit reports maxTouchPoints=0 even with hasTouch emulation.
    assert.ok(landscape.coarse, `Landscape verification must exercise coarse-pointer CSS: ${JSON.stringify(landscape)}`);
    assert.notEqual(landscape.mobileRail, 'none', 'Touch landscape must retain the phone navigation');
    await page.getByRole('button', { name: 'Controls', exact: true }).click();
    const close = page.getByRole('button', { name: 'Close controls', exact: true });
    await page.locator('.experience-dock').evaluate(element => { element.scrollTop = element.scrollHeight; });
    assert.ok(await close.isVisible(), 'Landscape controls must remain dismissible');
    assert.ok(await close.evaluate(element => {
      const box = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
    }), 'Close controls must remain reachable after scrolling the landscape panel');
    await capture(page, `${name}-landscape-controls`);
    await close.click();
    report.cases.push({ browser: name, passed: true, layout, landscape, typography, initialLoading, waitingLoading, controlClicks, overview, gpu, motion });
    console.log(`${name}: loading, reconnect, touch layout, quality, repeated/rapid taps, explore, rooms and paused viewer passed`);
  } catch (error) {
    report.cases.push({ browser: name, passed: false, message: error.message });
    process.exitCode = 1;
    console.error(`${name}: ${error.message}`);
  } finally {
    release?.();
    await browser.close();
    fs.writeFileSync(`${directory}/report.json`, JSON.stringify(report, null, 2));
  }
}
if (report.errors.length) { process.exitCode = 1; console.error(report.errors); }
