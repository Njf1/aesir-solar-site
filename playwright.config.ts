import {defineConfig} from '@playwright/test';
import {launchOptions} from './scripts/browser-options.mjs';
export default defineConfig({testDir:'tests/browser',workers:1,timeout:45000,use:{baseURL:'http://127.0.0.1:4173',launchOptions}});
