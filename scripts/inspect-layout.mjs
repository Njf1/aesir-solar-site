import {chromium} from '@playwright/test';
import {launchOptions} from './browser-options.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch(launchOptions);
const observations=[];
for(const [name,viewport] of [['desktop',{width:1600,height:1000}],['mobile',{width:390,height:844}]]){
 const page=await browser.newPage({viewport});
 await page.goto('http://127.0.0.1:4173/experience?inspect=1');await page.waitForFunction(()=>window.__experience.snapshot().ready);
 await page.locator('.skip-link').click();await page.screenshot({path:`docs/experience/captures/${name}-bridge.png`});
 observations.push({name,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),focus:await page.evaluate(()=>document.activeElement?.id)});
 await page.close();
 const still=await browser.newPage({viewport,javaScriptEnabled:false});await still.goto('http://127.0.0.1:4173/experience');await still.screenshot({path:`docs/experience/captures/${name}-fallback.png`});
 observations.push({name:`${name}-fallback`,loaded:await still.locator('.scene-fallback img').evaluate(e=>e.complete&&e.naturalWidth>0)});await still.close();
}
// 800x500 CSS pixels represents the usable viewport of a 1600x1000 display at 200% page zoom.
const zoom=await browser.newPage({viewport:{width:800,height:500}});await zoom.goto('http://127.0.0.1:4173/experience');await zoom.locator('.skip-link').click();observations.push({name:'200-percent-equivalent-layout',overflow:await zoom.evaluate(()=>document.documentElement.scrollWidth>innerWidth),ctaCount:await zoom.locator('a[href="/apply.html"]').count()});
await browser.close();await writeFile('docs/experience/layout-observations.json',JSON.stringify(observations,null,2));console.log(observations);
