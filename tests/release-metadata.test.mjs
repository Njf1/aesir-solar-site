import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseMetadata,publicSitemap,publicRobots} from '../scripts/release-metadata.mjs';
const html='<head><meta name="robots" content="noindex, nofollow"><link rel="canonical" href="https://aesirsolar.co.uk/apply.html"></head>';
test('only production changes indexing; private form and receipt remain noindex',()=>{assert.equal(releaseMetadata(html,'index',false),html);assert.match(releaseMetadata(html,'index',true),/index, follow/);for(const slug of ['apply','success'])assert.match(releaseMetadata(html,slug,true),/content="noindex, follow"/);assert.equal((releaseMetadata(html,'index',true).match(/rel="canonical"/g)||[]).length,1);assert.match(releaseMetadata(html,'experience',true),/href="https:\/\/aesirsolar.co.uk\/"/);assert.doesNotMatch(publicSitemap,/vercel|wp-content|\/apply|\/success/);assert.match(publicRobots,/Disallow: \/api\//);});
