import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';
// Use Playwright's matching browser when installed; an explicit local binary can also be supplied.
let executablePath=process.env.EXPERIENCE_BROWSER;
if(!executablePath && existsSync(chromium.executablePath()))executablePath=chromium.executablePath();
if(!executablePath && process.platform==='darwin'){
 const cache=path.join(homedir(),'Library/Caches/ms-playwright');
 try{for(const item of readdirSync(cache).filter(x=>/^chromium-\d+$/.test(x)).sort((a,b)=>Number(b.split('-')[1])-Number(a.split('-')[1]))){
  const candidate=path.join(cache,item,'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
  if(existsSync(candidate)){executablePath=candidate;break;}
 }}catch{}
}
export const launchOptions={headless:true,...(executablePath?{executablePath}:{}),args:process.platform==='darwin'?['--use-angle=metal']:[]};
