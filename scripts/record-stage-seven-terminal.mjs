import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchOptions } from './browser-options.mjs';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(project, 'docs/experience/stage-seven/terminal-verified');
const origin = process.env.EXPERIENCE_PREVIEW_ORIGIN || 'http://127.0.0.1:4173';
const selected = process.env.REVIEW_VIEWS?.split(',');
const requestedHold = 3.085;
await mkdir(directory, { recursive: true });
const sourceHashes = {};
for (const file of ['src/experience/render-detail.ts', 'src/experience/scene.ts', 'src/experience/energy-flow.ts', 'scripts/record-stage-seven-terminal.mjs']) {
  sourceHashes[file] = createHash('sha256').update(await readFile(path.join(project, file))).digest('hex');
}
const browser = await chromium.launch(launchOptions);
const report = { recordedAt: new Date().toISOString(), browser: browser.version(), measurement: 'Desktop Chromium viewport emulation, DPR 1 for all views; not a physical-phone or frame-time benchmark.', requestedHold, holdMs: 5200, sourceHashes, views: [] };
async function snapshot(page) {
  return page.evaluate(() => {
    const s = window.__experience.snapshot();
    return { browserMs: performance.now(), ready: s.ready, failed: s.failed, renderedProgress: s.renderedProgress, scene: s.shot.scene, camera: s.shot.camera, target: s.shot.target, ambientTime: s.ambientTime, copy: s.copyOpacities, siteStatus: s.siteStatus, cellStatus: s.cellStatus, electricalStatus: s.electricalStatus, dcFlow: s.dcFlow, framing: s.framing };
  });
}
async function move(page, progress, terminal = false) {
  await page.evaluate(p => {
    const journey = document.querySelector('#journey');
    scrollTo(0, p / 6.08 * (journey.offsetHeight - innerHeight));
  }, progress);
  await page.waitForFunction(({ progress, terminal }) => {
    const s = window.__experience?.snapshot();
    return s && !s.failed && Math.abs(s.renderedProgress - progress) < .002
      && s.siteStatus === 'ready' && s.cellStatus === 'ready' && s.electricalStatus === 'ready'
      && (!terminal || (s.renderedProgress >= 3.08 && s.shot.scene === 'site' && s.dcFlow?.visible && s.dcFlow.opacity > 0));
  }, { progress, terminal }, { timeout: 25000 });
}
async function travel(page, from, to, duration) {
  return page.evaluate(({ from, to, duration }) => new Promise(resolve => {
    const start = performance.now(), samples = [];
    let previous = -1000;
    function step(now) {
      const t = Math.min(1, (now - start) / duration), requested = from + (to - from) * t;
      const journey = document.querySelector('#journey');
      scrollTo(0, requested / 6.08 * (journey.offsetHeight - innerHeight));
      if (now - previous > 180) {
        const s = window.__experience.snapshot();
        samples.push({ ms: now - start, requested, actual: s.renderedProgress, scene: s.shot.scene, camera: s.shot.camera, target: s.shot.target, copy: s.copyOpacities, dcFlow: s.dcFlow, failed: s.failed });
        previous = now;
      }
      if (t < 1) requestAnimationFrame(step);
      else resolve({ startMs: start, duration, samples });
    }
    requestAnimationFrame(step);
  }), { from, to, duration });
}
try {
  for (const [name, width, height] of [['laptop', 1280, 720], ['desktop', 1600, 1000], ['mobile', 390, 844], ['intermediate', 740, 900], ['short', 1000, 500]].filter(view => !selected || selected.includes(view[0]))) {
    const r = { name, width, height, deviceScaleFactor: 1, errors: [], warnings: [], blocked: [], holdSamples: [] };
    report.views.push(r);
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, recordVideo: { dir: directory, size: { width, height } } });
    const page = await context.newPage();
    try {
      page.on('pageerror', error => r.errors.push(error.message));
      page.on('console', message => {
        if (message.type() === 'warning') r.warnings.push(message.text());
        if (message.type() === 'error') r.errors.push(message.text());
      });
      await page.route('**/*', route => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin === origin && !url.pathname.startsWith('/api/') && request.method() === 'GET') return route.continue();
        r.blocked.push(request.url());
        return route.abort();
      });
      await page.goto(`${origin}/?inspect=1`);
      await page.waitForFunction(() => window.__experience?.snapshot().ready, undefined, { timeout: 15000 });
      await move(page, requestedHold, true);
      r.before = await snapshot(page);
      for (let sample = 0; sample < 5; sample++) {
        await page.waitForTimeout(1040);
        r.holdSamples.push(await snapshot(page));
      }
      r.after = r.holdSamples.at(-1);
      assert(r.holdSamples.every(s => s.scene === 'site' && s.renderedProgress >= 3.08 && s.dcFlow.visible && s.dcFlow.opacity > 0 && !s.failed));
      assert.equal(r.before.renderedProgress, r.after.renderedProgress);
      assert(r.after.ambientTime > r.before.ambientTime, 'Ambient time must advance through the hold');
      r.image = path.relative(project, path.join(directory, `${name}-steady-terminal.png`));
      await page.screenshot({ path: path.join(project, r.image) });
      await move(page, 3.015);
      r.slowPass = { label: 'verified-contact-dc', from: 3.015, to: 3.23, forward: await travel(page, 3.015, 3.23, 6500) };
      await move(page, 3.23, true);
      r.slowPass.reverse = await travel(page, 3.23, 3.015, 4800);
      await move(page, 3.015);
      r.final = await snapshot(page);
      assert.equal(r.final.scene, 'cell');
      assert(r.slowPass.forward.samples.concat(r.slowPass.reverse.samples).every(s => !s.failed));
      assert.equal(r.errors.length, 0);
      assert.equal(r.warnings.length, 0);
    } catch (error) {
      r.failure = String(error);
      throw error;
    } finally {
      const video = page.video();
      await context.close();
      if (video) {
        const original = await video.path();
        const destination = path.join(directory, `${name}-hold-forward-reverse.webm`);
        await video.saveAs(destination);
        if (path.resolve(original) !== path.resolve(destination)) await unlink(original);
        r.video = path.relative(project, destination);
      }
      await writeFile(path.join(directory, 'observations.json'), JSON.stringify(report, null, 2) + '\n');
    }
    console.log(JSON.stringify({ name, progress: r.before.renderedProgress, scene: r.before.scene, dcFlow: r.before.dcFlow, ambientDelta: r.after.ambientTime - r.before.ambientTime, errors: r.errors, warnings: r.warnings }));
  }
} finally {
  await writeFile(path.join(directory, 'observations.json'), JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
