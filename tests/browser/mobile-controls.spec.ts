import {test} from '@playwright/test';
import {controlsTests} from './helpers/mobile-controls';
test.use({isMobile:true,hasTouch:true,deviceScaleFactor:2});
controlsTests('chromium');
