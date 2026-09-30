// Run against npm run dev; PLAYWRIGHT_MODULE may point to an external installation.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const directory = 'artifacts/interior-styling';
const base = process.env.RENDER_BASE_URL || 'http://localhost:3000';
const report = { errors: [], cases: [] };
const browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE } : { channel: 'chrome' }), headless: true });
async function settle(page) {
  await page.waitForFunction(() => window.__gardenQA?.snapshot().target && !document.querySelector('.is-model-loading'));
  await page.waitForFunction(() => window.__gardenQA.interiors().every(p => p.loaded));
  await page.waitForTimeout(1600);
}
function watch(page) {
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
  page.on('response', r => { if(r.status() >= 400 && /\.(glb|ktx2)/.test(r.url())) report.errors.push(`${r.status()} ${r.url()}`); });
}
function verifyOpenings(openings) {
  assert.ok(openings.length === 18, 'All exterior and internal openings inspected');
  for (const { name, opening, frame, wallContact, kind, thickness } of openings) {
    const expected = [-opening.width/2, opening.sill, opening.width/2, opening.head];
    const actual = [frame.min[0], frame.min[1], frame.max[0], frame.max[1]];
    actual.forEach((value,i) => assert.ok(Math.abs(value-expected[i]) < .00001, `${name}: frame meets opening edge ${i}`));
    assert.ok(wallContact.every(Boolean), `${name}: solid wall touches both jambs and head`);
    if (kind === 'door') assert.ok(Math.abs(frame.max[2]-frame.min[2]-thickness) < .00001, `${name}: jamb spans full partition depth`);
  }
}
try {
  const page = await browser.newPage({ viewport:{ width:1440, height:960 }, reducedMotion:'reduce' });
  watch(page);
  for (const [name,zone,expected] of [
    ['living','central-core',['tailored-linen-sofa','living-rug','linen-lounge-chair','oak-coffee-table','coffee-still-life','reading-lamp']],
    ['kitchen','north-extension',['kitchen-preparation','kitchen-herbs','oak-counter-stool']],
    ['master','southwest-room',['bed-linen','bedside-reading']],
    ['guest','east-upper-room',['bed-linen']],
    ['east-bedroom','east-lower-room',['bed-linen']],
    ['bathroom','service-core',['bath-linen']],
  ]) {
    await page.goto(`${base}/?view=model&camera=room&zone=${zone}&gardenQA=1`);
    await settle(page);
    const props = await page.evaluate(() => window.__gardenQA.interiors());
    for(const asset of expected) assert.ok(props.some(p=>p.asset===asset&&p.loaded),`${name}: ${asset} loaded`);
    verifyOpenings(await page.evaluate(() => window.__gardenQA.openings()));
    const shadowRevision = await page.evaluate(() => window.__gardenQA.snapshot().contactShadowRevision);
    assert.ok(shadowRevision > 0, `${name}: contact shadows refreshed after room props loaded`);
    if (name === 'living') {
      const doors = await page.evaluate(() => window.__gardenQA.glazedDoors());
      assert.ok(doors.length > 0, 'Glazed exterior doors are inspected');
      assert.ok(doors.every(door => door.hits.includes('glazed-door-pane')), 'Exterior door leaves retain a clear glazed opening');
    }
    await page.screenshot({path:`${directory}/${name}.png`});
    report.cases.push({name, props:props.map(p=>({asset:p.asset,owner:p.owner})),snapshot:await page.evaluate(()=>window.__gardenQA.snapshot())});
  }
  await page.goto(`${base}/?view=model&camera=room&zone=central-core&gardenQA=1`);
  await settle(page);
  await page.getByRole('button',{name:'Furniture',exact:true}).click();
  await page.locator('.furniture-select select').selectOption('living-coffee-table');
  const before = await page.evaluate(()=>window.__gardenQA.interiors().find(p=>p.asset==='coffee-still-life'));
  assert.equal(before.owner,'living-coffee-table');
  await page.locator('.furniture-dimensions input').nth(0).fill('150');
  await page.waitForTimeout(300);
  const resized = await page.evaluate(()=>window.__gardenQA.interiors().find(p=>p.asset==='coffee-still-life'));
  assert.ok(Math.abs((resized.bounds.max[0]-resized.bounds.min[0])/(before.bounds.max[0]-before.bounds.min[0])-1.25)<.001,'Tabletop props resize with table');
  await page.getByRole('button',{name:'Remove piece',exact:true}).click();
  assert.ok(!(await page.evaluate(()=>window.__gardenQA.interiors())).some(p=>p.owner==='living-coffee-table'),'Removing table removes its props');
  await page.getByRole('button',{name:'Restore piece',exact:true}).click();
  await page.getByRole('button',{name:'Reset piece',exact:true}).click();
  await page.getByRole('button',{name:'Close furniture editor',exact:true}).click();
  report.cases.push({name:'editable-table', resizeAndRemoval:true});
  await page.getByRole('button',{name:'Use lighter rendering'}).click();
  await settle(page);
  const light = await page.evaluate(()=>window.__gardenQA.snapshot());
  assert.ok(light.assets.some(p=>p.url.includes('tailored-linen-sofa-light.glb')),'Light profile loads the simplified sofa');
  await page.screenshot({path:`${directory}/living-light.png`});
  report.cases.push({name:'living-light',snapshot:light});
  await page.getByRole('button',{name:'Survey shell',exact:true}).click();
  await settle(page);
  assert.equal((await page.evaluate(()=>window.__gardenQA.interiors())).length,0,'Survey mode excludes styling');
  report.cases.push({name:'survey-shell', stylingAbsent:true});
  await page.goto(`${base}/?view=model&camera=plan&gardenQA=1`);
  await settle(page);
  assert.equal(await page.evaluate(()=>window.__gardenQA.snapshot().cameraType),'OrthographicCamera');
  verifyOpenings(await page.evaluate(()=>window.__gardenQA.openings()));
  await page.screenshot({path:`${directory}/orthographic.png`});
  report.cases.push({name:'orthographic', allFrameContacts:true});
  await page.goto(`${base}/?view=plan`);
  await page.getByRole('tab',{name:'Source proof',exact:true}).click();
  await page.getByRole('button',{name:'Overlay',exact:true}).click();
  // The source proof artifact registers four scan anchors; the interactive
  // comparison controls intentionally start at independent, user-adjustable scales.
  await page.goto('about:blank');
  await page.setContent(`<html><body style="margin:0;background:#faf7ef">${fs.readFileSync(`${directory}/source-overlay.svg`, 'utf8')}</body></html>`);
  await page.screenshot({path:`${directory}/measured-overlay.png`, fullPage:true});
  await page.close();
  const mobile = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  watch(mobile);
  await mobile.goto(`${base}/?view=model&camera=room&zone=north-extension&gardenQA=1`);
  await settle(mobile);
  assert.equal(await mobile.locator('button[aria-label="Use lighter rendering"]').getAttribute('aria-pressed'),'true');
  const snapshot=await mobile.evaluate(()=>window.__gardenQA.snapshot());
  assert.ok(snapshot.assets.some(p=>p.url.includes('kitchen-preparation-light.glb')),'Mobile receives light assets');
  assert.ok(!snapshot.assets.some(p=>/models\/interior\/(bed-|bath-)/.test(p.url)),'Unvisited room props are not loaded');
  await mobile.screenshot({path:`${directory}/mobile-kitchen.png`});
  report.cases.push({name:'mobile-kitchen',snapshot});
  await mobile.close();
  assert.deepEqual(report.errors,[]);
  report.passed=true;
} catch(error) {
  report.passed=false;report.failure=error.stack;process.exitCode=1;
} finally {
  fs.writeFileSync(`${directory}/verification.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.passed,failure:report.failure,cases:report.cases.map(c=>c.name),errors:report.errors}));
  await browser.close();
}
