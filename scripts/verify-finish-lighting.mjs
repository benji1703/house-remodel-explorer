// Requires a development server and Playwright; records reviewable lighting scenes.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {PNG} = createRequire(process.env.PLAYWRIGHT_MODULE ? `${process.env.PLAYWRIGHT_MODULE}/package.json` : import.meta.url)('pngjs');
const directory = process.env.RENDER_ARTIFACT_DIR || '/tmp/house-finish-lighting';
const base = process.env.RENDER_BASE_URL || 'http://localhost:3000';
fs.mkdirSync(directory, {recursive:true});
const browser = await chromium.launch({channel:'chrome',headless:true});
const report = {errors:[],scenes:[]};
try {
  for (const mobile of [false,true]) {
    const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:960},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
    page.on('pageerror',e=>report.errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
    await page.goto(`${base}/?camera=walk&zone=central-core&gardenQA=1`);
    await page.waitForFunction(()=>window.__gardenQA?.snapshot().calls>0&&!document.querySelector('.is-model-loading'));
    const means={};
    for(const [label,hour] of [['Soft daylight','13.5'],['Golden hour','17.25'],['Evening glow','21']]) {
      await page.getByRole('button',{name:'Controls',exact:true}).click();
      await page.getByRole('button',{name:label,exact:true}).click();
      assert.equal(await page.locator('#sun-hour').inputValue(),hour);
      assert.equal(await page.getByRole('button',{name:label,exact:true}).getAttribute('aria-pressed'),'true');
      await page.getByRole('button',{name:'Close controls',exact:true}).click();
      await page.waitForTimeout(1500);
      const buffer=await page.locator('canvas').screenshot({style:'* { visibility: hidden !important; } canvas { visibility: visible !important; }'});
      const {data}=PNG.sync.read(buffer);
      let luminance=0;for(let i=0;i<data.length;i+=4)luminance+=data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722;
      means[label]=luminance/(data.length/4);
      await page.screenshot({path:`${directory}/${mobile?'mobile':'desktop'}-${hour}.png`});
    }
    assert.ok(means['Soft daylight']>145,'Pale finishes remain bright in the ceilinged interior');
    assert.ok(means['Evening glow']>40,'Evening scene remains navigable');
    assert.ok(means['Soft daylight']>means['Evening glow'],'Day and evening remain distinct');
    await page.getByRole('button',{name:'Controls',exact:true}).click();
    await page.locator('#sun-hour').fill('0');
    await page.getByRole('group',{name:'House lights',exact:true}).getByRole('button',{name:'Off',exact:true}).click();
    await page.getByRole('button',{name:'Close controls',exact:true}).click();await page.waitForTimeout(1200);
    const {data}=PNG.sync.read(await page.locator('canvas').screenshot({style:'* { visibility: hidden !important; } canvas { visibility: visible !important; }'}));
    let maxMean=0;for(let i=0;i<data.length;i+=4)maxMean+=Math.max(data[i],data[i+1],data[i+2]);
    assert.ok(maxMean/(data.length/4)<1,'All presentation bounce switches off at night with house lights');
    report.scenes.push({profile:mobile?'mobile':'desktop',means});await page.close();
  }
  assert.deepEqual(report.errors,[]);report.passed=true;
} catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1}
finally{fs.writeFileSync(`${directory}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close()}
